import { VerifiableCredential, CredentialType } from '../types';
import { differenceInYears, parseISO } from 'date-fns';

const CREDENTIAL_WEIGHTS: Record<string, number> = {
  'government_id': 50,
  'professional': 30,
  'education': 25,
  'social': 15,
  'self_attested': 5,
  'PhysicalCredential': 20,
  'SocialCredential': 10,
  'EducationCredential': 10,
  'WalletHistoryCredential': 10,
};

export interface ReputationBreakdown {
  baseScore: number;
  weightedScore: number;
  timeDecayAdjustment: number;
  totalScore: number;
  categories: {
    physical: number;
    social: number;
    finance: number;
    education: number;
  };
}

export interface ReputationResult {
  score: number;
  breakdown: ReputationBreakdown;
  sybilRisk: 'low' | 'medium' | 'high';
}

export const calculateReputation = (credentials: VerifiableCredential[]): ReputationResult => {
  const baseScore = 10;
  let weightedScore = 0;
  let totalDecay = 0;

  const categories = { physical: 0, social: 0, finance: 0, education: 0 };
  const now = new Date();

  credentials.forEach((vc) => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];
    let weight = 5;
    types.forEach(t => {
      const w = CREDENTIAL_WEIGHTS[t as CredentialType];
      if (w && w > weight) weight = w;
    });

    if (types.includes('PhysicalCredential')) categories.physical += weight;
    else if (types.includes('SocialCredential')) categories.social += weight;
    else if (types.includes('WalletHistoryCredential')) categories.finance += weight;
    else if (types.includes('EducationCredential')) categories.education += weight;

    const issueDate = typeof vc.issuanceDate === 'string' ? parseISO(vc.issuanceDate) : vc.issuanceDate as unknown as Date;
    const yearsOld = differenceInYears(now, issueDate);

    let decayFactor = 1;
    if (yearsOld >= 1) {
      decayFactor = Math.max(0.1, 1 - (yearsOld * 0.1));
    }

    const contribution = weight * decayFactor;
    weightedScore += weight;
    totalDecay += (weight - contribution);
  });

  const finalScore = Math.min(100, Math.round(baseScore + (weightedScore - totalDecay)));

  const nonSelfAttestedCount = credentials.filter(vc => vc.type !== 'self_attested').length;
  let sybilRisk: 'low' | 'medium' | 'high' = 'high';
  if (nonSelfAttestedCount >= 3) sybilRisk = 'low';
  else if (nonSelfAttestedCount >= 1) sybilRisk = 'medium';

  return {
    score: finalScore,
    breakdown: {
      baseScore,
      weightedScore,
      timeDecayAdjustment: -Math.round(totalDecay),
      totalScore: finalScore,
      categories
    },
    sybilRisk,
  };
};
