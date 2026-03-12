import { VerifiableCredential } from '@/types';

/**
 * Reputation score system (0-100)
 * - Social: equal points per unique platform, capped at 40
 * - Education: uses course banner points from credentialSubject.points, capped at 30
 * - Physical: per unique document type, capped at 20
 * - Finance: wallet credentials, capped at 10
 */
export const SCORE_WEIGHTS = {
  SocialCredential: 0,       // dynamic: 40 / total connected platforms
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

  // Count unique social platforms first to distribute points equally
  const uniqueSocialPlatforms = new Set<string>();
  credentials.forEach((vc) => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];
    if (types.includes('SocialCredential')) {
      const sub = vc.credentialSubject as any;
      if (sub.platform) uniqueSocialPlatforms.add(String(sub.platform).toLowerCase());
    }
  });
  const socialCount = uniqueSocialPlatforms.size;
  const pointsPerSocial = socialCount > 0 ? Math.floor(SCORE_CAPS.social / socialCount) : 0;
  // Ensure total doesn't exceed cap: distribute remainder to first platforms
  const socialRemainder = socialCount > 0 ? SCORE_CAPS.social - (pointsPerSocial * socialCount) : 0;
  let socialIdx = 0;

  credentials.forEach((vc) => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];
    const type = types.find((t) => t in SCORE_WEIGHTS) as keyof typeof SCORE_WEIGHTS | undefined;

    if (!type) return;

    const sub = vc.credentialSubject as any;
    let key = type;

    if (type === 'SocialCredential' && sub.platform) {
      key = `social:${String(sub.platform).toLowerCase()}` as keyof typeof SCORE_WEIGHTS;
    } else if (type === 'EducationCredential' && sub.courseName) {
      key = `edu:${String(sub.courseName).toLowerCase()}` as keyof typeof SCORE_WEIGHTS;
    } else if (type === 'PhysicalCredential' && sub.documentType) {
      key = `doc:${String(sub.documentType).toLowerCase()}` as keyof typeof SCORE_WEIGHTS;
    } else if (type === 'WalletCreatedCredential' && sub.chain) {
      key = `wallet:${String(sub.chain).toLowerCase()}` as keyof typeof SCORE_WEIGHTS;
    } else if (type === 'WalletHistoryCredential') {
      key = 'wallet-history' as keyof typeof SCORE_WEIGHTS;
    }

    const dedupeKey = String(key);
    if (countedKeys.has(dedupeKey)) return;

    if (type === 'SocialCredential') {
      // Equal distribution: each platform gets floor(40/N), first ones get +1 for remainder
      const bonus = socialIdx < socialRemainder ? 1 : 0;
      categories.social = Math.min(categories.social + pointsPerSocial + bonus, SCORE_CAPS.social);
      socialIdx++;
    } else if (type === 'EducationCredential') {
      // Use the course banner points directly (e.g., 3 or 4 pts per course)
      const rawCoursePoints = Number(sub.points);
      const coursePoints = Number.isFinite(rawCoursePoints) && rawCoursePoints > 0
        ? Math.min(rawCoursePoints, 10)
        : 3; // sensible default if missing
      categories.education = Math.min(categories.education + coursePoints, SCORE_CAPS.education);
    } else if (type === 'PhysicalCredential') {
      categories.physical = Math.min(categories.physical + SCORE_WEIGHTS.PhysicalCredential, SCORE_CAPS.physical);
    } else if (type === 'WalletCreatedCredential' || type === 'WalletHistoryCredential') {
      const financePoints = type === 'WalletHistoryCredential'
        ? SCORE_WEIGHTS.WalletHistoryCredential
        : SCORE_WEIGHTS.WalletCreatedCredential;
      categories.finance = Math.min(categories.finance + financePoints, SCORE_CAPS.finance);
    }

    countedKeys.add(dedupeKey);
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
