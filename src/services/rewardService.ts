import { supabase } from '@/integrations/supabase/client';

export interface ChoiceTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  reason: string;
  created_at: string;
}

export interface RewardResult {
  success: boolean;
  amount?: number;
  duplicate?: boolean;
  error?: string;
}

const REWARD_CONFIG = {
  identity_reward: { amount: 100, reason: 'wallet_connect' },
  google_connect: { amount: 100, reason: 'google_connect' },
  social_connect: { amount: 100, reason: 'social_connect' },
  wallet_analysis_reward: { amount: 30, reason: 'wallet_analysis' },
  education_reward: { amount: 40, reason: 'course_complete' },
  referral_reward: { amount: 25, reason: 'referral' },
} as const;

/**
 * Grant a CHOICE coin reward. Prevents duplicates via unique constraint.
 */
export const grantReward = async (
  userId: string,
  type: string,
  reason: string,
  amount: number
): Promise<RewardResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('grant-reward', {
      body: { user_id: userId, amount, type, reason },
    });

    if (error) {
      console.error('Grant reward error:', error);
      return { success: false, error: error.message };
    }

    if (data?.duplicate) {
      return { success: false, duplicate: true };
    }

    if (data?.error) {
      return { success: false, error: data.error, duplicate: data.duplicate };
    }

    return { success: true, amount: data?.amount ?? amount };
  } catch (e: any) {
    console.error('Grant reward failed:', e);
    return { success: false, error: e.message };
  }
};

/**
 * Convenience methods for specific reward types
 */
export const grantWalletConnectReward = (userId: string) =>
  grantReward(userId, 'identity_reward', 'wallet_connect', 100);

export const grantGoogleConnectReward = (userId: string) =>
  grantReward(userId, 'identity_reward', 'google_connect', 100);

export const grantSocialConnectReward = (userId: string, platform: string) =>
  grantReward(userId, 'social_connect_reward', `social_${platform.toLowerCase()}`, 100);

export const grantWalletAnalysisReward = (userId: string, walletAddress: string) =>
  grantReward(userId, 'wallet_analysis_reward', `analysis_${walletAddress.toLowerCase().slice(0, 20)}`, 30);

export const grantEducationReward = (userId: string, courseId: string) =>
  grantReward(userId, 'education_reward', `course_${courseId}`, 40);

export const grantReferralReward = (userId: string, referredUserId: string) =>
  grantReward(userId, 'referral_reward', `referral_${referredUserId}`, 25);

/**
 * Fetch user's CHOICE coin balance
 */
export const getChoiceBalance = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('choice_balance')
      .eq('wallet_address', userId)
      .maybeSingle();

    if (error || !data) return 0;
    return (data as any).choice_balance ?? 0;
  } catch {
    return 0;
  }
};

/**
 * Fetch user's transaction history
 */
export const getTransactionHistory = async (userId: string): Promise<ChoiceTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('choice_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Fetch transactions error:', error);
      return [];
    }
    return (data as any[]) ?? [];
  } catch {
    return [];
  }
};

/**
 * Get human-readable label for a reward type
 */
export const getRewardLabel = (type: string): string => {
  const labels: Record<string, string> = {
    identity_reward: 'Identity Connection',
    social_connect_reward: 'Social Profile',
    wallet_analysis_reward: 'Wallet Analysis',
    education_reward: 'Course Completion',
    referral_reward: 'Friend Referral',
    bounty_reward: 'Bounty Task',
  };
  return labels[type] || type;
};

/**
 * Get icon category for a reward type
 */
export const getRewardCategory = (type: string): 'identity' | 'education' | 'community' | 'finance' => {
  if (type.includes('identity') || type.includes('social')) return 'identity';
  if (type.includes('education')) return 'education';
  if (type.includes('referral') || type.includes('bounty')) return 'community';
  return 'finance';
};
