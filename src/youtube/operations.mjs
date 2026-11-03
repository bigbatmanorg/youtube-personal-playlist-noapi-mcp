import { classifyPlaylist, normalizeAccount, normalizePlaylist, normalizeVideo } from './normalize.mjs';
import { YouTubeCompat } from './compat.mjs';
import { normalizePlaylistId, normalizeVideoIds } from './ids.mjs';

const MAX_LIMIT = 100;
export class YouTubeOperations {
  constructor(youtube) { this.youtube = youtube; this.compat = new YouTubeCompat(youtube); }
  async accountInfo() { return normalizeAccount(await this.youtube.account.getInfo()); }
  async listPlaylists() {
    const feed = await this.youtube.getPlaylists();
    return { playlists: (feed.playlists || []).map(normalizePlaylist).filter((playlist) => playlist.id && playlist.title) };
  }
  async getPlaylist(playlistId, { limit = 100, page = 1 } = {}) {
    playlistId = normalizePlaylistId(playlistId);
    limit = Math.min(Math.max(1, limit), MAX_LIMIT);
    page = Math.max(1, page);
    // `page` counts pages of `limit` videos. YouTube continuations hold a different,
    // variable number of items, so collect continuations until this page is covered.
    const first = await this.#openPlaylist(playlistId);
    const start = (page - 1) * limit;
    const collected = [];
    let current = first;
    for (;;) {
      for (const raw of current.videos || current.items || []) {
        const video = normalizeVideo(raw);
        if (video.id) collected.push(video);
      }
      if (collected.length > start + limit || !current.has_continuation) break;
      current = await current.getContinuation();
    }
    const hasMore = collected.length > start + limit || Boolean(current.has_continuation);
    return this.#result(playlistId, first, collected.slice(start, start + limit), limit, page, hasMore);
  }
  #result(playlistId, playlist, returned, limit, page, hasMore) {
    const base = normalizePlaylist(playlist);
    const total = Number(String(playlist.info?.total_items || '').match(/[\d,]+/)?.[0]?.replaceAll(',', '')) || null;
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
  #editableId(playlistId) {
    const id = normalizePlaylistId(playlistId);
    if (classifyPlaylist(id) !== 'playlist') throw new Error('PLAYLIST_NOT_EDITABLE: special/system playlists cannot be modified');
    return id;
  }
  async createPlaylist(title, videoIds = []) {
    const result = await this.youtube.playlist.create(title, normalizeVideoIds(videoIds));
    return { success: Boolean(result.success), playlist_id: result.playlist_id || null, operation: 'create_playlist' };
  }
  async deletePlaylist(playlistId) {
    playlistId = this.#editableId(playlistId);
    await this.compat.deletePlaylist(playlistId);
    return { success: true, playlist_id: playlistId, operation: 'delete_playlist' };
  }
  async renamePlaylist(playlistId, name) {
    playlistId = this.#editableId(playlistId);
    await this.compat.renamePlaylist(playlistId, name);
    return { success: true, playlist_id: playlistId, operation: 'rename_playlist', title: name };
  }
  async setPlaylistDescription(playlistId, description) {
    playlistId = this.#editableId(playlistId);
    await this.compat.setDescription(playlistId, description);
    return { success: true, playlist_id: playlistId, operation: 'set_playlist_description' };
  }
  async addVideos(playlistId, videoIds) {
    playlistId = this.#editableId(playlistId);
    videoIds = normalizeVideoIds(videoIds);
    await this.compat.addVideos(playlistId, videoIds);
    return { success: true, playlist_id: playlistId, operation: 'add_videos', requested: videoIds.length };
  }
  async removeVideos(playlistId, videoIds) {
    playlistId = this.#editableId(playlistId);
    videoIds = normalizeVideoIds(videoIds);
    await this.compat.removeVideos(playlistId, videoIds);
    return { success: true, playlist_id: playlistId, operation: 'remove_videos', requested: videoIds.length };
  }
}
