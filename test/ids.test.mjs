import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlaylistId, normalizeVideoId, normalizeVideoIds } from '../src/youtube/ids.mjs';

test('video IDs are accepted bare or from YouTube URLs', () => {
  const id = 'dQw4w9WgXcQ';
  for (const value of [id, `https://www.youtube.com/watch?v=${id}&t=3`, `https://youtu.be/${id}?si=x`, `https://www.youtube.com/shorts/${id}`, `https://music.youtube.com/watch?v=${id}`]) {
    assert.equal(normalizeVideoId(value), id, value);
  }
  assert.deepEqual(normalizeVideoIds([id, `https://youtu.be/${id}`]), [id]);
});

test('invalid video IDs and foreign hosts are rejected', () => {
  for (const value of ['short', 'https://evil.test/watch?v=dQw4w9WgXcQ', 'http://youtube.com/watch?v=dQw4w9WgXcQ']) {
    assert.throws(() => normalizeVideoId(value), /INVALID_ID/, value);
  }
});

test('playlist IDs are accepted bare or from list= URLs', () => {
  assert.equal(normalizePlaylistId('PLabc123'), 'PLabc123');
  assert.equal(normalizePlaylistId('WL'), 'WL');
  assert.equal(normalizePlaylistId('https://www.youtube.com/playlist?list=PLabc123'), 'PLabc123');
  assert.equal(normalizePlaylistId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc123'), 'PLabc123');
  assert.throws(() => normalizePlaylistId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), /INVALID_ID/);
});
