# YouTube Personal Playlist noAPI MCP

Manage your own YouTube playlists from any MCP-capable agent using your existing YouTube browser cookies. No Google API key, Google Cloud project, or OAuth app is required.

This package is a local **stdio MCP executable**, not a backend service. The agent starts it when needed and it exits with the agent/client.

## Install / run

```bash
npx -y @bigbatmanorg/youtube-personal-playlist-noapi-mcp@1.0.0
```

The MCP can start with no credentials. Paste your cookies to the agent and have it call `youtube_cookie_set`.

## Cookie location

Cookie storage is intentionally high-level and predictable.

Priority:

1. `--cookie-file /path/to/cookies.txt`
2. `YOUTUBE_COOKIE_FILE=/path/to/cookies.txt`
3. `$XDG_CONFIG_HOME/youtube-personal-playlist-noapi-mcp/cookies.txt`
4. `~/.config/youtube-personal-playlist-noapi-mcp/cookies.txt`

The MCP stores normalized cookies with mode `0600` and never returns cookie values.

Example custom location:

```bash
YOUTUBE_COOKIE_FILE="$HOME/.config/my-youtube/cookies.txt" \
  npx -y @bigbatmanorg/youtube-personal-playlist-noapi-mcp@1.0.0
```

or:

```bash
npx -y @bigbatmanorg/youtube-personal-playlist-noapi-mcp@1.0.0 \
  --cookie-file "$HOME/.config/my-youtube/cookies.txt"
```

## Tools

- `youtube_cookie_set` — accepts pasted Netscape cookies.txt content or a raw Cookie header, stores it, and immediately verifies account + playlist access.
- `youtube_cookie_status` — shows the configured path and tests current authentication.
- `youtube_account_info`
- `youtube_list_playlists`
- `youtube_get_playlist`
- `youtube_create_playlist`
- `youtube_rename_playlist`
- `youtube_set_playlist_description`
- `youtube_add_videos`
- `youtube_remove_videos`
- `youtube_delete_playlist`

## One-command full-cycle test from pasted cookies

This is the strongest test. It starts the MCP with no assumed session, reads pasted cookie text from stdin, calls `youtube_cookie_set`, stores the cookie at the configured path, verifies authentication, lists/reads playlists, creates a disposable playlist, renames it, sets a description, adds/removes a test video, verifies each state change, deletes the temporary playlist, and exercises the real MCP protocol end-to-end.

Interactive:

```bash
npm run test:full -- --cookie-file "$HOME/.config/youtube-personal-playlist-noapi-mcp/test-cookies.txt"
```

Paste your full Netscape cookie export or raw `Cookie:` header, then press **Ctrl-D**.

Or pipe an export:

```bash
cat ~/Downloads/youtube-cookies.txt | \
  npm run test:full -- --cookie-file "$HOME/.config/youtube-personal-playlist-noapi-mcp/test-cookies.txt"
```

A successful run ends with:

```text
RESULT: READY
```

The full test temporarily modifies the authenticated YouTube account by creating a test playlist. It deletes that playlist in cleanup even when an intermediate test fails.

## Other tests

Offline unit suite (no cookies, no network):

```bash
npm test
```

Read-only live verification:

```bash
npm run verify
```

Live write verification using the stored cookie:

```bash
npm run test:live
```

MCP protocol smoke test:

```bash
npm run test:mcp
```

Test the actual npm tarball/install shape:

```bash
npm run test:package
```

## Docker Agent example

See `examples/docker-agent.yaml`. After publishing, the MCP can be consumed directly through `npx`; there is no MCP source code to copy into every agent project.

## Upgrade policy

`youtubei.js` is exactly pinned. Do not upgrade it blindly. The compatibility boundary is isolated in `src/youtube/compat.mjs`, so upstream request-shape changes should require a small targeted change rather than touching the MCP API.

Test a candidate in a disposable copy:

```bash
npm run test:upgrade -- 18.2.0 --cookie-file "$HOME/.config/youtube-personal-playlist-noapi-mcp/cookies.txt"
```

Use `latest` instead of a version to probe the newest release. Without a cookie path it runs only the offline compatibility checks; with a cookie path it also runs read-only and live write verification.

Before publishing any release:

```bash
npm run release:check
```

Then run `npm run test:full` with a real pasted cookie. Treat `RESULT: READY` from that full-cycle test as the live release gate.

## Security note

YouTube browser cookies are account credentials. `youtube_cookie_set` exists specifically for users who deliberately want to paste those credentials through their MCP-capable agent. The server never echoes stored cookie values and sanitizes known cookie fields from returned errors. Use only with agents/frontends you trust.
