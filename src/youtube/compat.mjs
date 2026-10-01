import { normalizeVideo } from './normalize.mjs';

export class YouTubeCompat {
  constructor(youtube) { this.youtube = youtube; }

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
    let page = await this.youtube.getPlaylist(playlistId);
    const wanted = new Set(videoIds);
    const actions = [];
    const seen = new Set();
    for (let guard = 0; guard < 200; guard += 1) {
      for (const raw of page.videos || page.items || []) {
        const video = normalizeVideo(raw);
        if (video.id && wanted.has(video.id) && video.set_video_id && !seen.has(video.id)) {
          actions.push({ action: 'ACTION_REMOVE_VIDEO', setVideoId: video.set_video_id });
          seen.add(video.id);
        }
      }
      if (seen.size === wanted.size) break;
      if (!page.has_continuation) break;
      page = await page.getContinuation();
    }
    if (!actions.length || seen.size !== wanted.size) throw new Error('Given video ids were not found in this playlist.');
    await this.editPlaylist(playlistId, actions);
  }

  async deletePlaylist(playlistId) {
    return this.youtube.actions.execute('/playlist/delete', { playlistId });
  }
}
