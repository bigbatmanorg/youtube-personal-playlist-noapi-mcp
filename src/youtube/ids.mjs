const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{2,64}$/;
const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtu.be']);

function youtubeUrl(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' || !HOSTS.has(url.hostname)) throw new Error(`INVALID_ID: not a YouTube URL: ${value}`);
  return url;
}

// Accepts a bare video ID or a youtube.com/watch, youtu.be, /shorts/, /embed/ or /live/ URL.
export function normalizeVideoId(value) {
  const raw = String(value || '').trim();
  if (VIDEO_ID.test(raw)) return raw;
  const url = youtubeUrl(raw);
  const parts = url ? url.pathname.split('/').filter(Boolean) : [];
  const candidate = !url ? null
    : url.hostname.endsWith('youtu.be') ? parts[0]
    : url.pathname === '/watch' ? url.searchParams.get('v')
    : ['shorts', 'embed', 'live'].includes(parts[0]) ? parts[1]
    : null;
  if (candidate && VIDEO_ID.test(candidate)) return candidate;
  throw new Error(`INVALID_ID: not a YouTube video ID or URL: ${raw}`);
}

// Accepts a bare playlist ID (including WL/LL) or any YouTube URL with a list= parameter.
export function normalizePlaylistId(value) {
  const raw = String(value || '').trim();
  const url = youtubeUrl(raw);
  const candidate = url ? url.searchParams.get('list') : raw;
  if (candidate && PLAYLIST_ID.test(candidate)) return candidate;
  throw new Error(`INVALID_ID: not a YouTube playlist ID or URL: ${raw}`);
}

export function normalizeVideoIds(values) {
  return [...new Set(values.map(normalizeVideoId))];
}
