import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { defaultCookieFile, parseCookieFileArg, resolveCookieFile } from '../src/config.mjs';

test('cookie path priority is CLI then env then XDG default', () => {
  assert.equal(parseCookieFileArg(['--cookie-file', '/a/c']), '/a/c');
  assert.equal(parseCookieFileArg(['--cookie-file=/b/c']), '/b/c');
  assert.equal(resolveCookieFile({ argv: ['--cookie-file=/cli'], env: { YOUTUBE_COOKIE_FILE: '/env' }, homedir: '/home/u' }), '/cli');
  assert.equal(resolveCookieFile({ argv: [], env: { YOUTUBE_COOKIE_FILE: '/env' }, homedir: '/home/u' }), '/env');
  assert.equal(defaultCookieFile({ XDG_CONFIG_HOME: '/cfg' }, '/home/u'), path.join('/cfg', 'youtube-personal-playlist-noapi-mcp', 'cookies.txt'));
});
