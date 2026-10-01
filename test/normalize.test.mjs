import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyPlaylist, normalizePlaylist, normalizeVideo } from '../src/youtube/normalize.mjs';

test('normalizes current LockupView playlist shape', () => {
  const value = { content_id: 'PLabc', content_type: 'PLAYLIST', metadata: { title: { text: 'Later' }, metadata_rows: [{ metadata_parts: [{ text: { text: 'Private' } }, { text: { text: '10 videos' } }] }] } };
  assert.deepEqual(normalizePlaylist(value), { id: 'PLabc', title: 'Later', type: 'PLAYLIST', kind: 'playlist', visibility: 'Private', video_count: 10, updated: null, editable: null, description: null });
});

test('normalizes legacy playlist endpoint fallback', () => assert.equal(normalizePlaylist({ playlist_id: 'PLold', title: 'Old' }).id, 'PLold'));

test('normalizes current video Lockup shape and set video id', () => {
  assert.deepEqual(normalizeVideo({ content_id: 'vid1', metadata: { title: { text: 'Video one' } }, set_video_id: 'set1' }), { id: 'vid1', title: 'Video one', set_video_id: 'set1' });
});

test('normalizes endpoint fallback', () => assert.deepEqual(normalizeVideo({ on_tap_endpoint: { payload: { videoId: 'v2' } }, overlay_metadata: { primary_text: { text: 'Short' } } }), { id: 'v2', title: 'Short', set_video_id: null }));

test('classifies special/system playlists', () => { assert.equal(classifyPlaylist('WL'), 'special'); assert.equal(classifyPlaylist('RDfoo'), 'system'); assert.equal(classifyPlaylist('PLfoo'), 'playlist'); });
