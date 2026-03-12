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

const TRANSACTIONS_STORAGE_KEY = 'choice_reward_transactions_v1';

const readTransactions = (): ChoiceTransaction[] => {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeTransactions = (transactions: ChoiceTransaction[]) => {
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  window.dispatchEvent(new CustomEvent('choice-rewards-updated'));
};

/**
 * Grant a CHOICE coin reward with duplicate protection by (user_id + type + reason)
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
    const transactions = readTransactions();
    const duplicate = transactions.some(
      (tx) => tx.user_id === userId && tx.type === type && tx.reason === reason
    );

    if (duplicate) {
      return { success: true, duplicate: true, amount: 0 };
    }

    const transaction: ChoiceTransaction = {
      id: crypto.randomUUID(),
      user_id: userId,
      amount,
      type,
      reason,
      created_at: new Date().toISOString(),
    };

    writeTransactions([transaction, ...transactions]);
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
 * Fetch user's CHOICE coin balance
 */
export const getChoiceBalance = async (userId: string): Promise<number> => {
  const transactions = readTransactions();
  return transactions
    .filter((tx) => tx.user_id === userId)
    .reduce((sum, tx) => sum + tx.amount, 0);
};

/**
 * Fetch user's transaction history
 */
export const getTransactionHistory = async (userId: string): Promise<ChoiceTransaction[]> => {
  const transactions = readTransactions();
  return transactions
    .filter((tx) => tx.user_id === userId)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
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
