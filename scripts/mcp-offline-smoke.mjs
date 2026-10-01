import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { closeMcpClient, openMcpClient } from './lib.mjs';
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'yt-mcp-empty-'));
const cookieFile = path.join(dir, 'cookies.txt');
let client;
try {
  ({ client } = await openMcpClient(cookieFile));
  const tools = await client.listTools();
  if (tools.tools.length !== 11) throw new Error(`Expected 11 tools, got ${tools.tools.length}`);
  const result = await client.callTool({ name: 'youtube_cookie_status', arguments: {} });
  const status = JSON.parse(result.content[0].text);
  if (status.configured !== false || status.authenticated !== false) throw new Error('Fresh MCP cookie status is wrong');
  console.log('PASS MCP starts without credentials');
  console.log('PASS 11 tools exposed');
  console.log(`PASS cookie destination ${status.cookie_file}`);
} finally {
  if (client) await closeMcpClient(client).catch(() => {});
  await fs.rm(dir, { recursive: true, force: true });
}
