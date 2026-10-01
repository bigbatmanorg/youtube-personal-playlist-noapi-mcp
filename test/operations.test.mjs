import test from 'node:test';
import assert from 'node:assert/strict';
import { YouTubeOperations } from '../src/youtube/operations.mjs';

test('returns normalized playlist list', async () => {
  const fake = { getPlaylists: async () => ({ playlists: [{ content_id: 'PL1', metadata: { title: { text: 'One' } } }] }) };
  const result = await new YouTubeOperations(fake).listPlaylists();
  assert.equal(result.playlists[0].id, 'PL1');
  assert.equal(result.playlists[0].title, 'One');
});

test('returns a bounded normalized playlist page', async () => {
  const fake = { getPlaylist: async () => ({ info: { title: 'Test', total_items: '3 videos', is_editable: true }, videos: [{ video_id: 'a', title: { text: 'A' } }, { video_id: 'b', title: { text: 'B' } }, { video_id: 'c', title: { text: 'C' } }], has_continuation: false }) };
  const result = await new YouTubeOperations(fake).getPlaylist('PLtest', { limit: 2 });
  assert.equal(result.playlist.id, 'PLtest');
  assert.equal(result.returned_count, 2);
  assert.equal(result.has_more, true);
  assert.equal(result.next_page, 2);
});
