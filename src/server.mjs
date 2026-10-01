#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolveCookieFile } from './config.mjs';
import { SessionProvider } from './session.mjs';
import { cleanError, toolError } from './youtube/errors.mjs';
import { registerTools } from './tools.mjs';

const json = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value) }] });
const guarded = (fn) => async (args) => {
  try { return json(await fn(args)); }
  catch (error) {
    console.error(`[youtube-personal-playlist-noapi-mcp] ${cleanError(error).code}`);
    return toolError(error);
  }
};

export function buildServer({ cookieFile = resolveCookieFile() } = {}) {
  const server = new McpServer({ name: 'youtube-personal-playlist-noapi-mcp', version: '1.0.0' });
  const sessions = new SessionProvider(cookieFile);
  registerTools(server, { cookieFile, sessions, guarded });
  return server;
}

function isMain() {
  if (!process.argv[1]) return false;
  // npm exposes bin entries as symlinks on Unix. Resolve both sides so the
  // packaged executable is recognized just as the source entrypoint is.
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
}

if (isMain()) {
  const server = buildServer();
  const transport = new StdioServerTransport();
  // The SDK transport listens for input but does not close itself when its
  // parent process closes stdin.  Without this, stdio clients can wait
  // indefinitely for their child server to exit during shutdown.
  process.stdin.once('end', () => { transport.close().catch(() => {}); });
  await server.connect(transport);
}
