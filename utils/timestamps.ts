export function normalizeTimestamp(raw: string): string | null {
  const s = (raw || '').trim();
  if (!s) return null;

  const parts = s.split(':');
  if (parts.length !== 2 && parts.length !== 3) return null;

  const nums = parts.map((p) => (p === '' ? NaN : Number(p)));
  if (nums.some((n) => !Number.isFinite(n))) return null;

  const [a, b, c] = nums;
  if (parts.length === 2) {
    const mm = a;
    const ss = b;
    if (mm < 0 || ss < 0 || ss > 59) return null;
    const mmStr = String(mm).padStart(2, '0');
    const ssStr = String(ss).padStart(2, '0');
    return `${mmStr}:${ssStr}`;
  }

  const hh = a;
  const mm = b;
  const ss = c;
  if (hh < 0 || mm < 0 || mm > 59 || ss < 0 || ss > 59) return null;
  const hhStr = String(hh).padStart(2, '0');
  const mmStr = String(mm).padStart(2, '0');
  const ssStr = String(ss).padStart(2, '0');
  return `${hhStr}:${mmStr}:${ssStr}`;
}

export function timestampToSeconds(raw: string): number | null {
  const t = normalizeTimestamp(raw);
  if (!t) return null;
  const parts = t.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

/**
 * Convert occurrences of timestamps in free text into markdown links.
 * Example: "See 5:30" -> "See [05:30](yt-ts://05:30)"
 */
export function linkifyTimestampsToMarkdown(text: string): string {
  if (!text) return '';

  // Match mm:ss or hh:mm:ss where seconds are 2 digits.
  // - allows 1-2 digit h/m
  // - avoids grabbing part of a longer token
  const re = /\b(\d{1,2}:\d{2}|\d{1,2}:\d{2}:\d{2})\b/g;

  return text.replace(re, (match) => {
    const normalized = normalizeTimestamp(match);
    if (!normalized) return match;
    return `[${normalized}](yt-ts://${normalized})`;
  });
}

export function isYoutubeTimestampUrl(url: string): boolean {
  return typeof url === 'string' && url.startsWith('yt-ts://');
}

export function parseYoutubeTimestampUrl(url: string): string | null {
  if (!isYoutubeTimestampUrl(url)) return null;
  const value = url.slice('yt-ts://'.length);
  return normalizeTimestamp(value);
}

