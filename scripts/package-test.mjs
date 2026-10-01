import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { closeMcpClient, openMcpClient, packageRoot } from './lib.mjs';

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
const installDir = path.join(tmp, 'install');
execFileSync('tar', ['-xzf', tarball, '-C', tmp]);
fs.mkdirSync(installDir);
const pkg = JSON.parse(fs.readFileSync(path.join(tmp, 'package/package.json'), 'utf8'));
if (pkg.private) throw new Error('Package is private');
if (pkg.name !== '@bigbatmanorg/youtube-personal-playlist-noapi-mcp') throw new Error('Wrong package name');
if (pkg.bin?.['youtube-personal-playlist-noapi-mcp'] !== './src/server.mjs') throw new Error('Invalid bin entry');
if (pkg.dependencies?.['youtubei.js'] !== '18.1.0') throw new Error('youtubei.js must be exactly pinned');
let client;
try {
  // Install the tarball into a separate directory. The spawned binary and its
  // dependencies therefore cannot resolve from this checkout's node_modules.
  execFileSync('npm', ['install', '--no-audit', '--no-fund', tarball], { cwd: installDir, stdio: 'inherit' });
  const executable = path.join(installDir, 'node_modules', '.bin', 'youtube-personal-playlist-noapi-mcp');
  fs.accessSync(executable, fs.constants.X_OK);
  const cookieFile = path.join(tmp, 'cookies.txt');
  ({ client } = await openMcpClient(cookieFile, {
    command: executable,
    args: ['--cookie-file', cookieFile],
    cwd: installDir
  }));
  const tools = await client.listTools();
  if (tools.tools.length !== 11) throw new Error(`Packaged CLI exposed ${tools.tools.length} tools, expected 11`);
  const status = await client.callTool({ name: 'youtube_cookie_status', arguments: {} });
  const parsed = JSON.parse(status.content?.[0]?.text || '');
  if (parsed.configured !== false || parsed.authenticated !== false) throw new Error('Packaged CLI has unexpected initial cookie status');
  console.log(`PASS package tarball and isolated CLI MCP smoke (${info.filename}, ${info.size} bytes, ${info.entryCount} files)`);
} finally {
  if (client) await closeMcpClient(client).catch(() => {});
  fs.rmSync(tarball, { force: true });
  fs.rmSync(tmp, { recursive: true, force: true });
}
