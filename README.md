# YouTube Personal Playlist noAPI MCP

Manage your own YouTube playlists from any MCP-capable agent using your existing YouTube browser cookies. No Google API key, Google Cloud project, or OAuth app is required.

This package is a local **stdio MCP executable**, not a backend service. The agent starts it when needed and it exits with the agent/client.

## Run directly from GitHub

Prerequisite: Node.js 20 or newer. No clone, global install, or npm registry publish is required.

```bash
YOUTUBE_COOKIE_FILE="$HOME/.config/youtube-personal-playlist-noapi-mcp/cookies.txt" \
  npx -y github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.1.0
```

This is a stdio MCP executable: use it as the command in an MCP client, rather than expecting a terminal UI. It can start with no credentials; paste cookies to a trusted agent and have it call `youtube_cookie_set`.

The command above is verified with npm 11.19.1. npm 12.2.0 disables Git dependencies by default; use the tested npm 12 command below instead.

```bash
YOUTUBE_COOKIE_FILE="$HOME/.config/youtube-personal-playlist-noapi-mcp/cookies.txt" \
  npm exec --yes --allow-git=all github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.1.0
```

### MCP client configuration

```json
{
  "mcpServers": {
    "youtube-playlists": {
      "command": "npx",
      "args": ["-y", "github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.1.0"],
      "env": {
        "YOUTUBE_COOKIE_FILE": "/absolute/path/to/cookies.txt"
      }
    }
  }
}
```

For npm 12, use this configuration instead:

```json
{
  "command": "npm",
  "args": ["exec", "--yes", "--allow-git=all", "github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.1.0"]
}
```

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
  npx -y github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.1.0
```

or:

```bash
npx -y github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.1.0 \
  --cookie-file "$HOME/.config/my-youtube/cookies.txt"
```

## Tools

| Tool | Purpose | Annotation |
|---|---|---|
| `youtube_cookie_set` | Store pasted Netscape cookies.txt content or a raw Cookie header, then verify account + playlist access | write (local) |
| `youtube_cookie_status` | Show the cookie path and test current authentication | read-only |
| `youtube_account_info` | Account name and handle | read-only |
| `youtube_list_playlists` | All account playlists with visibility, video count and last update | read-only |
| `youtube_get_playlist` | One page of a playlist; `page` counts pages of `limit` videos (max 100) | read-only |
| `youtube_create_playlist` | Create a playlist, optionally with initial videos | write |
| `youtube_rename_playlist` | Rename a playlist | write |
| `youtube_set_playlist_description` | Set a playlist description | write |
| `youtube_add_videos` | Add up to 50 videos | write |
| `youtube_remove_videos` | Remove up to 50 videos; fails without changes if any is not in the playlist | destructive |
| `youtube_delete_playlist` | Delete a playlist | destructive |

Playlist arguments accept a playlist ID or any YouTube URL with `list=`. Video arguments accept IDs or `watch`, `youtu.be` and `shorts` URLs. Special playlists (Watch Later `WL`, Liked `LL`, mixes) are read-only. Every tool declares MCP annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) so clients can ask before destructive calls.

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

See `examples/docker-agent.yaml`. The MCP can be consumed directly from GitHub through `npx`; there is no MCP source code to copy into every agent project.

## Upgrade policy

`youtubei.js` is exactly pinned. Do not upgrade it blindly. The compatibility boundary is isolated in `src/youtube/compat.mjs`, so upstream request-shape changes should require a small targeted change rather than touching the MCP API.

Test a candidate in a disposable copy:

```bash
npm run test:upgrade -- latest --cookie-file "$HOME/.config/youtube-personal-playlist-noapi-mcp/cookies.txt"
```

Pass a specific version such as `18.3.0` instead of `latest` to test that release. Without a cookie path it runs only the offline compatibility checks; with a cookie path it also runs read-only and live write verification.

Before publishing any release:

```bash
npm run release:check
```

Then run `npm run verify`, `npm run test:live` and `npm run test:full` with real cookies. Treat `RESULT: READY` from all three as the live release gate. The write tests only touch a temporary `MCP_TEST_*` / `MCP_FULL_TEST_*` playlist that they create and delete; `verify` is read-only. Point `test:full` at a scratch `--cookie-file`, because it stores the pasted cookies there.

Bump `version` in `package.json`, update the pinned `#vX.Y.Z` references and `CHANGELOG.md`, merge to `main`, then tag `vX.Y.Z` and publish a GitHub release.

## Security note

YouTube browser cookies are account credentials. `youtube_cookie_set` exists specifically for users who deliberately want to paste those credentials through their MCP-capable agent. The server never echoes stored cookie values and sanitizes known cookie fields from returned errors. Use only with agents/frontends you trust.

This tool drives YouTube's internal web API with your browser session, which is not an officially supported integration. Google may change it at any time, and automated use can trigger security checks on the account. Use a reasonable request rate and prefer an account you are comfortable using this way.

### Keeping cookies valid

Google rotates some session cookies while the browser that owns them stays open, which can invalidate an export within hours. For longer-lived cookies, sign in to YouTube in a private/incognito window, export the cookies from that window, then close it without signing out.

## Troubleshooting

- `COOKIE_FILE_NOT_FOUND` means the configured cookie path does not exist yet. Start the MCP without credentials and use `youtube_cookie_set`, or provide the correct absolute `YOUTUBE_COOKIE_FILE` path.
- `NOT_LOGGED_IN` means the exported YouTube cookies have expired or do not authenticate the intended account. Export fresh cookies (see *Keeping cookies valid*) and set them again.
- `VIDEO_NOT_FOUND` lists the requested video IDs that are not in the playlist; nothing is removed in that case.
- `INVALID_ID` means an argument is neither a valid YouTube ID nor a supported YouTube URL.
- npm 12 reporting `EALLOWGIT` requires the per-command `--allow-git=all` flag shown above. Do not disable npm security globally.
