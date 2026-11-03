import test from 'node:test';
import assert from 'node:assert/strict';
import { YouTubeCompat } from '../src/youtube/compat.mjs';

test('compat rename uses direct edit endpoint', async () => {
  const calls = [];
  const youtube = { actions: { execute: async (...args) => { calls.push(args); return { success: true }; } } };
  await new YouTubeCompat(youtube).renamePlaylist('PL1', 'New');
  assert.equal(calls[0][0], '/browse/edit_playlist');
  assert.deepEqual(calls[0][1], { playlistId: 'PL1', actions: [{ action: 'ACTION_SET_PLAYLIST_NAME', playlistName: 'New' }] });
});

test('compat delete uses direct delete endpoint', async () => {
  const calls = [];
  const youtube = { actions: { execute: async (...args) => { calls.push(args); return { success: true }; } } };
  await new YouTubeCompat(youtube).deletePlaylist('PL1');
  assert.deepEqual(calls[0], ['/playlist/delete', { playlistId: 'PL1' }]);
});

test('compat remove reports exactly which video IDs are missing and edits nothing', async () => {
  const calls = [];
  const youtube = {
    getPlaylist: async () => ({ videos: [{ video_id: 'aaaaaaaaaaa', set_video_id: 's1' }], has_continuation: false }),
    actions: { execute: async (...args) => { calls.push(args); } }
  };
  await assert.rejects(new YouTubeCompat(youtube, { retryDelayMs: 0 }).removeVideos('PL1', ['aaaaaaaaaaa', 'bbbbbbbbbbb']), /VIDEO_NOT_FOUND: not in this playlist: bbbbbbbbbbb/);
  assert.equal(calls.length, 0);
});

test('compat remove re-reads a stale playlist before reporting a video missing', async () => {
  const calls = [];
  const reads = [[], [{ video_id: 'aaaaaaaaaaa', set_video_id: 's1' }]];
  const youtube = {
    getPlaylist: async () => ({ videos: reads.shift() ?? [], has_continuation: false }),
    actions: { execute: async (...args) => { calls.push(args); } }
  };
  await new YouTubeCompat(youtube, { retryDelayMs: 0 }).removeVideos('PL1', ['aaaaaaaaaaa']);
  assert.deepEqual(calls[0][1], { playlistId: 'PL1', actions: [{ action: 'ACTION_REMOVE_VIDEO', setVideoId: 's1' }] });
});
