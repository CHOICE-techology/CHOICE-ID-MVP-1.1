import { VerifiableCredential } from '@/types';

/**
 * Reputation score system (0-100)
 * - Social: 40 pts split across 12 platforms (11 named + Other), weighted by activity quality
 *   Each platform gets at most 40/11 ≈ 3.64 pts. Low activity = ~1-2, high = ~3.5
 * - Education: uses course banner points from credentialSubject.points, capped at 30
 * - Physical: 5 pts per unique document type, max 20 (4 docs × 5 = 20)
 * - Finance: wallet credentials, capped at 10
 */

const TOTAL_SOCIAL_PLATFORMS = 11; // 11 named platforms (excl. "Other/Custom")

export const SCORE_WEIGHTS = {
  SocialCredential: 0,        // calculated dynamically via weighted quality
  EducationCredential: 0,     // uses course.points from banner directly
  PhysicalCredential: 5,      // 5 per document type, 4 types = 20 max
  WalletCreatedCredential: 5,
  WalletHistoryCredential: 10,
};

export const SCORE_CAPS = {
  social: 40,
  physical: 20,
  education: 30,
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
 * Calculate weighted social points for a single platform credential.
 * Uses followers, engagement, bot probability to derive a quality multiplier (0-1),
 * then scales by (40 / TOTAL_SOCIAL_PLATFORMS) so all platforms together sum to ≤40.
 */
const calculateSocialPlatformScore = (sub: any): number => {
  const followers = Number(sub.followers) || 0;
  const engagement = parseFloat(sub.engagementRate) || 0;
  const botPct = parseFloat(sub.botProbability) || 50;

  // Influence component (0-0.4): log scale of followers
  const influenceRaw = Math.min(1, Math.log10(Math.max(followers, 1)) / 6);
  // Engagement component (0-0.3): engagement rate scaled
  const engagementRaw = Math.min(1, engagement / 10);
  // Authenticity component (0-0.3): inverse of bot probability
  const authRaw = Math.max(0, (100 - botPct) / 100);

  const quality = influenceRaw * 0.4 + engagementRaw * 0.3 + authRaw * 0.3;

  // Each platform gets at most (40 / TOTAL_SOCIAL_PLATFORMS) points
  const maxPerPlatform = 40 / TOTAL_SOCIAL_PLATFORMS;
  return Math.round(quality * maxPerPlatform * 10) / 10;
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

  // First pass: collect unique social platforms
  const socialCreds: { sub: any; key: string }[] = [];
  credentials.forEach((vc) => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];
    if (types.includes('SocialCredential')) {
      const sub = vc.credentialSubject as any;
      const key = `social:${String(sub.platform || '').toLowerCase()}`;
      if (!socialCreds.some(s => s.key === key)) {
        socialCreds.push({ sub, key });
      }
    }
  });

  // Calculate social scores — always divided by TOTAL_SOCIAL_PLATFORMS (not connected count)
  socialCreds.forEach(({ sub, key }) => {
    if (countedKeys.has(key)) return;
    countedKeys.add(key);
    const pts = calculateSocialPlatformScore(sub);
    categories.social = Math.min(categories.social + pts, SCORE_CAPS.social);
  });

  // Second pass: non-social credentials
  credentials.forEach((vc) => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];
    const type = types.find((t) => t in SCORE_WEIGHTS && t !== 'SocialCredential') as keyof typeof SCORE_WEIGHTS | undefined;

    if (!type) return;

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
      const rawCoursePoints = Number(sub.points);
      const coursePoints = Number.isFinite(rawCoursePoints) && rawCoursePoints > 0
        ? Math.min(rawCoursePoints, 10)
        : 3;
      categories.education = Math.min(categories.education + coursePoints, SCORE_CAPS.education);
    } else if (type === 'PhysicalCredential') {
      categories.physical = Math.min(categories.physical + SCORE_WEIGHTS.PhysicalCredential, SCORE_CAPS.physical);
    } else if (type === 'WalletCreatedCredential' || type === 'WalletHistoryCredential') {
      const financePoints = type === 'WalletHistoryCredential'
        ? SCORE_WEIGHTS.WalletHistoryCredential
        : SCORE_WEIGHTS.WalletCreatedCredential;
      categories.finance = Math.min(categories.finance + financePoints, SCORE_CAPS.finance);
    }

    countedKeys.add(key);
  });

  const totalScore = Math.round(categories.social) + categories.education + categories.physical + categories.finance;

  return {
    score: Math.min(totalScore, 100),
    categories: {
      ...categories,
      social: Math.round(categories.social),
    },
  };
};

/**
 * Calculates a weighted identity score based on verifiable credentials.
 */
export const calculateIdentityScore = (credentials: VerifiableCredential[]): number => {
  return calculateReputationBreakdown(credentials).score;
};
