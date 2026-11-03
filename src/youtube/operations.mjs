import { createHash } from 'node:crypto';
import { classifyPlaylist, normalizeAccount, normalizePlaylist, normalizePlaylistItem } from './normalize.mjs';
import { YouTubeCompat } from './compat.mjs';
import { normalizePlaylistId, normalizeVideoIds } from './ids.mjs';

const MAX_LIMIT = 100;
// Upper bound for whole-playlist reads (stats, clean-up); YouTube caps playlists at 5,000 videos.
const MAX_SCAN_ITEMS = 5000;
const SPEEDS = [1.25, 1.5, 2];
const CLEANUP_REASONS = ['duplicate', 'unavailable', 'watched'];
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
        const video = normalizePlaylistItem(raw);
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
  async #allItems(playlistId) {
    const first = await this.#openPlaylist(playlistId);
    const items = [];
    let current = first;
    for (;;) {
      for (const raw of current.videos || current.items || []) {
        const video = normalizePlaylistItem(raw);
        if (video.id) items.push({ ...video, position: items.length + 1 });
      }
      if (items.length >= MAX_SCAN_ITEMS || !current.has_continuation) break;
      current = await current.getContinuation();
    }
    return { first, items, truncated: Boolean(current.has_continuation) && items.length >= MAX_SCAN_ITEMS };
  }
  async playlistStats(playlistId, { watchedThreshold = 90 } = {}) {
    playlistId = normalizePlaylistId(playlistId);
    const { first, items, truncated } = await this.#allItems(playlistId);
    const seconds = items.reduce((sum, v) => sum + (v.duration_seconds || 0), 0);
    const remaining = items.reduce((sum, v) => sum + (v.duration_seconds || 0) * (1 - Math.min(100, v.percent_watched) / 100), 0);
    const counts = new Map();
    for (const v of items) counts.set(v.id, (counts.get(v.id) || 0) + 1);
    const channels = new Map();
    for (const v of items) {
      const key = v.channel || '(unknown)';
      const entry = channels.get(key) || { channel: key, videos: 0, seconds: 0 };
      entry.videos += 1;
      entry.seconds += v.duration_seconds || 0;
      channels.set(key, entry);
    }
    return {
      playlist_id: playlistId,
      title: normalizePlaylist(first).title || first.info?.title || null,
      video_count: items.length,
      truncated,
      total_seconds: seconds,
      total_duration: formatDuration(seconds),
      unknown_duration_count: items.filter((v) => v.duration_seconds === null).length,
      watched_count: items.filter((v) => v.percent_watched >= watchedThreshold).length,
      partially_watched_count: items.filter((v) => v.percent_watched > 0 && v.percent_watched < watchedThreshold).length,
      remaining_seconds: Math.round(remaining),
      remaining_duration: formatDuration(remaining),
      remaining_at_speed: Object.fromEntries(SPEEDS.map((speed) => [`${speed}x`, formatDuration(remaining / speed)])),
      unavailable_count: items.filter((v) => v.playable === false).length,
      duplicate_count: [...counts.values()].reduce((sum, n) => sum + n - 1, 0),
      top_channels: [...channels.values()].sort((a, b) => b.videos - a.videos || b.seconds - a.seconds).slice(0, 10)
        .map((c) => ({ ...c, duration: formatDuration(c.seconds) }))
    };
  }
  async #cleanupPlan(playlistId, reasons, watchedThreshold) {
    const unknown = reasons.filter((reason) => !CLEANUP_REASONS.includes(reason));
    if (!reasons.length || unknown.length) throw new Error(`INVALID_ARGUMENT: remove must list one or more of ${CLEANUP_REASONS.join(', ')}`);
    const { items, truncated } = await this.#allItems(playlistId);
    const seen = new Set();
    const toRemove = [];
    for (const video of items) {
      // Keep the first occurrence of a duplicate; later copies are removed.
      const reason = reasons.includes('duplicate') && seen.has(video.id) ? 'duplicate'
        : reasons.includes('unavailable') && video.playable === false ? 'unavailable'
        : reasons.includes('watched') && video.percent_watched >= watchedThreshold ? 'watched'
        : null;
      seen.add(video.id);
      if (reason && video.set_video_id) {
        toRemove.push({ position: video.position, video_id: video.id, title: video.title, channel: video.channel, reason, set_video_id: video.set_video_id });
      }
    }
    // The token binds an apply call to exactly this preview of this playlist state.
    const token = createHash('sha256')
      .update(JSON.stringify([playlistId, reasons, watchedThreshold, toRemove.map((item) => item.set_video_id)]))
      .digest('hex').slice(0, 16);
    return { toRemove, token, scanned: items.length, truncated };
  }
  async previewCleanup(playlistId, { remove = [], watchedThreshold = 90 } = {}) {
    playlistId = normalizePlaylistId(playlistId);
    const plan = await this.#cleanupPlan(playlistId, [...new Set(remove)].sort(), watchedThreshold);
    return {
      playlist_id: playlistId,
      scanned: plan.scanned,
      truncated: plan.truncated,
      remove_count: plan.toRemove.length,
      to_remove: plan.toRemove.map(({ set_video_id: _setVideoId, ...item }) => item),
      plan_token: plan.token,
      editable: classifyPlaylist(playlistId) === 'playlist',
      next_step: plan.toRemove.length ? 'Call youtube_clean_playlist_apply with the same arguments and plan_token to remove exactly these videos.' : 'Nothing to remove.'
    };
  }
  async applyCleanup(playlistId, { remove = [], watchedThreshold = 90, planToken } = {}) {
    playlistId = this.#editableId(playlistId);
    const plan = await this.#cleanupPlan(playlistId, [...new Set(remove)].sort(), watchedThreshold);
    if (plan.token !== planToken) throw new Error('PLAN_CHANGED: the playlist or options changed since the preview; preview again');
    if (plan.toRemove.length) await this.compat.removeSetVideoIds(playlistId, plan.toRemove.map((item) => item.set_video_id));
    return { success: true, playlist_id: playlistId, operation: 'clean_playlist', removed: plan.toRemove.length };
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
function formatDuration(totalSeconds) {
  const seconds = Math.round(totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
