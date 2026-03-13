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

/**
 * Grant a CHOICE coin reward with duplicate protection by (user_id + type + reason).
 * Writes to Supabase choice_transactions table and increments user_profiles balance.
 */
export const grantReward = async (
  userId: string,
  type: string,
  reason: string,
  amount: number
): Promise<RewardResult> => {
  if (!userId || !type || !reason || !Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: 'Invalid reward payload.' };
  }

  try {
    // Check for duplicates in Supabase
    const { data: existing } = await supabase
      .from('choice_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('reason', reason)
      .limit(1);

    if (existing && existing.length > 0) {
      return { success: true, duplicate: true, amount: 0 };
    }

    // Insert transaction
    const { error: insertError } = await supabase
      .from('choice_transactions')
      .insert({ user_id: userId, type, reason, amount });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Increment balance on user_profiles
    try {
      await supabase.rpc('increment_choice_balance', {
        p_wallet_address: userId,
        p_amount: amount,
      });
    } catch (e) {
      console.warn('Balance increment RPC failed:', e);
    }

    window.dispatchEvent(new CustomEvent('choice-rewards-updated'));
    return { success: true, amount };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to grant reward.' };
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
 * Fetch user's CHOICE coin balance from Supabase
 */
export const getChoiceBalance = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('choice_transactions')
    .select('amount')
    .eq('user_id', userId);

  if (error || !data) return 0;
  return data.reduce((sum, tx) => sum + tx.amount, 0);
};

/**
 * Fetch user's transaction history from Supabase
 */
export const getTransactionHistory = async (userId: string): Promise<ChoiceTransaction[]> => {
  const { data, error } = await supabase
    .from('choice_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as ChoiceTransaction[];
};

/**
 * Get human-readable label for a reward type
 */
/**
 * Map bounty reason → display title (must match BountyBoardPage task titles)
 */
const BOUNTY_LABELS: Record<string, string> = {
  bounty_verify_professional: 'Verify Professional Identity',
  bounty_education_3: 'Complete 3 Education Modules',
  bounty_multichain: 'Multi-Chain Wallet Verification',
  bounty_invite_3: 'Invite 3 Friends',
  bounty_bug_report: 'Submit a Bug Report',
  bounty_beta_test: 'Beta Feature Testing',
  bounty_global_identity: 'Achieve Global Identity',
  bounty_community_contrib: 'Community Contribution',
};

/**
 * Map bounty reason → category (must match BountyBoardPage task categories)
 */
const BOUNTY_CATEGORIES: Record<string, 'identity' | 'education' | 'community' | 'finance'> = {
  bounty_verify_professional: 'identity',
  bounty_education_3: 'education',
  bounty_multichain: 'identity',
  bounty_invite_3: 'community',
  bounty_bug_report: 'community',
  bounty_beta_test: 'community',
  bounty_global_identity: 'identity',
  bounty_community_contrib: 'community',
};

export const getRewardLabel = (type: string, reason?: string): string => {
  if (type === 'bounty_reward' && reason && BOUNTY_LABELS[reason]) {
    return BOUNTY_LABELS[reason];
  }
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
