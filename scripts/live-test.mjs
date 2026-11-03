import { resolveCookieFile } from '../src/config.mjs';
import { SessionProvider } from '../src/session.mjs';
import { YouTubeOperations } from '../src/youtube/operations.mjs';
import { waitFor } from './lib.mjs';

const cookieFile = resolveCookieFile();
const videoId = process.env.YOUTUBE_TEST_VIDEO_ID || 'dQw4w9WgXcQ';
const extraIds = ['9bZkp7q19f0', 'jNQXAC9IVRw'];
const steps = [];
let playlistId; let ops;
const run = async (name, fn) => { try { const v = await fn(); steps.push([name, 'PASS']); return v; } catch (e) { steps.push([name, `FAIL: ${String(e?.message || e).slice(0, 160)}`]); throw e; } };
try {
  ops = new YouTubeOperations(await new SessionProvider(cookieFile).get());
  await run('AUTH', () => ops.accountInfo());
  await run('LIST_PLAYLISTS', () => ops.listPlaylists());
  const created = await run('CREATE_PLAYLIST', () => ops.createPlaylist(`MCP_TEST_${Date.now()}`));
  playlistId = created.playlist_id;
  if (!playlistId) throw new Error('Create did not return a playlist ID');
  await run('GET_PLAYLIST', () => waitFor(async () => Boolean((await ops.getPlaylist(playlistId, { limit: 10 })).playlist?.title), 'Created playlist did not become readable'));
  const renamed = `MCP_TEST_RENAMED_${Date.now()}`;
  await run('RENAME_PLAYLIST', () => ops.renamePlaylist(playlistId, renamed));
  await run('VERIFY_RENAME', () => waitFor(async () => (await ops.getPlaylist(playlistId, { limit: 10 })).playlist?.title === renamed, 'Rename did not converge'));
  const description = 'Temporary playlist created by YouTube MCP live test.';
  await run('SET_DESCRIPTION', () => ops.setPlaylistDescription(playlistId, description));
  await run('VERIFY_DESCRIPTION', () => waitFor(async () => (await ops.getPlaylist(playlistId, { limit: 10 })).playlist?.description === description, 'Description did not converge'));
  await run('ADD_VIDEO', () => ops.addVideos(playlistId, [videoId]));
  await run('VERIFY_ADD', () => waitFor(async () => (await ops.getPlaylist(playlistId, { limit: 100 })).videos.some((v) => v.id === videoId), 'Added video not found'));
  await run('ADD_VIDEOS_BY_URL', () => ops.addVideos(`https://www.youtube.com/playlist?list=${playlistId}`, extraIds.map((id) => `https://youtu.be/${id}`)));
  await run('VERIFY_PAGED_READ', () => waitFor(async () => {
    const ids = [];
    for (let page = 1; page <= 3; page += 1) {
      const result = await ops.getPlaylist(playlistId, { limit: 2, page });
      ids.push(...result.videos.map((v) => v.id));
      if (!result.has_more) break;
    }
    return [videoId, ...extraIds].every((id) => ids.includes(id)) && ids.length === 3;
  }, 'Paged read did not return all three videos'));
  await run('REMOVE_MISSING_REPORTS_ID', async () => {
    try { await ops.removeVideos(playlistId, [videoId, 'aaaaaaaaaaa']); } catch (error) {
      if (/VIDEO_NOT_FOUND: .*aaaaaaaaaaa/.test(String(error?.message))) return;
      throw error;
    }
    throw new Error('Removing a missing video did not fail');
  });
  await run('REMOVE_VIDEO', () => ops.removeVideos(playlistId, [`https://www.youtube.com/watch?v=${videoId}`, ...extraIds]));
  await run('VERIFY_REMOVE', () => waitFor(async () => (await ops.getPlaylist(playlistId, { limit: 100 })).videos.length === 0, 'Removed videos still present'));
} catch { process.exitCode = 1; }
finally {
  if (playlistId && ops) {
    try {
      await ops.deletePlaylist(playlistId); steps.push(['DELETE_PLAYLIST', 'PASS']);
      await waitFor(async () => !(await ops.listPlaylists()).playlists.some((p) => p.id === playlistId), 'Deleted playlist still listed');
      steps.push(['VERIFY_DELETE', 'PASS']);
    }
    catch (e) { steps.push(['DELETE_PLAYLIST', `FAIL: ${String(e?.message || e).slice(0, 160)}`]); process.exitCode = 1; }
  }
  for (const [name, status] of steps) console.log(`${name.padEnd(24)} ${status}`);
  console.log(`RESULT: ${process.exitCode ? 'NOT READY' : 'READY'}`);
}
