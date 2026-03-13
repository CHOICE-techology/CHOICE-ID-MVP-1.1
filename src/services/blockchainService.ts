import { supabase } from '@/integrations/supabase/client';

export interface BlockchainStats {
  txCount: number;
  accountAge: string;
  totalVolume: string;
  assetsHeld: string;
  netValue: string;
  activityData: { name: string; tx: number }[];
  chain?: string;
  activeChains?: string[];
  balance?: string;
}

/**
 * Analyze wallet history using real on-chain data via edge function.
 * Falls back to a minimal response if the edge function is unavailable.
 */
export const analyzeWalletHistory = async (address: string, chain?: string): Promise<BlockchainStats> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-wallet', {
      body: { address, chain },
    });

    if (error) throw error;

    return {
      txCount: data.txCount ?? 0,
      accountAge: data.accountAge ?? 'Unknown',
      totalVolume: data.totalVolume ?? 'N/A',
      assetsHeld: data.assetsHeld ?? 'N/A',
      netValue: data.netValue ?? 'N/A',
      activityData: data.activityData ?? [],
      chain: data.chain ?? chain ?? 'Unknown',
      activeChains: data.activeChains ?? [],
      balance: data.balance ?? '0',
    };
  } catch (err) {
    console.warn('Real-time wallet analysis failed, returning empty stats:', err);
    return {
      txCount: 0,
      accountAge: 'Unknown',
      totalVolume: 'N/A',
      assetsHeld: 'N/A',
      netValue: 'N/A',
      activityData: [{ name: 'N/A', tx: 0 }],
      chain: chain ?? 'Unknown',
      activeChains: [],
      balance: '0',
    };
  }
};
