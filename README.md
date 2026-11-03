# YouTube Personal Playlist noAPI MCP

Manage your own YouTube playlists from any MCP-capable agent using your existing YouTube browser cookies. No Google API key, Google Cloud project, or OAuth app is required.

This package is a local **stdio MCP executable**, not a backend service. The agent starts it when needed and it exits with the agent/client.

## Run directly from GitHub

Prerequisite: Node.js 20 or newer. No clone, global install, or npm registry publish is required.

```bash
YOUTUBE_COOKIE_FILE="$HOME/.config/youtube-personal-playlist-noapi-mcp/cookies.txt" \
  npx -y github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0
```

This is a stdio MCP executable: use it as the command in an MCP client, rather than expecting a terminal UI. It can start with no credentials; paste cookies to a trusted agent and have it call `youtube_cookie_set`.

The command above is verified with npm 11.19.1. npm 12.2.0 disables Git dependencies by default; use the tested npm 12 command below instead.

```bash
YOUTUBE_COOKIE_FILE="$HOME/.config/youtube-personal-playlist-noapi-mcp/cookies.txt" \
  npm exec --yes --allow-git=all github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0
```

<!-- install:start -->
## Install in your agent

[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_youtube--playlists-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=youtube-playlists&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22youtube_cookie_file%22%2C%22description%22%3A%22Where%20cookies%20are%20stored%20%28optional%29%22%2C%22password%22%3Afalse%7D%5D&config=%7B%22type%22%3A%22stdio%22%2C%22command%22%3A%22npm%22%2C%22args%22%3A%5B%22exec%22%2C%22--yes%22%2C%22--allow-git%3Dall%22%2C%22github%3Abigbatmanorg/youtube-personal-playlist-noapi-mcp%23v1.2.0%22%5D%2C%22env%22%3A%7B%22YOUTUBE_COOKIE_FILE%22%3A%22%24%7Binput%3Ayoutube_cookie_file%7D%22%7D%7D)
[![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_youtube--playlists-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=youtube-playlists&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22youtube_cookie_file%22%2C%22description%22%3A%22Where%20cookies%20are%20stored%20%28optional%29%22%2C%22password%22%3Afalse%7D%5D&config=%7B%22type%22%3A%22stdio%22%2C%22command%22%3A%22npm%22%2C%22args%22%3A%5B%22exec%22%2C%22--yes%22%2C%22--allow-git%3Dall%22%2C%22github%3Abigbatmanorg/youtube-personal-playlist-noapi-mcp%23v1.2.0%22%5D%2C%22env%22%3A%7B%22YOUTUBE_COOKIE_FILE%22%3A%22%24%7Binput%3Ayoutube_cookie_file%7D%22%7D%7D&quality=insiders)
[![Install in Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en-US/install-mcp?name=youtube-playlists&config=eyJjb21tYW5kIjoibnBtIiwiYXJncyI6WyJleGVjIiwiLS15ZXMiLCItLWFsbG93LWdpdD1hbGwiLCJnaXRodWI6YmlnYmF0bWFub3JnL3lvdXR1YmUtcGVyc29uYWwtcGxheWxpc3Qtbm9hcGktbWNwI3YxLjIuMCJdLCJlbnYiOnsiWU9VVFVCRV9DT09LSUVfRklMRSI6Ii9ob21lL3lvdS8uY29uZmlnL3lvdXR1YmUtcGVyc29uYWwtcGxheWxpc3Qtbm9hcGktbWNwL2Nvb2tpZXMudHh0In19)

It works with any MCP client that can start a stdio command. It needs Node.js 20+. `npm exec` fetches the pinned release from GitHub, so no clone or registry install is needed. Pick your agent below.

| Variable | Meaning | Example |
|---|---|---|
| `YOUTUBE_COOKIE_FILE` | Where cookies are stored (optional) | `/home/you/.config/youtube-personal-playlist-noapi-mcp/cookies.txt` |

`YOUTUBE_COOKIE_FILE` is optional and defaults to `~/.config/youtube-personal-playlist-noapi-mcp/cookies.txt`. With no cookies yet, paste them to the agent and it calls `youtube_cookie_set`. The `npm exec --allow-git=all` form works with npm 11 and 12 (npm 12 disables Git dependencies by default).

The VS Code buttons ask for each value, keeping secrets out of files. The Cursor button writes placeholders: edit them in `~/.cursor/mcp.json` afterwards. Elsewhere, replace the example values.

<details>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add youtube-playlists -s user -e YOUTUBE_COOKIE_FILE=/home/you/.config/youtube-personal-playlist-noapi-mcp/cookies.txt -- npm exec --yes --allow-git=all 'github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0'
```

</details>

<details>
<summary><b>Claude Desktop</b></summary>

Settings → Developer → Edit Config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "youtube-playlists": {
      "command": "npm",
      "args": [
        "exec",
        "--yes",
        "--allow-git=all",
        "github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0"
      ],
      "env": {
        "YOUTUBE_COOKIE_FILE": "/home/you/.config/youtube-personal-playlist-noapi-mcp/cookies.txt"
      }
    }
  }
}
```

</details>

<details>
<summary><b>VS Code / GitHub Copilot</b></summary>

Use the button above, or add this to `.vscode/mcp.json` (workspace) or to the user `mcp.json` (command
*MCP: Open User Configuration*):

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "youtube_cookie_file",
      "description": "Where cookies are stored (optional)",
      "password": false
    }
  ],
  "servers": {
    "youtube-playlists": {
      "type": "stdio",
      "command": "npm",
      "args": [
        "exec",
        "--yes",
        "--allow-git=all",
        "github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0"
      ],
      "env": {
        "YOUTUBE_COOKIE_FILE": "${input:youtube_cookie_file}"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Cursor</b></summary>

Use the button above, or add this to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project):

```json
{
  "mcpServers": {
    "youtube-playlists": {
      "command": "npm",
      "args": [
        "exec",
        "--yes",
        "--allow-git=all",
        "github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0"
      ],
      "env": {
        "YOUTUBE_COOKIE_FILE": "/home/you/.config/youtube-personal-playlist-noapi-mcp/cookies.txt"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Windsurf</b></summary>

Add this to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "youtube-playlists": {
      "command": "npm",
      "args": [
        "exec",
        "--yes",
        "--allow-git=all",
        "github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0"
      ],
      "env": {
        "YOUTUBE_COOKIE_FILE": "/home/you/.config/youtube-personal-playlist-noapi-mcp/cookies.txt"
      }
    }
  }
}
```

</details>

<details>
<summary><b>OpenAI Codex CLI</b></summary>

```bash
codex mcp add youtube-playlists --env YOUTUBE_COOKIE_FILE=/home/you/.config/youtube-personal-playlist-noapi-mcp/cookies.txt -- npm exec --yes --allow-git=all 'github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0'
```

Or add this to `~/.codex/config.toml`:

```toml
[mcp_servers.youtube-playlists]
command = "npm"
args = ["exec", "--yes", "--allow-git=all", "github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0"]
env = { YOUTUBE_COOKIE_FILE = "/home/you/.config/youtube-personal-playlist-noapi-mcp/cookies.txt" }
```

</details>

<details>
<summary><b>Gemini CLI</b></summary>

Add this to `~/.gemini/settings.json` (or to `.gemini/settings.json` in a project):

```json
{
  "mcpServers": {
    "youtube-playlists": {
      "command": "npm",
      "args": [
        "exec",
        "--yes",
        "--allow-git=all",
        "github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0"
      ],
      "env": {
        "YOUTUBE_COOKIE_FILE": "/home/you/.config/youtube-personal-playlist-noapi-mcp/cookies.txt"
      }
    }
  }
}
```

</details>

<details>
<summary><b>DeepAgents</b></summary>

**Deep Agents CLI:** add this to `~/.deepagents/.mcp.json` (all projects) or to `.mcp.json` in a project. `${VAR}` values are read from your shell or `~/.deepagents/.env`, so secrets stay out of the file.

```json
{
  "mcpServers": {
    "youtube-playlists": {
      "command": "npm",
      "args": [
        "exec",
        "--yes",
        "--allow-git=all",
        "github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0"
      ],
      "env": {
        "YOUTUBE_COOKIE_FILE": "${YOUTUBE_COOKIE_FILE}"
      }
    }
  }
}
```

**Python library** (`pip install deepagents langchain-mcp-adapters`):

```python
import asyncio
import os

from deepagents import create_deep_agent
from langchain_mcp_adapters.client import MultiServerMCPClient

client = MultiServerMCPClient({
    "youtube-playlists": {
        "transport": "stdio",
        "command": "npm",
        "args": ["exec", "--yes", "--allow-git=all", "github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0"],
        "env": {
            "YOUTUBE_COOKIE_FILE": os.environ["YOUTUBE_COOKIE_FILE"],
        },
    }
})


async def main():
    tools = await client.get_tools()
    agent = create_deep_agent(model="anthropic:claude-sonnet-5-5", tools=tools)
    result = await agent.ainvoke({"messages": [{"role": "user", "content": "What can you do?"}]})
    print(result["messages"][-1].content)


asyncio.run(main())
```

</details>

<details>
<summary><b>Docker Agent</b></summary>

Save this as `agent.yaml`, then run `docker agent run agent.yaml`:

```yaml
agents:
  root:
    model: anthropic/claude-sonnet-5-5
    description: Assistant with the youtube-playlists MCP tools
    instruction: Use the youtube-playlists tools to answer the user's requests.
    toolsets:
      - type: mcp
        command: npm
        args:
          - "exec"
          - "--yes"
          - "--allow-git=all"
          - "github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0"
        env:
          YOUTUBE_COOKIE_FILE: "/home/you/.config/youtube-personal-playlist-noapi-mcp/cookies.txt"
```

</details>

<details>
<summary><b>Hermes Agent</b></summary>

Add this to `~/.hermes/config.yaml`, then run `/reload-mcp` in a chat:

```yaml
mcp_servers:
  youtube-playlists:
    command: npm
    args: ["exec", "--yes", "--allow-git=all", "github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0"]
    env:
      YOUTUBE_COOKIE_FILE: "/home/you/.config/youtube-personal-playlist-noapi-mcp/cookies.txt"
```

</details>

<details>
<summary><b>Cline / Roo Code / Kilo Code</b></summary>

MCP Servers → Configure (`cline_mcp_settings.json` / `mcp_settings.json`):

```json
{
  "mcpServers": {
    "youtube-playlists": {
      "command": "npm",
      "args": [
        "exec",
        "--yes",
        "--allow-git=all",
        "github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0"
      ],
      "env": {
        "YOUTUBE_COOKIE_FILE": "/home/you/.config/youtube-personal-playlist-noapi-mcp/cookies.txt"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Zed</b></summary>

Add this to `settings.json`:

```json
{
  "context_servers": {
    "youtube-playlists": {
      "command": "npm",
      "args": [
        "exec",
        "--yes",
        "--allow-git=all",
        "github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0"
      ],
      "env": {
        "YOUTUBE_COOKIE_FILE": "/home/you/.config/youtube-personal-playlist-noapi-mcp/cookies.txt"
      }
    }
  }
}
```

</details>

<details>
<summary><b>opencode</b></summary>

Add this to `opencode.json` (project) or `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "youtube-playlists": {
      "type": "local",
      "command": [
        "npm",
        "exec",
        "--yes",
        "--allow-git=all",
        "github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0"
      ],
      "environment": {
        "YOUTUBE_COOKIE_FILE": "/home/you/.config/youtube-personal-playlist-noapi-mcp/cookies.txt"
      },
      "enabled": true
    }
  }
}
```

</details>

<details>
<summary><b>Goose</b></summary>

Run `goose configure` → Add Extension → Command-line Extension, with the command `npm exec --yes --allow-git=all 'github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0'`. Or add this to
`~/.config/goose/config.yaml`:

```yaml
extensions:
  youtube-playlists:
    type: stdio
    enabled: true
    cmd: npm
    args: ["exec", "--yes", "--allow-git=all", "github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0"]
    envs:
      YOUTUBE_COOKIE_FILE: "/home/you/.config/youtube-personal-playlist-noapi-mcp/cookies.txt"
```

</details>

<details>
<summary><b>Other clients, a permanent install, a local checkout</b></summary>

Most clients take the standard `mcpServers` JSON shown for Claude Desktop. Some use `servers` instead.

To install once instead of fetching on each start:

```bash
npm install -g github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0
```

then use `"command": "youtube-personal-playlist-noapi-mcp"`, `"args": []`.

From a checkout: `"command": "node"`, `"args": ["/abs/path/youtube-personal-playlist-noapi-mcp/src/server.mjs"]`.

</details>

<!-- install:end -->

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
  npx -y github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0
```

or:

```bash
npx -y github:bigbatmanorg/youtube-personal-playlist-noapi-mcp#v1.2.0 \
  --cookie-file "$HOME/.config/my-youtube/cookies.txt"
```

## Tools

| Tool | Purpose | Annotation |
|---|---|---|
| `youtube_cookie_set` | Store pasted Netscape cookies.txt content or a raw Cookie header, then verify account + playlist access | write (local) |
| `youtube_cookie_status` | Show the cookie path and test current authentication | read-only |
| `youtube_account_info` | Account name and handle | read-only |
| `youtube_list_playlists` | All account playlists with visibility, video count and last update | read-only |
| `youtube_get_playlist` | One page of a playlist (Watch Later `WL` and Liked `LL` included), with each video's duration, channel, availability, views/age, percent watched and link; `page` counts pages of `limit` videos (max 100) | read-only |
| `youtube_playlist_stats` | Whole-playlist totals: duration, remaining time (also at 1.25×/1.5×/2×), watched / partially watched, unavailable, duplicates, top channels | read-only |
| `youtube_clean_playlist_preview` | List exactly which videos a clean-up would remove (`duplicate`, `unavailable`, `watched`) and return a `plan_token` | read-only |
| `youtube_clean_playlist_apply` | Remove exactly the previewed videos; fails with `PLAN_CHANGED` and removes nothing if the playlist changed since the preview | destructive |
| `youtube_create_playlist` | Create a playlist, optionally with initial videos | write |
| `youtube_rename_playlist` | Rename a playlist | write |
| `youtube_set_playlist_description` | Set a playlist description | write |
| `youtube_add_videos` | Add up to 50 videos | write |
| `youtube_remove_videos` | Remove up to 50 videos; fails without changes if any is not in the playlist | destructive |
| `youtube_delete_playlist` | Delete a playlist | destructive |

Playlist arguments accept a playlist ID or any YouTube URL with `list=`. Video arguments accept IDs or `watch`, `youtu.be` and `shorts` URLs. Special playlists (Watch Later `WL`, Liked `LL`, mixes) are read-only: stats and clean-up previews work on them, but nothing is modified. YouTube omits some unavailable videos from playlist pages, so counts can be lower than the number shown on YouTube's playlist badge. Every tool declares MCP annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) so clients can ask before destructive calls.

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
- `PLAN_CHANGED` means the playlist (or the clean-up options) changed after `youtube_clean_playlist_preview`; preview again and apply the new `plan_token`.
- npm 12 reporting `EALLOWGIT` requires the per-command `--allow-git=all` flag shown above. Do not disable npm security globally.
