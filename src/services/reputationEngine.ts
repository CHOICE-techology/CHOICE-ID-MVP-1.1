import { VerifiableCredential } from '../types';

// Max points per category
const MAX_SOCIAL = 40;
const MAX_EDUCATION = 30;
const MAX_REAL_WORLD = 20;
const MAX_FINANCE = 10;
// Total possible = 100

// 11 social platforms, each gives equal share
const SOCIAL_PLATFORMS_COUNT = 11;
const POINTS_PER_SOCIAL = MAX_SOCIAL / SOCIAL_PLATFORMS_COUNT; // ~3.636

// 4 document slots, each 5 points
const POINTS_PER_DOCUMENT = 5;

// Finance scoring:
// - 5 pts for creating a wallet in-app (WalletCreatedCredential)
// - 10 pts for having existing wallet history with transactions (WalletHistoryCredential)
// - If both exist: wallet created (5) + analyzed with history (5) = 10 max
const POINTS_WALLET_CREATED = 5;
const POINTS_WALLET_HISTORY_EXISTING = 10;
const POINTS_WALLET_HISTORY_AFTER_CREATION = 5;

export interface ReputationBreakdown {
  baseScore: number;
  weightedScore: number;
  timeDecayAdjustment: number;
  totalScore: number;
  categories: {
    social: number;
    education: number;
    physical: number;
    finance: number;
  };
}

export interface ReputationResult {
  score: number;
  breakdown: ReputationBreakdown;
  sybilRisk: 'low' | 'medium' | 'high';
}

export const calculateReputation = (credentials: VerifiableCredential[]): ReputationResult => {
  if (!credentials || credentials.length === 0) {
    return {
      score: 0,
      breakdown: {
        baseScore: 0,
        weightedScore: 0,
        timeDecayAdjustment: 0,
        totalScore: 0,
        categories: { social: 0, education: 0, physical: 0, finance: 0 },
      },
      sybilRisk: 'high',
    };
  }

  let socialRaw = 0;
  let educationRaw = 0;
  let physicalRaw = 0;
  let financeRaw = 0;

  let socialCount = 0;
  let docCount = 0;
  let hasWalletCreated = false;
  let hasWalletHistory = false;
  let walletHistoryTxCount = 0;

  credentials.forEach((vc) => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];

    if (types.includes('SocialCredential')) {
      socialCount++;
      socialRaw = Math.min(MAX_SOCIAL, socialCount * POINTS_PER_SOCIAL);
    } else if (types.includes('EducationCredential')) {
      const coursePoints = (vc.credentialSubject as any)?.points;
      if (typeof coursePoints === 'number' && !isNaN(coursePoints)) {
        educationRaw += coursePoints;
      } else {
        educationRaw += 3;
      }
      educationRaw = Math.min(MAX_EDUCATION, educationRaw);
    } else if (types.includes('PhysicalCredential')) {
      docCount++;
      physicalRaw = Math.min(MAX_REAL_WORLD, docCount * POINTS_PER_DOCUMENT);
    } else if (types.includes('WalletCreatedCredential')) {
      hasWalletCreated = true;
    } else if (types.includes('WalletHistoryCredential')) {
      hasWalletHistory = true;
      const stats = vc.credentialSubject as any;
      walletHistoryTxCount = Number(stats?.txCount) || 0;
    }
  });

  // Finance scoring logic:
  if (hasWalletCreated && hasWalletHistory) {
    // User created wallet in-app (5pts) + later analyzed and has history (+5pts) = 10
    financeRaw = POINTS_WALLET_CREATED;
    if (walletHistoryTxCount > 0) {
      financeRaw += POINTS_WALLET_HISTORY_AFTER_CREATION;
    }
  } else if (hasWalletHistory) {
    // User connected existing wallet with history = 10pts
    if (walletHistoryTxCount > 0) {
      financeRaw = POINTS_WALLET_HISTORY_EXISTING;
    } else {
      // Wallet analyzed but no transactions
      financeRaw = POINTS_WALLET_CREATED;
    }
  } else if (hasWalletCreated) {
    // User only created wallet in-app, no analysis yet = 5pts
    financeRaw = POINTS_WALLET_CREATED;
  }

  financeRaw = Math.min(MAX_FINANCE, financeRaw);

  // Ensure no NaN values with safe number conversion
  const safe = (n: number) => (isNaN(n) || !isFinite(n) ? 0 : n);

  const social = safe(Math.round(Math.min(MAX_SOCIAL, socialRaw) * 100) / 100);
  const education = safe(Math.min(MAX_EDUCATION, educationRaw));
  const physical = safe(Math.min(MAX_REAL_WORLD, physicalRaw));
  const finance = safe(Math.min(MAX_FINANCE, financeRaw));

  const totalScore = safe(Math.min(100, Math.round(social + education + physical + finance)));

  const nonSelfAttestedCount = credentials.filter(vc => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];
    return !types.includes('self_attested');
  }).length;

  let sybilRisk: 'low' | 'medium' | 'high' = 'high';
  if (nonSelfAttestedCount >= 3) sybilRisk = 'low';
  else if (nonSelfAttestedCount >= 1) sybilRisk = 'medium';

  return {
    score: totalScore,
    breakdown: {
      baseScore: 0,
      weightedScore: totalScore,
      timeDecayAdjustment: 0,
      totalScore,
      categories: {
        social: safe(Math.round(social)),
        education: safe(education),
        physical: safe(physical),
        finance: safe(finance),
      }
    },
    sybilRisk,
  };
};
