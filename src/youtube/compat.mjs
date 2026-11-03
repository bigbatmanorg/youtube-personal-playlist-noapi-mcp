import { normalizeVideo } from './normalize.mjs';

const REMOVE_LOOKUP_ATTEMPTS = 4;

export class YouTubeCompat {
  constructor(youtube, { retryDelayMs = 750 } = {}) { this.youtube = youtube; this.retryDelayMs = retryDelayMs; }

  async editPlaylist(playlistId, actions) {
    return this.youtube.actions.execute('/browse/edit_playlist', { playlistId, actions });
  }

  async renamePlaylist(playlistId, name) {
    await this.editPlaylist(playlistId, [{ action: 'ACTION_SET_PLAYLIST_NAME', playlistName: name }]);
  }

  async setDescription(playlistId, description) {
    await this.editPlaylist(playlistId, [{ action: 'ACTION_SET_PLAYLIST_DESCRIPTION', playlistDescription: description }]);
  }

  async addVideos(playlistId, videoIds) {
    await this.editPlaylist(playlistId, videoIds.map((id) => ({ action: 'ACTION_ADD_VIDEO', addedVideoId: id })));
  }

  async removeVideos(playlistId, videoIds) {
    const wanted = new Set(videoIds);
    let found = new Map();
    // Reads right after an add can be served by a stale replica, so re-read before
    // concluding that a requested video is not in the playlist.
    for (let attempt = 1; attempt <= REMOVE_LOOKUP_ATTEMPTS; attempt += 1) {
      found = await this.#findSetVideoIds(playlistId, wanted);
      if (found.size === wanted.size || attempt === REMOVE_LOOKUP_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs));
    }
    const missing = [...wanted].filter((id) => !found.has(id));
    if (missing.length) throw new Error(`VIDEO_NOT_FOUND: not in this playlist: ${missing.join(', ')}`);
    await this.editPlaylist(playlistId, [...found.values()].map((setVideoId) => ({ action: 'ACTION_REMOVE_VIDEO', setVideoId })));
  }

  async #findSetVideoIds(playlistId, wanted) {
    const found = new Map();
    let page = await this.youtube.getPlaylist(playlistId);
    for (let guard = 0; guard < 200; guard += 1) {
      for (const raw of page.videos || page.items || []) {
        const video = normalizeVideo(raw);
        if (video.id && wanted.has(video.id) && video.set_video_id && !found.has(video.id)) found.set(video.id, video.set_video_id);
      }
      if (found.size === wanted.size || !page.has_continuation) break;
      page = await page.getContinuation();
    }
    return found;
  }

  async removeSetVideoIds(playlistId, setVideoIds) {
    for (let i = 0; i < setVideoIds.length; i += 100) {
      await this.editPlaylist(playlistId, setVideoIds.slice(i, i + 100).map((setVideoId) => ({ action: 'ACTION_REMOVE_VIDEO', setVideoId })));
    }
  }

  async deletePlaylist(playlistId) {
    return this.youtube.actions.execute('/playlist/delete', { playlistId });
  }
}
