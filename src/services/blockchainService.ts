import { supabase } from '@/integrations/supabase/client';

export interface DetectedProtocol {
  name: string;
  chain?: string;
  logo: string;
}

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
  chainDetails?: Record<string, { txCount: number; balance: number }>;
  protocols?: DetectedProtocol[];
}

export const analyzeWalletHistory = async (address: string): Promise<BlockchainStats> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-wallet', {
      body: { address },
    });

    if (error) throw error;
    if (!data || typeof data !== 'object') throw new Error('Invalid response');

    return {
      txCount: data.txCount ?? 0,
      accountAge: data.accountAge ?? 'Unknown',
      totalVolume: data.totalVolume ?? '0 ETH',
      assetsHeld: data.assetsHeld ?? '0 chains',
      netValue: data.netValue ?? '$0',
      activityData: data.activityData ?? [],
      chain: data.chain ?? 'Multi-chain',
      activeChains: data.activeChains ?? [],
      balance: data.balance ?? '0 ETH',
      chainDetails: data.chainDetails,
      protocols: data.protocols ?? [],
    };
  } catch (e) {
    console.warn('Edge function wallet analysis failed, using fallback:', e);
    // Fallback: return empty stats rather than mock data
    return {
      txCount: 0,
      accountAge: 'Unable to fetch',
      totalVolume: '—',
      assetsHeld: '—',
      netValue: '—',
      activityData: [
        { name: 'Jan', tx: 0 }, { name: 'Feb', tx: 0 }, { name: 'Mar', tx: 0 },
        { name: 'Apr', tx: 0 }, { name: 'May', tx: 0 }, { name: 'Jun', tx: 0 },
      ],
      chain: 'Unknown',
      activeChains: [],
      balance: '—',
    };
  }
};
