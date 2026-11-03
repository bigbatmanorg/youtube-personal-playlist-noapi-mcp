import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanError } from '../src/youtube/errors.mjs';

test('sanitizes cookie-bearing upstream errors', () => {
  const error = cleanError(new Error('SID=secret https://example.test/x'));
  assert.equal(error.code, 'UPSTREAM_REQUEST_FAILED');
  assert.match(error.message, /redacted/);
  assert.doesNotMatch(error.message, /secret/);
});

test('maps not configured and editable errors', () => {
  assert.equal(cleanError(new Error('COOKIE_FILE_NOT_FOUND: no stored YouTube cookies')).code, 'NOT_CONFIGURED');
  assert.equal(cleanError(new Error('This playlist cannot be edited.')).code, 'PLAYLIST_NOT_EDITABLE');
});

test('video-not-found is not misreported as playlist-not-found', () => {
  assert.equal(cleanError(new Error('VIDEO_NOT_FOUND: not in this playlist: abc')).code, 'VIDEO_NOT_FOUND');
  assert.equal(cleanError(new Error('Given video ids were not found in this playlist.')).code, 'VIDEO_NOT_FOUND');
  assert.equal(cleanError(new Error('Playlist not found')).code, 'PLAYLIST_NOT_FOUND');
  assert.equal(cleanError(new Error('INVALID_ID: not a YouTube video ID or URL: x')).code, 'INVALID_ID');
});
