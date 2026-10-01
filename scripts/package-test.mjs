import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { packageRoot } from './lib.mjs';

const raw = execFileSync('npm', ['pack', '--json'], { cwd: packageRoot, encoding: 'utf8' });
const info = JSON.parse(raw)[0];
const tarball = path.join(packageRoot, info.filename);
const entries = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split('\n');
for (const required of ['package/package.json', 'package/src/server.mjs', 'package/README.md', 'package/LICENSE']) {
  if (!entries.includes(required)) throw new Error(`Packed package missing ${required}`);
}
for (const forbidden of ['cookies.txt', 'node_modules', 'playlist-debug.json', 'test/', 'scripts/']) {
  if (entries.some((entry) => entry.includes(forbidden))) throw new Error(`Packed package unexpectedly contains ${forbidden}`);
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'yt-mcp-pack-'));
execFileSync('tar', ['-xzf', tarball, '-C', tmp]);
const pkg = JSON.parse(fs.readFileSync(path.join(tmp, 'package/package.json'), 'utf8'));
if (pkg.private) throw new Error('Package is private');
if (pkg.name !== '@bigbatmanorg/youtube-personal-playlist-noapi-mcp') throw new Error('Wrong package name');
if (pkg.bin?.['youtube-personal-playlist-noapi-mcp'] !== './src/server.mjs') throw new Error('Invalid bin entry');
if (pkg.dependencies?.['youtubei.js'] !== '18.1.0') throw new Error('youtubei.js must be exactly pinned');
fs.rmSync(tarball, { force: true });
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`PASS package tarball (${info.filename}, ${info.size} bytes, ${info.entryCount} files)`);
