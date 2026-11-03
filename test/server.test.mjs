import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { buildServer } from '../src/server.mjs';
import { SessionProvider } from '../src/session.mjs';

test('server can be constructed without cookies configured', () => {
  const server = buildServer({ cookieFile: '/definitely/not/present/cookies.txt' });
  assert.ok(server);
});

test('server reports package version and annotates every tool', async () => {
  const server = buildServer({ cookieFile: '/definitely/not/present/cookies.txt' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(client.getServerVersion().version, version);
  const { tools } = await client.listTools();
  assert.equal(tools.length, 14);
  for (const tool of tools) assert.equal(typeof tool.annotations?.readOnlyHint, 'boolean', tool.name);
  const byName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
  assert.equal(byName.youtube_delete_playlist.annotations.destructiveHint, true);
  assert.equal(byName.youtube_remove_videos.annotations.destructiveHint, true);
  assert.equal(byName.youtube_list_playlists.annotations.readOnlyHint, true);
  assert.equal(byName.youtube_clean_playlist_preview.annotations.readOnlyHint, true);
  assert.equal(byName.youtube_clean_playlist_apply.annotations.destructiveHint, true);
  await client.close();
});

test('concurrent session requests share one attempt and a failure is retried later', async () => {
  const sessions = new SessionProvider('/definitely/not/present/cookies.txt');
  const first = sessions.get();
  assert.equal(sessions.get(), first);
  await assert.rejects(first, /COOKIE_FILE_NOT_FOUND/);
  await new Promise((resolve) => setImmediate(resolve));
  assert.notEqual(sessions.get(), first);
  await assert.rejects(sessions.get(), /COOKIE_FILE_NOT_FOUND/);
});
