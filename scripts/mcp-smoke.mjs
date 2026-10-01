import { resolveCookieFile } from '../src/config.mjs';
import { openMcpClient, callJson, closeMcpClient } from './lib.mjs';
const cookieFile = resolveCookieFile();
let client;
try {
  ({ client } = await openMcpClient(cookieFile));
  const tools = await client.listTools();
  const names = tools.tools.map((tool) => tool.name);
  const required = ['youtube_cookie_set','youtube_cookie_status','youtube_account_info','youtube_list_playlists','youtube_get_playlist','youtube_create_playlist','youtube_rename_playlist','youtube_set_playlist_description','youtube_add_videos','youtube_remove_videos','youtube_delete_playlist'];
  for (const name of required) if (!names.includes(name)) throw new Error(`Missing tool: ${name}`);
  const status = await callJson(client, 'youtube_cookie_status');
  const account = await callJson(client, 'youtube_account_info');
  const playlists = await callJson(client, 'youtube_list_playlists');
  console.log(`PASS MCP_INITIALIZE (${names.length} tools)`);
  console.log(`PASS MCP_AUTH (${status.authenticated}, ${account.handle || account.name || 'account'})`);
  console.log(`PASS MCP_LIST (${playlists.playlists.length} playlists)`);
} finally { if (client) await closeMcpClient(client).catch(() => {}); }
