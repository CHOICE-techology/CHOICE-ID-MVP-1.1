import { VerifiableCredential } from '@/types';

/**
 * Reputation score system (0-100)
 * - Social: proportional to connected/total platforms, capped at 40
 *   · TOTAL_SOCIAL_PLATFORMS = 7 (X, GitHub, LinkedIn, YouTube, Telegram, Discord, Farcaster)
 *   · score = round((connectedCount / 7) * 40)
 *   · 1 platform ≈ 6 pts, 2 ≈ 11, 3 ≈ 17, 7 = 40
 * - Education: uses course banner points from credentialSubject.points, capped at 30
 * - Physical: per unique document type, capped at 20
 * - Finance: wallet credentials, capped at 10
 */

export const TOTAL_SOCIAL_PLATFORMS = 7; // X, GitHub, LinkedIn, YouTube, Telegram, Discord, Farcaster

export const SCORE_WEIGHTS = {
  SocialCredential: 0,       // dynamic: round((count/7)*40)
  EducationCredential: 0,    // uses course.points from banner directly
  PhysicalCredential: 10,
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

export const calculateReputationBreakdown = (credentials: VerifiableCredential[]): ScoreBreakdown => {
  if (!credentials || credentials.length === 0) {
    return {
      score: 0,
      categories: { social: 0, education: 0, physical: 0, finance: 0 }
    };
  }

  const countedKeys = new Set<string>();
  const categories = { social: 0, education: 0, physical: 0, finance: 0 };

  // Count unique social platforms
  const uniqueSocialPlatforms = new Set<string>();
  credentials.forEach((vc) => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];
    if (types.includes('SocialCredential')) {
      const sub = vc.credentialSubject as any;
      if (sub.platform) uniqueSocialPlatforms.add(String(sub.platform).toLowerCase());
    }
  });

  // Social score = round((connectedCount / TOTAL_SOCIAL_PLATFORMS) * 40)
  // 1 platform = ~6 pts, 2 = ~11, 7 = 40
  categories.social = Math.min(
    Math.round((uniqueSocialPlatforms.size / TOTAL_SOCIAL_PLATFORMS) * SCORE_CAPS.social),
    SCORE_CAPS.social
  );

  credentials.forEach((vc) => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];
    const type = types.find((t) => t in SCORE_WEIGHTS) as keyof typeof SCORE_WEIGHTS | undefined;

    if (!type) return;

    const sub = vc.credentialSubject as any;
    let key = type as string;

    if (type === 'SocialCredential') {
      // Already handled above
      return;
    } else if (type === 'EducationCredential' && sub.courseName) {
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
