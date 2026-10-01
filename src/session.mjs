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
    this.youtube = null;
  }
  invalidate() { this.youtube = null; }
  async get() {
    if (!this.youtube) this.youtube = await createYouTubeFromFile(this.cookieFile);
    return this.youtube;
  }
}
