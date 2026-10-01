import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { packageRoot } from './lib.mjs';

const candidate = process.argv.find((x) => !x.startsWith('--') && x !== process.argv[1]) || 'latest';
const cookieArgIndex = process.argv.findIndex((x) => x === '--cookie-file');
const cookieFile = cookieArgIndex >= 0 ? process.argv[cookieArgIndex + 1] : process.env.YOUTUBE_COOKIE_FILE;
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'yt-mcp-upgrade-'));
const work = path.join(temp, 'repo');
fs.cpSync(packageRoot, work, { recursive: true, filter: (src) => !src.includes(`${path.sep}node_modules`) && !src.endsWith('.tgz') });
const run = (cmd, args, options = {}) => execFileSync(cmd, args, { cwd: work, stdio: 'inherit', ...options });
try {
  console.log(`Testing youtubei.js candidate: ${candidate}`);
  run('npm', ['install', `youtubei.js@${candidate}`, '--save-exact', '--ignore-scripts']);
  run('npm', ['test']);
  run(process.execPath, ['scripts/mcp-offline-smoke.mjs']);
  if (cookieFile) {
    run('npm', ['run', 'verify', '--', '--cookie-file', cookieFile], { env: { ...process.env, YOUTUBE_COOKIE_FILE: cookieFile } });
    run('npm', ['run', 'test:live', '--', '--cookie-file', cookieFile], { env: { ...process.env, YOUTUBE_COOKIE_FILE: cookieFile } });
  } else {
    console.log('Live compatibility tests skipped: pass --cookie-file PATH or set YOUTUBE_COOKIE_FILE.');
  }
  console.log('UPGRADE RESULT: PASS');
} catch (error) {
  console.error('UPGRADE RESULT: FAIL');
  process.exitCode = 1;
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
