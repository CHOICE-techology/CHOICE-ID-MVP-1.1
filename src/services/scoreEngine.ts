import { VerifiableCredential } from '@/types';

/**
 * Reputation score system (0-100)
 * - Social: max 40, split across platforms weighted by activity metrics
 *   · TOTAL_SOCIAL_PLATFORMS = 7 (X, GitHub, LinkedIn, YouTube, Telegram, Discord, Farcaster)
 *   · Each platform gets a quality score (0-1) from followers/engagement/authenticity
 *   · Points = quality * (40 / 7) per platform, sum capped at 40
 * - Education: 4 documents × 5 pts each = max 20
 * - Physical: per unique document type, 5 pts each, capped at 20
 * - Finance: wallet credentials, capped at 10
 *   Total max = 40 + 20 + 20 + 10 = 90 (leaving headroom; 100 requires excellence)
 */

export const TOTAL_SOCIAL_PLATFORMS = 7; // X, GitHub, LinkedIn, YouTube, Telegram, Discord, Farcaster

const MAX_POINTS_PER_PLATFORM = 40 / TOTAL_SOCIAL_PLATFORMS; // ~5.71 per platform

export const SCORE_WEIGHTS = {
  SocialCredential: 0,       // dynamic per-platform quality scoring
  EducationCredential: 5,    // 5 pts per document, 4 docs = 20
  PhysicalCredential: 5,     // 5 pts per unique doc type
  WalletCreatedCredential: 5,
  WalletHistoryCredential: 10,
};

export const SCORE_CAPS = {
  social: 40,
  physical: 20,
  education: 20,   // 4 documents × 5 = 20
  finance: 10,
};

export interface ScoreBreakdown {
  score: number;
  categories: {
    social: number;
    education: number;
    physical: number;
    finance: number;
  };
}

/**
 * Calculate a quality multiplier (0-1) for a social platform credential
 * based on real activity metrics: followers, engagement rate, bot probability.
 */
const getPlatformQuality = (vc: VerifiableCredential): number => {
  const sub = vc.credentialSubject as any;

  // If an explicit platformScore is set (0-100), use it directly
  if (typeof sub.platformScore === 'number') {
    return Math.min(sub.platformScore, 100) / 100;
  }

  const followers = Number(sub.followers) || 0;
  const engagementRate = parseFloat(sub.engagementRate) || 0;
  const botProbability = parseFloat(sub.botProbability) ?? 50;

  // Follower component (log scale, max ~0.35 at 1M+)
  const followerScore = Math.min(0.35, Math.log10(Math.max(followers, 1)) / 6 * 0.35);

  // Engagement component (max 0.40 at 8%+ engagement)
  const engScore = Math.min(0.40, engagementRate / 8 * 0.40);

  // Authenticity component (max 0.25 when bot probability is 0%)
  const authScore = Math.max(0, 0.25 * (1 - botProbability / 100));

  return Math.min(1, followerScore + engScore + authScore);
};

export const calculateReputationBreakdown = (credentials: VerifiableCredential[]): ScoreBreakdown => {
  if (!credentials || credentials.length === 0) {
    return {
      score: 0,
      categories: { social: 0, education: 0, physical: 0, finance: 0 }
    };
  }

  const countedKeys = new Set<string>();
  const categories = { social: 0, education: 0, physical: 0, finance: 0 };

  // ── Social: score each platform by quality, cap total at 40 ──
  const platformScores = new Map<string, number>(); // platform → best quality
  credentials.forEach((vc) => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];
    if (!types.includes('SocialCredential')) return;
    const sub = vc.credentialSubject as any;
    const platform = String(sub.platform || '').toLowerCase();
    if (!platform) return;
    const quality = getPlatformQuality(vc);
    const existing = platformScores.get(platform) ?? 0;
    if (quality > existing) platformScores.set(platform, quality);
  });

  let socialTotal = 0;
  platformScores.forEach((quality) => {
    // Each platform can contribute up to MAX_POINTS_PER_PLATFORM (~5.71)
    // weighted by its quality score (0-1)
    socialTotal += quality * MAX_POINTS_PER_PLATFORM;
  });
  categories.social = Math.min(Math.round(socialTotal), SCORE_CAPS.social);

  // ── Education, Physical, Finance ──
  credentials.forEach((vc) => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];
    const type = types.find((t) => t in SCORE_WEIGHTS) as keyof typeof SCORE_WEIGHTS | undefined;
    if (!type || type === 'SocialCredential') return;

    const sub = vc.credentialSubject as any;
    let key = type as string;

    if (type === 'EducationCredential' && sub.courseName) {
      key = `edu:${String(sub.courseName).toLowerCase()}`;
    } else if (type === 'PhysicalCredential' && sub.documentType) {
      key = `doc:${String(sub.documentType).toLowerCase()}`;
    } else if (type === 'WalletCreatedCredential' && sub.chain) {
      key = `wallet:${String(sub.chain).toLowerCase()}`;
    } else if (type === 'WalletHistoryCredential') {
      key = 'wallet-history';
    }

    if (countedKeys.has(key)) return;

    if (type === 'EducationCredential') {
      // Each education document = 5 points, max 20 (4 docs)
      categories.education = Math.min(
        categories.education + SCORE_WEIGHTS.EducationCredential,
        SCORE_CAPS.education
      );
    } else if (type === 'PhysicalCredential') {
      categories.physical = Math.min(
        categories.physical + SCORE_WEIGHTS.PhysicalCredential,
        SCORE_CAPS.physical
      );
    } else if (type === 'WalletCreatedCredential' || type === 'WalletHistoryCredential') {
      const financePoints = type === 'WalletHistoryCredential'
        ? SCORE_WEIGHTS.WalletHistoryCredential
        : SCORE_WEIGHTS.WalletCreatedCredential;
      categories.finance = Math.min(categories.finance + financePoints, SCORE_CAPS.finance);
    }

    countedKeys.add(key);
  });

  const totalScore = categories.social + categories.education + categories.physical + categories.finance;

  return {
    score: Math.min(totalScore, 100),
    categories,
  };
};

/**
 * Calculates a weighted identity score based on verifiable credentials.
 */
export const calculateIdentityScore = (credentials: VerifiableCredential[]): number => {
  return calculateReputationBreakdown(credentials).score;
};
