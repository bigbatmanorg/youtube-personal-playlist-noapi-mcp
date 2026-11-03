# Changelog

## 1.1.0 — 2026-11-03

### Fixed
- `youtube_get_playlist` no longer skips videos. `page` now counts pages of `limit` videos across YouTube's internal continuations. Previously, `limit=5, page=2` jumped from item 5 to item ~101.
- Removing a video that isn't in the playlist now returns `VIDEO_NOT_FOUND` with the missing IDs. Previously it was misreported as `PLAYLIST_NOT_FOUND`.
- `youtube_remove_videos` re-reads the playlist before reporting a video missing. Previously, a remove right after an add could fail on YouTube's stale read.
- `youtube_list_playlists` now reports visibility, video count and last update for the current YouTube feed layout. These were always `null` before.
- Concurrent first calls now share one YouTube session instead of creating several.

### Added
- Playlist and video arguments accept YouTube URLs as well as IDs. Invalid input returns `INVALID_ID`.
- Every tool declares MCP annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`). Removing videos and deleting playlists are marked destructive.
- The live tests now cover reading a large playlist page by page, adding by URL, paged reads and missing-ID errors.

### Changed
- Upgraded dependencies:
  - `@modelcontextprotocol/sdk` 1.31.0 → 1.32.2
  - `youtubei.js` 18.1.0 → 18.3.0
  - `zod` 3.25.76 → 4.6.7

  This clears all `npm audit` advisories.
- Tools are registered with `registerTool`, replacing the deprecated `server.tool`.
- The server version is read from `package.json`.
- Install commands are pinned to release tags.
- The README now covers cookie rotation and the risks of using YouTube's internal API.

## 1.0.0 — 2026-10-01

First public version: 11 MCP tools for managing personal YouTube playlists with browser cookies.
