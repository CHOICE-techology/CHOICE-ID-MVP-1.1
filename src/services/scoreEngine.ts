import { VerifiableCredential } from '@/types';

/**
 * Score weights — Social gives equal points per platform (max 40 total).
 * With up to 8 social platforms at 5 pts each = 40 max.
 */
export const SCORE_WEIGHTS = {
  SocialCredential: 5,      // per unique platform, max 40
  PhysicalCredential: 10,   // per unique doc type, max 20
  EducationCredential: 5,   // per unique course, max 30
  WalletCreatedCredential: 5, // per unique chain, max 10
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

  credentials.forEach(vc => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];
    const type = types.find(t => SCORE_WEIGHTS[t as keyof typeof SCORE_WEIGHTS]) as keyof typeof SCORE_WEIGHTS;
    
    if (!type) return;

    let key = type as string;
    const sub = vc.credentialSubject as any;

    if (type === 'SocialCredential' && sub.platform) {
      key = `social:${sub.platform.toLowerCase()}`;
    } else if (type === 'EducationCredential' && sub.courseName) {
      key = `edu:${sub.courseName.toLowerCase()}`;
    } else if (type === 'PhysicalCredential' && sub.documentType) {
      key = `doc:${sub.documentType.toLowerCase()}`;
    } else if (type === 'WalletCreatedCredential' && sub.chain) {
      key = `wallet:${sub.chain.toLowerCase()}`;
    }

    if (!countedKeys.has(key)) {
      const points = SCORE_WEIGHTS[type];
      if (type === 'SocialCredential') {
        categories.social = Math.min(categories.social + points, SCORE_CAPS.social);
      } else if (type === 'EducationCredential') {
        categories.education = Math.min(categories.education + points, SCORE_CAPS.education);
      } else if (type === 'PhysicalCredential') {
        categories.physical = Math.min(categories.physical + points, SCORE_CAPS.physical);
      } else if (type === 'WalletCreatedCredential') {
        categories.finance = Math.min(categories.finance + points, SCORE_CAPS.finance);
      }
      
      countedKeys.add(key);
    }
  });

  const totalScore = categories.social + categories.education + categories.physical + categories.finance;

  return {
    score: Math.min(totalScore, 100),
    categories
  };
};

/**
 * Calculates a weighted identity score based on verifiable credentials.
 */
export const calculateIdentityScore = (credentials: VerifiableCredential[]): number => {
  return calculateReputationBreakdown(credentials).score;
};
