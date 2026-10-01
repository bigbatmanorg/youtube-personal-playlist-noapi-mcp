import { z } from 'zod';
import { cookieStatus, parseCookieText, saveCookieText, cookieNames, detectCookieFormat } from './credentials.mjs';
import { createYouTubeFromHeader } from './session.mjs';
import { YouTubeOperations } from './youtube/operations.mjs';

export function registerTools(server, { cookieFile, sessions, guarded }) {
  const ops = async () => new YouTubeOperations(await sessions.get());

  server.tool('youtube_cookie_set', 'Store pasted YouTube cookies at the configured cookie path and verify login + playlist access.', {
    cookies: z.string().min(1)
  }, guarded(async ({ cookies }) => {
    const header = parseCookieText(cookies);
    const inputFormat = detectCookieFormat(cookies);
    const youtube = await createYouTubeFromHeader(header);
    const operations = new YouTubeOperations(youtube);
    const account = await operations.accountInfo();
    const { playlists } = await operations.listPlaylists();
    if (!playlists.length) throw new Error('UPSTREAM_REQUEST_FAILED: authenticated session returned no playlist feed');
    await saveCookieText(cookieFile, header);
    sessions.invalidate();
    return {
      success: true,
      authenticated: true,
      cookie_file: cookieFile,
      cookie_count: cookieNames(header).length,
      input_format: inputFormat,
      account_name: account.name,
      channel_handle: account.handle,
      playlist_count: playlists.length
    };
  }));

  server.tool('youtube_cookie_status', 'Show where cookies are stored and test whether the stored cookies currently authenticate.', {}, guarded(async () => {
    const status = await cookieStatus(cookieFile);
    if (!status.configured) return { ...status, authenticated: false };
    try {
      const operations = await ops();
      const account = await operations.accountInfo();
      const { playlists } = await operations.listPlaylists();
      return { ...status, authenticated: true, account_name: account.name, channel_handle: account.handle, playlist_count: playlists.length };
    } catch (error) {
      return { ...status, authenticated: false, error: String(error?.message || error).replace(/(?:SID|SAPISID|APISID|HSID|SSID|__Secure-[\w-]+)=([^;\s]+)/g, '[cookie redacted]') };
    }
  }));

  server.tool('youtube_account_info', 'Get concise account identity for the authenticated YouTube session.', {}, guarded(async () => (await ops()).accountInfo()));
  server.tool('youtube_list_playlists', 'List account-visible playlists as compact normalized data.', {}, guarded(async () => (await ops()).listPlaylists()));
  server.tool('youtube_get_playlist', 'Get one playlist page. page is 1-based; use next_page when has_more is true.', {
    playlist_id: z.string().min(1), limit: z.number().int().min(1).max(100).optional(), page: z.number().int().min(1).max(50).optional()
  }, guarded(async ({ playlist_id, limit, page }) => (await ops()).getPlaylist(playlist_id, { limit, page })));
  server.tool('youtube_create_playlist', 'Create an editable playlist.', {
    title: z.string().min(1).max(150), video_ids: z.array(z.string().min(1)).max(50).optional()
  }, guarded(async ({ title, video_ids = [] }) => (await ops()).createPlaylist(title, video_ids)));
  server.tool('youtube_delete_playlist', 'Delete an editable playlist. This is destructive.', { playlist_id: z.string().min(1) }, guarded(async ({ playlist_id }) => (await ops()).deletePlaylist(playlist_id)));
  server.tool('youtube_rename_playlist', 'Rename an editable playlist.', { playlist_id: z.string().min(1), name: z.string().min(1).max(150) }, guarded(async ({ playlist_id, name }) => (await ops()).renamePlaylist(playlist_id, name)));
  server.tool('youtube_set_playlist_description', 'Set an editable playlist description.', { playlist_id: z.string().min(1), description: z.string().max(5000) }, guarded(async ({ playlist_id, description }) => (await ops()).setPlaylistDescription(playlist_id, description)));
  server.tool('youtube_add_videos', 'Add video IDs to an editable playlist.', { playlist_id: z.string().min(1), video_ids: z.array(z.string().min(1)).min(1).max(50) }, guarded(async ({ playlist_id, video_ids }) => (await ops()).addVideos(playlist_id, video_ids)));
  server.tool('youtube_remove_videos', 'Remove video IDs from an editable playlist.', { playlist_id: z.string().min(1), video_ids: z.array(z.string().min(1)).min(1).max(50) }, guarded(async ({ playlist_id, video_ids }) => (await ops()).removeVideos(playlist_id, video_ids)));
}
