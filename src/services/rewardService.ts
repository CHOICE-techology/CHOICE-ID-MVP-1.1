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

const TRANSACTIONS_STORAGE_KEY = 'choice_reward_transactions_v1';

const dispatchRewardsUpdated = () => {
  window.dispatchEvent(new CustomEvent('choice-rewards-updated'));
};

const readLocalTransactions = (): ChoiceTransaction[] => {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalTransactions = (
  transactions: ChoiceTransaction[],
  emitEvent = false
) => {
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  if (emitEvent) dispatchRewardsUpdated();
};

const txDedupeKey = (tx: Pick<ChoiceTransaction, 'user_id' | 'type' | 'reason'>) =>
  `${tx.user_id}::${tx.type}::${tx.reason}`;

const sortByNewest = (items: ChoiceTransaction[]) =>
  [...items].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

const mergeByUserTypeReason = (base: ChoiceTransaction[], extra: ChoiceTransaction[]) => {
  const map = new Map<string, ChoiceTransaction>();

  [...base, ...extra].forEach((tx) => {
    const key = txDedupeKey(tx);
    if (!map.has(key)) {
      map.set(key, tx);
    }
  });

  return sortByNewest(Array.from(map.values()));
};

const syncLocalUserTransactions = (userId: string, remoteRows: ChoiceTransaction[]) => {
  const local = readLocalTransactions();
  const localOtherUsers = local.filter((tx) => tx.user_id !== userId);
  const localUserRows = local.filter((tx) => tx.user_id === userId);
  const mergedUserRows = mergeByUserTypeReason(remoteRows, localUserRows);
  writeLocalTransactions([...mergedUserRows, ...localOtherUsers]);
  return mergedUserRows;
};

const fetchRemoteTransactions = async (userId: string): Promise<ChoiceTransaction[]> => {
  const { data, error } = await supabase
    .from('choice_transactions')
    .select('id, user_id, amount, type, reason, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((tx) => ({
    ...tx,
    amount: Number(tx.amount),
  }));
};

const getTransactionsForUser = async (userId: string): Promise<ChoiceTransaction[]> => {
  if (!userId) return [];

  try {
    const remoteRows = await fetchRemoteTransactions(userId);
    return syncLocalUserTransactions(userId, remoteRows);
  } catch {
    return sortByNewest(readLocalTransactions().filter((tx) => tx.user_id === userId));
  }
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
    // Backend-first idempotency
    const { data: duplicateRows, error: duplicateError } = await supabase
      .from('choice_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('reason', reason)
      .limit(1);

    if (duplicateError) throw duplicateError;

    if ((duplicateRows ?? []).length > 0) {
      return { success: true, duplicate: true, amount: 0 };
    }

    const { data: insertedRows, error: insertError } = await supabase
      .from('choice_transactions')
      .insert({ user_id: userId, type, reason, amount })
      .select('id, user_id, amount, type, reason, created_at')
      .limit(1);

    if (insertError) throw insertError;

    const inserted = insertedRows?.[0];
    if (!inserted) {
      return { success: false, error: 'Reward insert returned no data.' };
    }

    const tx: ChoiceTransaction = {
      ...inserted,
      amount: Number(inserted.amount),
    };

    const local = readLocalTransactions();
    const localWithoutUser = local.filter((item) => item.user_id !== userId);
    const localUser = local.filter((item) => item.user_id === userId);
    const mergedUser = mergeByUserTypeReason([tx, ...localUser], []);
    writeLocalTransactions([...mergedUser, ...localWithoutUser], true);

    return { success: true, amount };
  } catch (error: any) {
    // Local fallback
    try {
      const transactions = readLocalTransactions();
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

      writeLocalTransactions([transaction, ...transactions], true);
      return { success: true, amount };
    } catch (fallbackError: any) {
      return {
        success: false,
        error: fallbackError?.message || error?.message || 'Failed to grant reward.',
      };
    }
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
  grantReward(
    userId,
    'wallet_analysis_reward',
    `analysis_${walletAddress.toLowerCase().slice(0, 20)}`,
    30
  );

export const grantEducationReward = (userId: string, courseId: string) =>
  grantReward(userId, 'education_reward', `course_${courseId}`, 40);

export const grantReferralReward = (userId: string, referredUserId: string) =>
  grantReward(userId, 'referral_reward', `referral_${referredUserId}`, 25);

/**
 * Fetch user's CHOICE coin balance
 */
export const getChoiceBalance = async (userId: string): Promise<number> => {
  const transactions = await getTransactionsForUser(userId);
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
};

/**
 * Fetch user's transaction history
 */
export const getTransactionHistory = async (userId: string): Promise<ChoiceTransaction[]> => {
  return getTransactionsForUser(userId);
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
export const getRewardCategory = (
  type: string
): 'identity' | 'education' | 'community' | 'finance' => {
  if (type.includes('identity') || type.includes('social')) return 'identity';
  if (type.includes('education')) return 'education';
  if (type.includes('referral') || type.includes('bounty')) return 'community';
  return 'finance';
};
