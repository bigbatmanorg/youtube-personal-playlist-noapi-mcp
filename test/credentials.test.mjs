import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { detectCookieFormat, parseCookieText, saveCookieText, cookieStatus } from '../src/credentials.mjs';

test('parses raw Cookie header', () => {
  assert.equal(parseCookieText('Cookie: SID=a; HSID=b'), 'SID=a; HSID=b');
  assert.equal(detectCookieFormat('SID=a; HSID=b'), 'header');
});

test('parses Netscape YouTube cookies and ignores unrelated domains', () => {
  const text = [
    '# Netscape HTTP Cookie File',
    '.youtube.com\tTRUE\t/\tTRUE\t0\tSID\tabc',
    '#HttpOnly_.youtube.com\tTRUE\t/\tTRUE\t0\t__Secure-1PSID\txyz',
    '.example.com\tTRUE\t/\tTRUE\t0\tNOPE\tbad'
  ].join('\n');
  assert.equal(parseCookieText(text), 'SID=abc; __Secure-1PSID=xyz');
  assert.equal(detectCookieFormat(text), 'netscape');
});

test('atomically stores normalized cookie header with mode 0600', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'yt-mcp-cookie-'));
  const file = path.join(dir, 'cookies.txt');
  const result = await saveCookieText(file, '# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t0\tSID\tabc');
  assert.equal(result.count, 1);
  assert.equal((await fs.readFile(file, 'utf8')).trim(), 'SID=abc');
  const status = await cookieStatus(file);
  assert.equal(status.configured, true);
  assert.equal(status.mode, '600');
});
