import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlaylistItem } from '../src/youtube/normalize.mjs';
import { YouTubeOperations } from '../src/youtube/operations.mjs';

const item = (id, setId, { seconds = 60, channel = 'Chan', playable = true, watched = 0 } = {}) => ({
  video_id: id,
  title: { text: `Video ${id}` },
  set_video_id: setId,
  duration: { text: '1:00', seconds },
  author: { name: channel, id: `UC${channel}` },
  is_playable: playable,
  video_info: { text: '1K views • 1 year ago' },
  thumbnail_overlays: watched ? [{ type: 'ThumbnailOverlayResumePlayback', percent_duration_watched: watched }] : []
});

function fakeYouTube(items, edits = []) {
  return {
    getPlaylist: async () => ({ info: { title: 'Mine', is_editable: true }, videos: items, has_continuation: false }),
    actions: { execute: async (...args) => { edits.push(args); return { success: true }; } }
  };
}

test('playlist items carry duration, channel, availability, progress and link', () => {
  const video = normalizePlaylistItem(item('aaaaaaaaaaa', 's1', { seconds: 125, watched: 40 }));
  assert.deepEqual(
    { duration_seconds: video.duration_seconds, channel: video.channel, playable: video.playable, percent_watched: video.percent_watched, url: video.url, info: video.info },
    { duration_seconds: 125, channel: 'Chan', playable: true, percent_watched: 40, url: 'https://youtu.be/aaaaaaaaaaa', info: '1K views • 1 year ago' }
  );
  const deleted = normalizePlaylistItem({ video_id: 'bbbbbbbbbbb', title: { text: '[Deleted video]' }, duration: { seconds: 0 }, author: { name: 'N/A', id: 'N/A' }, is_playable: false });
  assert.equal(deleted.duration_seconds, null);
  assert.equal(deleted.channel, null);
  assert.equal(deleted.playable, false);
});

test('stats total and remaining durations, speeds, duplicates, unavailable and channels', async () => {
  const ops = new YouTubeOperations(fakeYouTube([
    item('aaaaaaaaaaa', 's1', { seconds: 3600, watched: 100 }),
    item('bbbbbbbbbbb', 's2', { seconds: 1800, watched: 50, channel: 'Other' }),
    item('aaaaaaaaaaa', 's3', { seconds: 3600 }),
    item('ccccccccccc', 's4', { seconds: 0, playable: false })
  ]));
  const stats = await ops.playlistStats('PLmine');
  assert.equal(stats.video_count, 4);
  assert.equal(stats.total_duration, '2:30:00');
  assert.equal(stats.remaining_duration, '1:15:00');
  assert.equal(stats.remaining_at_speed['1.5x'], '0:50:00');
  assert.equal(stats.watched_count, 1);
  assert.equal(stats.partially_watched_count, 1);
  assert.equal(stats.duplicate_count, 1);
  assert.equal(stats.unavailable_count, 1);
  assert.equal(stats.unknown_duration_count, 1);
  assert.deepEqual(stats.top_channels[0], { channel: 'Chan', videos: 3, seconds: 7200, duration: '2:00:00' });
});

test('clean-up preview lists exact removals and apply removes only those', async () => {
  const edits = [];
  const ops = new YouTubeOperations(fakeYouTube([
    item('aaaaaaaaaaa', 's1'),
    item('bbbbbbbbbbb', 's2', { watched: 95 }),
    item('aaaaaaaaaaa', 's3'),
    item('ccccccccccc', 's4', { playable: false })
  ], edits));
  const preview = await ops.previewCleanup('PLmine', { remove: ['unavailable', 'duplicate'] });
  assert.deepEqual(preview.to_remove.map((x) => [x.position, x.reason]), [[3, 'duplicate'], [4, 'unavailable']]);
  assert.equal(preview.to_remove[0].set_video_id, undefined);
  assert.equal(edits.length, 0);
  await assert.rejects(ops.applyCleanup('PLmine', { remove: ['duplicate', 'unavailable'], planToken: 'stale' }), /PLAN_CHANGED/);
  const applied = await ops.applyCleanup('PLmine', { remove: ['duplicate', 'unavailable'], planToken: preview.plan_token });
  assert.equal(applied.removed, 2);
  assert.deepEqual(edits[0][1].actions, [{ action: 'ACTION_REMOVE_VIDEO', setVideoId: 's3' }, { action: 'ACTION_REMOVE_VIDEO', setVideoId: 's4' }]);
});

test('clean-up apply refuses a token from different options or special playlists', async () => {
  const ops = new YouTubeOperations(fakeYouTube([item('aaaaaaaaaaa', 's1', { watched: 95 })]));
  const preview = await ops.previewCleanup('PLmine', { remove: ['watched'] });
  await assert.rejects(ops.applyCleanup('PLmine', { remove: ['watched'], watchedThreshold: 99, planToken: preview.plan_token }), /PLAN_CHANGED/);
  const wl = await ops.previewCleanup('WL', { remove: ['watched'] });
  assert.equal(wl.editable, false);
  await assert.rejects(ops.applyCleanup('WL', { remove: ['watched'], planToken: wl.plan_token }), /PLAYLIST_NOT_EDITABLE/);
  await assert.rejects(ops.previewCleanup('PLmine', { remove: ['everything'] }), /INVALID_ARGUMENT/);
});
