import { Innertube } from 'youtubei.js';
import { loadCookieFile, parseCookieText } from './credentials.mjs';

export async function createYouTubeFromHeader(cookieHeader) {
  const cookie = parseCookieText(cookieHeader);
  const youtube = await Innertube.create({ cookie });
  if (!youtube.session?.logged_in) throw new Error('NOT_LOGGED_IN: YouTube did not accept these cookies');
  return youtube;
}

export async function createYouTubeFromFile(cookieFile) {
  return createYouTubeFromHeader(await loadCookieFile(cookieFile));
}

export class SessionProvider {
  constructor(cookieFile) {
    this.cookieFile = cookieFile;
    this.pending = null;
  }
  invalidate() { this.pending = null; }
  // Concurrent first calls share one in-flight session instead of each creating one.
  get() {
    if (!this.pending) {
      const pending = createYouTubeFromFile(this.cookieFile);
      this.pending = pending;
      pending.catch(() => { if (this.pending === pending) this.pending = null; });
    }
    return this.pending;
  }
}
