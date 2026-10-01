import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function openMcpClient(cookieFile, {
  command = process.execPath,
  args = ['src/server.mjs', '--cookie-file', cookieFile],
  cwd = packageRoot
} = {}) {
  const transport = new StdioClientTransport({
    command,
    args,
    cwd,
    env: { ...process.env, YOUTUBE_COOKIE_FILE: cookieFile },
    stderr: 'pipe'
  });
  const client = new Client({ name: 'youtube-personal-playlist-noapi-mcp-test', version: '1.0.0' });
  await client.connect(transport);
  return { client, transport };
}

export async function callJson(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  if (!result.content?.[0]?.text) throw new Error(`${name} returned no text content`);
  const parsed = JSON.parse(result.content[0].text);
  if (result.isError || parsed?.success === false) throw new Error(`${name}: ${parsed?.error?.code || 'FAILED'} ${parsed?.error?.message || ''}`.trim());
  return parsed;
}

// StdioClientTransport uses unref'd shutdown timers. Keep one referenced timer
// while it closes so Node does not abandon an otherwise pending top-level await.
export async function closeMcpClient(client, timeout = 5000) {
  let timer;
  try {
    await Promise.race([
      client.close(),
      new Promise((resolve) => { timer = setTimeout(resolve, timeout); })
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function waitFor(check, message, { attempts = 12, delay = 750 } = {}) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try { if (await check()) return; } catch (error) { lastError = error; }
    await sleep(delay);
  }
  throw lastError || new Error(message);
}
