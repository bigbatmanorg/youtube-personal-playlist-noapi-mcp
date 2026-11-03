import { z } from 'zod';
import { cookieStatus, parseCookieText, saveCookieText, cookieNames, detectCookieFormat } from './credentials.mjs';
import { createYouTubeFromHeader } from './session.mjs';
import { YouTubeOperations } from './youtube/operations.mjs';

// MCP annotations let clients decide which calls need user confirmation.
const READ = { readOnlyHint: true, openWorldHint: true };
const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true };
const IDEMPOTENT_WRITE = { ...WRITE, idempotentHint: true };
const DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true };

const playlistId = z.string().min(1).describe('Playlist ID or any YouTube URL with a list= parameter.');
const videoIds = z.array(z.string().min(1)).describe('Video IDs or YouTube video URLs (watch, youtu.be, shorts).');

export function registerTools(server, { cookieFile, sessions, guarded }) {
  const ops = async () => new YouTubeOperations(await sessions.get());
  const tool = (name, description, inputSchema, annotations, handler) =>
    server.registerTool(name, { description, inputSchema, annotations }, guarded(handler));

  tool('youtube_cookie_set', 'Store pasted YouTube cookies at the configured cookie path and verify login + playlist access.', {
    cookies: z.string().min(1)
  }, { ...IDEMPOTENT_WRITE, openWorldHint: false }, async ({ cookies }) => {
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
  });

  tool('youtube_cookie_status', 'Show where cookies are stored and test whether the stored cookies currently authenticate.', {}, READ, async () => {
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
  });

  tool('youtube_account_info', 'Get concise account identity for the authenticated YouTube session.', {}, READ, async () => (await ops()).accountInfo());
  tool('youtube_list_playlists', 'List account-visible playlists as compact normalized data.', {}, READ, async () => (await ops()).listPlaylists());
  tool('youtube_get_playlist', 'Get one page of a playlist. page is 1-based and counts pages of `limit` videos; request next_page while has_more is true.', {
    playlist_id: playlistId, limit: z.number().int().min(1).max(100).optional(), page: z.number().int().min(1).max(500).optional()
  }, READ, async ({ playlist_id, limit, page }) => (await ops()).getPlaylist(playlist_id, { limit, page }));
  tool('youtube_create_playlist', 'Create an editable playlist, optionally with initial videos.', {
    title: z.string().min(1).max(150), video_ids: videoIds.max(50).optional()
  }, WRITE, async ({ title, video_ids = [] }) => (await ops()).createPlaylist(title, video_ids));
  tool('youtube_delete_playlist', 'Delete an editable playlist. This is destructive and cannot be undone.', { playlist_id: playlistId }, DESTRUCTIVE,
    async ({ playlist_id }) => (await ops()).deletePlaylist(playlist_id));
  tool('youtube_rename_playlist', 'Rename an editable playlist.', { playlist_id: playlistId, name: z.string().min(1).max(150) }, IDEMPOTENT_WRITE,
    async ({ playlist_id, name }) => (await ops()).renamePlaylist(playlist_id, name));
  tool('youtube_set_playlist_description', 'Set an editable playlist description.', { playlist_id: playlistId, description: z.string().max(5000) }, IDEMPOTENT_WRITE,
    async ({ playlist_id, description }) => (await ops()).setPlaylistDescription(playlist_id, description));
  tool('youtube_add_videos', 'Add videos to an editable playlist.', { playlist_id: playlistId, video_ids: videoIds.min(1).max(50) }, WRITE,
    async ({ playlist_id, video_ids }) => (await ops()).addVideos(playlist_id, video_ids));
  tool('youtube_remove_videos', 'Remove videos from an editable playlist. Fails without changes if any requested video is not in the playlist.', {
    playlist_id: playlistId, video_ids: videoIds.min(1).max(50)
  }, DESTRUCTIVE, async ({ playlist_id, video_ids }) => (await ops()).removeVideos(playlist_id, video_ids));
}
