import { resolveCookieFile } from '../src/config.mjs';
import { cookieStatus } from '../src/credentials.mjs';
import { SessionProvider } from '../src/session.mjs';
import { YouTubeOperations } from '../src/youtube/operations.mjs';
import { openMcpClient, callJson } from './lib.mjs';

const cookieFile = resolveCookieFile();
const steps = [];
const run = async (name, fn) => { try { const value = await fn(); steps.push([name, 'PASS']); return value; } catch (error) { steps.push([name, `FAIL: ${String(error?.message || error).slice(0, 180)}`]); throw error; } };
let client;
try {
  const status = await run('COOKIE_FILE', async () => { const s = await cookieStatus(cookieFile); if (!s.configured) throw new Error(`No cookies at ${cookieFile}`); return s; });
  const sessions = new SessionProvider(cookieFile);
  const yt = await run('AUTH', async () => sessions.get());
  const ops = new YouTubeOperations(yt);
  const account = await run('ACCOUNT', () => ops.accountInfo());
  const list = await run('LIST_PLAYLISTS', async () => { const x = await ops.listPlaylists(); if (!x.playlists.length) throw new Error('No playlists returned'); return x; });
  if (process.env.YOUTUBE_VERIFY_PLAYLIST_ID) await run('GET_PLAYLIST', () => ops.getPlaylist(process.env.YOUTUBE_VERIFY_PLAYLIST_ID, { limit: 10 }));
  const mcp = await openMcpClient(cookieFile); client = mcp.client;
  await run('MCP_INITIALIZE', async () => { const tools = await client.listTools(); if (tools.tools.length < 11) throw new Error(`Expected 11 tools, got ${tools.tools.length}`); });
  await run('MCP_COOKIE_STATUS', async () => { const s = await callJson(client, 'youtube_cookie_status'); if (!s.authenticated) throw new Error('MCP cookie status is not authenticated'); });
  await run('MCP_LIST_PLAYLISTS', async () => { const x = await callJson(client, 'youtube_list_playlists'); if (!x.playlists?.length) throw new Error('MCP returned no playlists'); });
  console.log(`Cookie file: ${cookieFile}`);
  console.log(`Account: ${account.name || '(unknown)'} ${account.handle || ''}`.trim());
  console.log(`Playlists: ${list.playlists.length}; cookies: ${status.cookie_count}; mode: ${status.mode}`);
} catch { process.exitCode = 1; }
finally {
  if (client) await client.close().catch(() => {});
  console.log('');
  for (const [name, status] of steps) console.log(`${name.padEnd(24)} ${status}`);
  console.log(`\nRESULT: ${process.exitCode ? 'NOT READY' : 'READY'}`);
}
