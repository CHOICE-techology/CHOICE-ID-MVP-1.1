// Official brand logos for social platforms
import xTwitterLogo from '@/assets/logos/x-twitter.png';
import githubLogo from '@/assets/logos/github.png';
import discordLogo from '@/assets/logos/discord.png';
import telegramLogo from '@/assets/logos/telegram.png';
import linkedinLogo from '@/assets/logos/linkedin.png';
import instagramLogo from '@/assets/logos/instagram.png';
import youtubeLogo from '@/assets/logos/youtube.png';
import tiktokLogo from '@/assets/logos/tiktok.png';
import farcasterLogo from '@/assets/logos/farcaster.png';
import facebookLogo from '@/assets/logos/facebook.png';
import metaLogo from '@/assets/logos/meta.png';

export interface PlatformMeta {
  logo: string;
  /** neon accent color for glow & badge */
  color: string;
  /** tailwind bg for icon pill */
  bgClass: string;
}

export const PLATFORM_META: Record<string, PlatformMeta> = {
  x:         { logo: xTwitterLogo,  color: '#e2e8f0', bgClass: 'bg-slate-900' },
  twitter:   { logo: xTwitterLogo,  color: '#0ea5e9', bgClass: 'bg-sky-900' },
  linkedin:  { logo: linkedinLogo,  color: '#0ea5e9', bgClass: 'bg-blue-700' },
  instagram: { logo: instagramLogo, color: '#ec4899', bgClass: 'bg-pink-700' },
  github:    { logo: githubLogo,    color: '#94a3b8', bgClass: 'bg-slate-700' },
  youtube:   { logo: youtubeLogo,   color: '#ef4444', bgClass: 'bg-red-700' },
  tiktok:    { logo: tiktokLogo,    color: '#06b6d4', bgClass: 'bg-slate-900' },
  telegram:  { logo: telegramLogo,  color: '#0ea5e9', bgClass: 'bg-sky-600' },
  discord:   { logo: discordLogo,   color: '#818cf8', bgClass: 'bg-indigo-700' },
  farcaster: { logo: farcasterLogo, color: '#a855f7', bgClass: 'bg-purple-700' },
  facebook:  { logo: facebookLogo,  color: '#3b82f6', bgClass: 'bg-blue-700' },
  meta:      { logo: metaLogo,      color: '#3b82f6', bgClass: 'bg-blue-600' },
};

const PLATFORM_ALIASES: Record<string, string> = {
  'x / twitter': 'x',
  'x.com': 'x',
  'twitter.com': 'twitter',
  'linkedin': 'linkedin',
  'github': 'github',
  'youtube': 'youtube',
  'you tube': 'youtube',
};

const normalizePlatformKey = (platform: string) =>
  platform
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/$/, '');

export const getPlatformMeta = (platform: string): PlatformMeta | null => {
  const normalized = normalizePlatformKey(platform);
  const mapped = PLATFORM_ALIASES[normalized] ?? normalized;
  return PLATFORM_META[mapped] ?? null;
};
