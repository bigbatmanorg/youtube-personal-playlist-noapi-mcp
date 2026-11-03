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

function pagedPlaylist(pages) {
  const at = (index) => ({
    info: { title: 'Paged', total_items: '7 videos', is_editable: true },
    videos: pages[index].map((id) => ({ video_id: id, title: { text: id } })),
    has_continuation: index < pages.length - 1,
    getContinuation: async () => at(index + 1)
  });
  return { getPlaylist: async () => at(0) };
}

test('pages of `limit` videos span YouTube continuations without skipping items', async () => {
  const ops = new YouTubeOperations(pagedPlaylist([['a', 'b', 'c'], ['d', 'e', 'f'], ['g']]));
  const seen = [];
  let page = 1;
  for (;;) {
    const result = await ops.getPlaylist('PLtest', { limit: 2, page });
    seen.push(...result.videos.map((video) => video.id));
    if (!result.has_more) { assert.equal(result.next_page, null); break; }
    assert.equal(result.next_page, page + 1);
    page = result.next_page;
  }
  assert.deepEqual(seen, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
});

test('page past the end is empty and final', async () => {
  const result = await new YouTubeOperations(pagedPlaylist([['a']])).getPlaylist('PLtest', { limit: 5, page: 3 });
  assert.deepEqual(result.videos, []);
  assert.equal(result.has_more, false);
});

test('writes reject special playlists and normalize URLs before calling YouTube', async () => {
  const calls = [];
  const fake = { actions: { execute: async (...args) => { calls.push(args); return { success: true }; } } };
  const ops = new YouTubeOperations(fake);
  await assert.rejects(ops.addVideos('WL', ['dQw4w9WgXcQ']), /PLAYLIST_NOT_EDITABLE/);
  await ops.addVideos('https://www.youtube.com/playlist?list=PLabc123', ['https://youtu.be/dQw4w9WgXcQ']);
  assert.deepEqual(calls[0][1], { playlistId: 'PLabc123', actions: [{ action: 'ACTION_ADD_VIDEO', addedVideoId: 'dQw4w9WgXcQ' }] });
});
