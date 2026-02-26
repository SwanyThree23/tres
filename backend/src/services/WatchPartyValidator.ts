/**
 * Watch Party URL Validator
 * Restricts Watch Party sources to embeddable/licensed platforms only.
 * Blocks raw video file URLs from untrusted sources.
 *
 * Risk mitigated: DMCA violations from streaming copyrighted content.
 */

const ALLOWED_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
  'dailymotion.com',
  'www.dailymotion.com',
  'soundcloud.com',
  'twitch.tv',
  'www.twitch.tv',
  'clips.twitch.tv',
];

const BLOCKED_EXTENSIONS = [
  '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm',
  '.mp3', '.wav', '.flac', '.ogg', '.aac',
];

export interface UrlValidationResult {
  valid: boolean;
  reason?: string;
  platform?: string;
}

/**
 * Validate that a Watch Party URL is from an allowed embeddable source.
 * Rejects raw video/audio file links and untrusted domains.
 */
export function validateWatchPartyUrl(url: string): UrlValidationResult {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  // Block non-http(s) protocols
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, reason: 'Only HTTP/HTTPS URLs are allowed' };
  }

  // Block raw media file extensions
  const pathname = parsed.pathname.toLowerCase();
  for (const ext of BLOCKED_EXTENSIONS) {
    if (pathname.endsWith(ext)) {
      return {
        valid: false,
        reason: `Direct media files (${ext}) are not allowed. Use YouTube, Vimeo, or another supported platform.`,
      };
    }
  }

  // Check against allowed domains
  const hostname = parsed.hostname.toLowerCase();
  const isAllowed = ALLOWED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith('.' + domain)
  );

  if (!isAllowed) {
    return {
      valid: false,
      reason: `Domain "${hostname}" is not supported. Watch Party supports: YouTube, Vimeo, Dailymotion, SoundCloud, and Twitch.`,
    };
  }

  // Identify platform
  let platform = 'unknown';
  if (hostname.includes('youtube') || hostname.includes('youtu.be')) platform = 'youtube';
  else if (hostname.includes('vimeo')) platform = 'vimeo';
  else if (hostname.includes('dailymotion')) platform = 'dailymotion';
  else if (hostname.includes('soundcloud')) platform = 'soundcloud';
  else if (hostname.includes('twitch')) platform = 'twitch';

  return { valid: true, platform };
}
