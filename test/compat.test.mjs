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
