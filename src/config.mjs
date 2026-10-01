import os from 'node:os';
import path from 'node:path';

const APP_DIR = 'youtube-personal-playlist-noapi-mcp';

export function parseCookieFileArg(argv = process.argv.slice(2)) {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--cookie-file' && argv[i + 1]) return argv[i + 1];
    if (arg.startsWith('--cookie-file=')) return arg.slice('--cookie-file='.length);
  }
  return null;
}

export function defaultCookieFile(env = process.env, homedir = os.homedir()) {
  const configHome = env.XDG_CONFIG_HOME || path.join(homedir, '.config');
  return path.join(configHome, APP_DIR, 'cookies.txt');
}

export function resolveCookieFile({ env = process.env, argv = process.argv.slice(2), homedir = os.homedir() } = {}) {
  return path.resolve(
    parseCookieFileArg(argv) ||
    env.YOUTUBE_COOKIE_FILE ||
    defaultCookieFile(env, homedir)
  );
}

export const appName = APP_DIR;
