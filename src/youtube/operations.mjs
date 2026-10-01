import { classifyPlaylist, normalizeAccount, normalizePlaylist, normalizeVideo } from './normalize.mjs';
import { YouTubeCompat } from './compat.mjs';

const MAX_LIMIT = 100;
export class YouTubeOperations {
  constructor(youtube) { this.youtube = youtube; this.compat = new YouTubeCompat(youtube); }
  async accountInfo() { return normalizeAccount(await this.youtube.account.getInfo()); }
  async listPlaylists() {
    const feed = await this.youtube.getPlaylists();
    return { playlists: (feed.playlists || []).map(normalizePlaylist).filter((playlist) => playlist.id && playlist.title) };
  }
  async getPlaylist(playlistId, { limit = 100, page = 1 } = {}) {
    limit = Math.min(Math.max(1, limit), MAX_LIMIT);
    let playlist = await this.#openPlaylist(playlistId);
    for (let current = 1; current < page; current += 1) {
      if (!playlist.has_continuation) return this.#result(playlistId, playlist, [], limit, page, false);
      playlist = await playlist.getContinuation();
    }
    return this.#result(playlistId, playlist, playlist.videos || playlist.items || [], limit, page, Boolean(playlist.has_continuation));
  }
  #result(playlistId, playlist, videos, limit, page, hasContinuation) {
    const base = normalizePlaylist(playlist);
    const returned = videos.slice(0, limit).map(normalizeVideo).filter((video) => video.id && video.title);
    const total = Number(String(playlist.info?.total_items || '').match(/[\d,]+/)?.[0]?.replaceAll(',', '')) || null;
    const hasMore = videos.length > limit || hasContinuation;
    return {
      playlist: {
        ...base,
        id: base.id || playlistId,
        title: base.title || playlist.info?.title || null,
        visibility: base.visibility || playlist.info?.privacy || null,
        video_count: base.video_count || total,
        updated: base.updated || playlist.info?.last_updated || null,
        editable: typeof playlist.info?.is_editable === 'boolean' ? playlist.info.is_editable : null
      },
      videos: returned,
      returned_count: returned.length,
      total_if_known: total,
      page,
      limit,
      has_more: hasMore,
      next_page: hasMore ? page + 1 : null
    };
  }
  async #openPlaylist(playlistId) {
    let lastError;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try { return await this.youtube.getPlaylist(playlistId); }
      catch (error) {
        lastError = error;
        if (!/does not exist|not found/i.test(String(error?.message || error)) || attempt === 5) throw error;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    throw lastError;
  }
  #assertEditableId(playlistId) {
    if (classifyPlaylist(playlistId) !== 'playlist') throw new Error('PLAYLIST_NOT_EDITABLE: special/system playlists cannot be modified');
  }
  async createPlaylist(title, videoIds = []) {
    const result = await this.youtube.playlist.create(title, videoIds);
    return { success: Boolean(result.success), playlist_id: result.playlist_id || null, operation: 'create_playlist' };
  }
  async deletePlaylist(playlistId) {
    this.#assertEditableId(playlistId);
    await this.compat.deletePlaylist(playlistId);
    return { success: true, playlist_id: playlistId, operation: 'delete_playlist' };
  }
  async renamePlaylist(playlistId, name) {
    this.#assertEditableId(playlistId);
    await this.compat.renamePlaylist(playlistId, name);
    return { success: true, playlist_id: playlistId, operation: 'rename_playlist', title: name };
  }
  async setPlaylistDescription(playlistId, description) {
    this.#assertEditableId(playlistId);
    await this.compat.setDescription(playlistId, description);
    return { success: true, playlist_id: playlistId, operation: 'set_playlist_description' };
  }
  async addVideos(playlistId, videoIds) {
    this.#assertEditableId(playlistId);
    await this.compat.addVideos(playlistId, videoIds);
    return { success: true, playlist_id: playlistId, operation: 'add_videos', requested: videoIds.length };
  }
  async removeVideos(playlistId, videoIds) {
    this.#assertEditableId(playlistId);
    await this.compat.removeVideos(playlistId, videoIds);
    return { success: true, playlist_id: playlistId, operation: 'remove_videos', requested: videoIds.length };
  }
}
