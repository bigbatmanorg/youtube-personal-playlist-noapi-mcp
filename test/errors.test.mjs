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
