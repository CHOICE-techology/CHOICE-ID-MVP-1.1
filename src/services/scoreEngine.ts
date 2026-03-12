import { VerifiableCredential } from '@/types';

/**
 * Reputation score system (0-100)
 * - Social: weighted quality-based points per unique platform, capped at 40
 * - Education: uses course banner points from credentialSubject.points, capped at 30
 * - Physical: 5 points per unique document type, capped at 20
 * - Finance: wallet credentials, capped at 10
 */
export const SCORE_CAPS = {
  social: 40,
  physical: 20,
  education: 30,
  finance: 10,
};

const SOCIAL_PLATFORM_MAX = 7;
const SOCIAL_SLOT_POINTS = SCORE_CAPS.social / SOCIAL_PLATFORM_MAX;

export const SCORE_WEIGHTS = {
  SocialCredential: Number(SOCIAL_SLOT_POINTS.toFixed(2)),
  EducationCredential: 0,
  PhysicalCredential: 5,
  WalletCreatedCredential: 5,
  WalletHistoryCredential: 10,
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

const parseMetricNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizeText = (value: unknown, fallback: string) => {
  const normalized = String(value ?? fallback).trim().toLowerCase();
  return normalized || fallback;
};

const getSocialQualityMultiplier = (subject: Record<string, unknown>): number => {
  const followers = Math.max(parseMetricNumber(subject.followers), 0);
  const engagementPct = clamp(parseMetricNumber(subject.engagementRate), 0, 100);
  const botProbability = clamp(parseMetricNumber(subject.botProbability), 0, 100);

  const followerQuality = clamp(Math.log10(followers + 1) / 5, 0, 1);
  const engagementQuality = clamp(engagementPct / 8, 0, 1);
  const authenticityQuality = clamp(1 - botProbability / 100, 0, 1);

  // Keep one low-quality platform modest (~1-2 pts), while high-quality portfolios can reach cap.
  const weighted =
    followerQuality * 0.45 +
    engagementQuality * 0.35 +
    authenticityQuality * 0.2;

  return clamp(weighted, 0.2, 1);
};

export const calculateReputationBreakdown = (credentials: VerifiableCredential[]): ScoreBreakdown => {
  if (!credentials || credentials.length === 0) {
    return {
      score: 0,
      categories: { social: 0, education: 0, physical: 0, finance: 0 },
    };
  }

  const seenSocial = new Set<string>();
  const seenEducation = new Set<string>();
  const seenPhysical = new Set<string>();
  const seenWalletCreated = new Set<string>();
  let hasWalletHistory = false;

  let socialRaw = 0;
  const categories = { social: 0, education: 0, physical: 0, finance: 0 };

  credentials.forEach((vc) => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];
    const type = types.find((t) => t in SCORE_WEIGHTS) as keyof typeof SCORE_WEIGHTS | undefined;

    if (!type) return;

    const subject = (vc.credentialSubject ?? {}) as Record<string, unknown>;

    if (type === 'SocialCredential') {
      const platformKey = normalizeText(subject.platform, vc.id);
      if (seenSocial.has(platformKey)) return;
      seenSocial.add(platformKey);

      const qualityMultiplier = getSocialQualityMultiplier(subject);
      socialRaw += SOCIAL_SLOT_POINTS * qualityMultiplier;
      return;
    }

    if (type === 'EducationCredential') {
      const courseKey = normalizeText(subject.courseName, vc.id);
      if (seenEducation.has(courseKey)) return;
      seenEducation.add(courseKey);

      const points = parseMetricNumber(subject.points);
      if (points > 0) {
        categories.education = Math.min(categories.education + points, SCORE_CAPS.education);
      }
      return;
    }

    if (type === 'PhysicalCredential') {
      const documentKey = normalizeText(subject.documentType, vc.id);
      if (seenPhysical.has(documentKey)) return;
      seenPhysical.add(documentKey);

      categories.physical = Math.min(
        categories.physical + SCORE_WEIGHTS.PhysicalCredential,
        SCORE_CAPS.physical
      );
      return;
    }

    if (type === 'WalletCreatedCredential') {
      const chainKey = normalizeText(subject.chain, vc.id);
      if (seenWalletCreated.has(chainKey)) return;
      seenWalletCreated.add(chainKey);

      categories.finance = Math.min(
        categories.finance + SCORE_WEIGHTS.WalletCreatedCredential,
        SCORE_CAPS.finance
      );
      return;
    }

    if (type === 'WalletHistoryCredential' && !hasWalletHistory) {
      hasWalletHistory = true;
      categories.finance = Math.min(
        categories.finance + SCORE_WEIGHTS.WalletHistoryCredential,
        SCORE_CAPS.finance
      );
    }
  });

  categories.social = Math.min(Math.round(socialRaw), SCORE_CAPS.social);

  const totalScore =
    categories.social +
    categories.education +
    categories.physical +
    categories.finance;

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
