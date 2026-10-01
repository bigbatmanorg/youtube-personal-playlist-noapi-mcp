import test from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from '../src/server.mjs';

test('server can be constructed without cookies configured', () => {
  const server = buildServer({ cookieFile: '/definitely/not/present/cookies.txt' });
  assert.ok(server);
});
