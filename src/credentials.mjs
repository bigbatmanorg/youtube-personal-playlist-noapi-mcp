import fs from 'node:fs/promises';
import path from 'node:path';

const YOUTUBE_DOMAIN = /(^|\.)youtube\.com$/i;

export function cookieNames(header) {
  return String(header || '').split(/;\s*/).map((part) => part.split('=', 1)[0]).filter(Boolean);
}

export function detectCookieFormat(text) {
  const raw = String(text || '').trim();
  if (!raw) return 'empty';
  if (/^#\s*Netscape HTTP Cookie File/im.test(raw) || raw.includes('\t')) return 'netscape';
  if (raw.includes('=')) return 'header';
  return 'unknown';
}

export function parseCookieText(text) {
  const raw = String(text || '').trim();
  if (!raw) throw new Error('COOKIE_PARSE_FAILED: cookie text is empty');
  const format = detectCookieFormat(raw);
  if (format === 'header') {
    const header = raw.replace(/^cookie\s*:\s*/i, '').trim();
    if (!header.includes('=')) throw new Error('COOKIE_PARSE_FAILED: invalid Cookie header');
    return header;
  }
  const pairs = [];
  for (const original of raw.split(/\r?\n/)) {
    let line = original.trim();
    if (!line) continue;
    if (line.startsWith('#HttpOnly_')) line = line.slice('#HttpOnly_'.length);
    else if (line.startsWith('#')) continue;
    const columns = line.split('\t');
    if (columns.length < 7) continue;
    const domain = columns[0].replace(/^\./, '').toLowerCase();
    const name = columns[5]?.trim();
    const value = columns.slice(6).join('\t');
    if (!YOUTUBE_DOMAIN.test(domain) || !name || !value) continue;
    pairs.push(`${name}=${value}`);
  }
  if (!pairs.length) throw new Error('COOKIE_PARSE_FAILED: no youtube.com cookies found');
  return pairs.join('; ');
}

export async function loadCookieFile(cookieFile) {
  try {
    return parseCookieText(await fs.readFile(cookieFile, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') throw new Error('COOKIE_FILE_NOT_FOUND: no stored YouTube cookies');
    throw error;
  }
}

export async function saveCookieText(cookieFile, text) {
  const header = parseCookieText(text);
  await fs.mkdir(path.dirname(cookieFile), { recursive: true, mode: 0o700 });
  const temp = `${cookieFile}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(temp, `${header}\n`, { mode: 0o600 });
  await fs.chmod(temp, 0o600);
  await fs.rename(temp, cookieFile);
  await fs.chmod(cookieFile, 0o600);
  return { header, count: cookieNames(header).length, format: detectCookieFormat(text) };
}

export async function cookieStatus(cookieFile) {
  try {
    const stat = await fs.stat(cookieFile);
    const header = await loadCookieFile(cookieFile);
    return {
      configured: true,
      cookie_file: cookieFile,
      cookie_count: cookieNames(header).length,
      mode: (stat.mode & 0o777).toString(8).padStart(3, '0')
    };
  } catch (error) {
    if (error?.code === 'ENOENT' || /COOKIE_FILE_NOT_FOUND/.test(String(error?.message || error))) {
      return { configured: false, cookie_file: cookieFile, cookie_count: 0, mode: null };
    }
    throw error;
  }
}
