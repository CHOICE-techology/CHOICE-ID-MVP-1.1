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

export const analyzeWalletHistory = async (address: string): Promise<BlockchainStats> => {
  const { data, error } = await supabase.functions.invoke('analyze-wallet', {
    body: { address },
  });

  if (error) {
    console.error('Edge function error:', error);
    throw new Error('Wallet analysis failed');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    txCount: data.txCount || 0,
    accountAge: data.accountAge || 'Unknown',
    totalVolume: data.totalVolume || '0',
    assetsHeld: data.assetsHeld || '0',
    netValue: data.netValue || '$0',
    activityData: data.activityData || [],
    chain: data.chain,
    activeChains: data.activeChains,
    balance: data.balance,
  };
};
