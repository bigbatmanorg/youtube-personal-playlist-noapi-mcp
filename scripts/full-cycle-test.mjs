import fs from 'node:fs/promises';
import { resolveCookieFile } from '../src/config.mjs';
import { openMcpClient, callJson, closeMcpClient, waitFor } from './lib.mjs';

const cookieFile = resolveCookieFile();
const videoId = process.env.YOUTUBE_TEST_VIDEO_ID || 'dQw4w9WgXcQ';
const steps = [];
let client; let playlistId;
const run = async (name, fn) => { try { const v = await fn(); steps.push([name, 'PASS']); return v; } catch (e) { steps.push([name, `FAIL: ${String(e?.message || e).slice(0, 180)}`]); throw e; } };
async function readAllStdin() {
  let text = '';
  for await (const chunk of process.stdin) text += chunk;
  return text;
}

console.error(`Cookie destination: ${cookieFile}`);
if (process.stdin.isTTY) console.error('Paste Netscape cookies.txt content or a raw Cookie header, then press Ctrl-D.');
const pasted = await readAllStdin();
if (!pasted.trim()) {
  console.error('No cookie text received on stdin. Example: cat cookies.txt | npm run test:full -- --cookie-file ~/.config/youtube-personal-playlist-noapi-mcp/test-cookies.txt');
  process.exit(2);
}

try {
  ({ client } = await openMcpClient(cookieFile));
  await run('MCP_INITIALIZE_EMPTY_OK', async () => { const tools = await client.listTools(); if (tools.tools.length < 11) throw new Error('Toolset incomplete'); });
  const set = await run('COOKIE_SET_PARSE_STORE_TEST', () => callJson(client, 'youtube_cookie_set', { cookies: pasted }));
  if (!set.authenticated || !set.playlist_count) throw new Error('Cookie set did not prove authenticated playlist access');
  await run('COOKIE_FILE_PERMISSIONS', async () => { const mode = ((await fs.stat(cookieFile)).mode & 0o777).toString(8); if (mode !== '600') throw new Error(`Cookie mode is ${mode}, expected 600`); });
  await run('COOKIE_STATUS', async () => { const s = await callJson(client, 'youtube_cookie_status'); if (!s.authenticated) throw new Error('Stored cookies not authenticated'); });
  await run('ACCOUNT', () => callJson(client, 'youtube_account_info'));
  const list = await run('LIST_PLAYLISTS', () => callJson(client, 'youtube_list_playlists'));
  if (!list.playlists?.length) throw new Error('No playlists returned');
  const readable = list.playlists.find((p) => p.id && !['LL','WL','YS'].includes(p.id)) || list.playlists[0];
  await run('GET_PLAYLIST', () => callJson(client, 'youtube_get_playlist', { playlist_id: readable.id, limit: 5 }));
  const created = await run('CREATE_PLAYLIST', () => callJson(client, 'youtube_create_playlist', { title: `MCP_FULL_TEST_${Date.now()}` }));
  playlistId = created.playlist_id;
  if (!playlistId) throw new Error('Create returned no playlist ID');
  await run('VERIFY_CREATE', () => waitFor(async () => Boolean((await callJson(client, 'youtube_get_playlist', { playlist_id: playlistId, limit: 10 })).playlist?.title), 'Created playlist not readable'));
  const renamed = `MCP_FULL_RENAMED_${Date.now()}`;
  await run('RENAME_PLAYLIST', () => callJson(client, 'youtube_rename_playlist', { playlist_id: playlistId, name: renamed }));
  await run('VERIFY_RENAME', () => waitFor(async () => (await callJson(client, 'youtube_get_playlist', { playlist_id: playlistId, limit: 10 })).playlist?.title === renamed, 'Rename not visible'));
  const description = 'Temporary full-cycle MCP test.';
  await run('SET_DESCRIPTION', () => callJson(client, 'youtube_set_playlist_description', { playlist_id: playlistId, description }));
  await run('VERIFY_DESCRIPTION', () => waitFor(async () => (await callJson(client, 'youtube_get_playlist', { playlist_id: playlistId, limit: 10 })).playlist?.description === description, 'Description not visible'));
  await run('ADD_VIDEO', () => callJson(client, 'youtube_add_videos', { playlist_id: playlistId, video_ids: [videoId] }));
  await run('VERIFY_ADD', () => waitFor(async () => (await callJson(client, 'youtube_get_playlist', { playlist_id: playlistId, limit: 100 })).videos?.some((v) => v.id === videoId), 'Added video not visible'));
  await run('REMOVE_VIDEO', () => callJson(client, 'youtube_remove_videos', { playlist_id: playlistId, video_ids: [videoId] }));
  await run('VERIFY_REMOVE', () => waitFor(async () => !(await callJson(client, 'youtube_get_playlist', { playlist_id: playlistId, limit: 100 })).videos?.some((v) => v.id === videoId), 'Removed video still visible'));
} catch (error) {
  process.exitCode = 1;
  console.error(`Full-cycle test failed: ${String(error?.stack || error)}`);
}
finally {
  if (playlistId && client) {
    try {
      await callJson(client, 'youtube_delete_playlist', { playlist_id: playlistId }); steps.push(['DELETE_PLAYLIST', 'PASS']);
      await waitFor(async () => !(await callJson(client, 'youtube_list_playlists')).playlists?.some((p) => p.id === playlistId), 'Deleted playlist still listed');
      steps.push(['VERIFY_DELETE', 'PASS']);
    }
    catch (e) { steps.push(['DELETE_PLAYLIST', `FAIL: ${String(e?.message || e).slice(0, 160)}`]); process.exitCode = 1; }
  }
  if (client) await closeMcpClient(client).catch(() => {});
  console.log(`Cookie file: ${cookieFile}`);
  console.log('');
  for (const [name, status] of steps) console.log(`${name.padEnd(30)} ${status}`);
  console.log(`\nRESULT: ${process.exitCode ? 'NOT READY' : 'READY'}`);
}
