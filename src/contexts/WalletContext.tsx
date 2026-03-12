import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { UserIdentity } from '../types';
import { loadIdentityWithSync, syncIdentity, clearIdentity } from '../services/storageService';
import { generateDID, calculateReputationScore } from '../services/cryptoService';
import { grantWalletConnectReward } from '@/services/rewardService';
import { useChoiceStore } from '../store/useChoiceStore';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isLoadingIdentity: boolean;
  userIdentity: UserIdentity | null;
  connect: (method?: string, payload?: Record<string, string>) => Promise<boolean>;
  disconnect: () => void;
  updateIdentity: (identity: UserIdentity) => Promise<void>;
  authError: string | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

const noopContext: WalletContextType = {
  address: null,
  isConnected: false,
  isConnecting: false,
  isLoadingIdentity: false,
  userIdentity: null,
  connect: async () => false,
  disconnect: () => {},
  updateIdentity: async () => {},
  authError: null,
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) return noopContext;
  return ctx;
};

const createGuestIdentity = (addr: string): UserIdentity => ({
  address: addr,
  did: generateDID(addr),
  displayName: `Guest ${addr}`,
  credentials: [],
  reputationScore: calculateReputationScore([]),
});

const resolveIdentity = async (
  addr: string,
  meta?: { displayName?: string; avatar?: string }
): Promise<UserIdentity> => {
  const existing = await loadIdentityWithSync(addr);
  if (existing) return existing;

  const identity: UserIdentity = {
    ...createGuestIdentity(addr),
    avatar: meta?.avatar,
  };

  await syncIdentity(identity);
  return identity;
};

// Inner provider that uses Privy hooks (only rendered when PrivyProvider is present)
const PrivyWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { login, logout, user, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();

  const {
    userIdentity,
    isRehydrating,
    setUserIdentity,
    authError,
    rehydrate,
    setConnectionState,
  } = useChoiceStore();

  const wallet = wallets[0];
  const address = wallet?.address || user?.wallet?.address || null;

  useEffect(() => { void rehydrate(); }, [rehydrate]);

  useEffect(() => {
    const handleAuth = async () => {
      if (ready && authenticated && address) {
        const identity = await resolveIdentity(address, {
          displayName: user?.email?.address || user?.google?.email || address,
        });
        setUserIdentity(identity);
        const savedAddr = localStorage.getItem('choice_wallet_address');
        if (savedAddr !== address) {
          localStorage.setItem('choice_wallet_address', address);
          await grantWalletConnectReward(address);
        }
      } else if (ready && !authenticated) {
        setUserIdentity(null);
        localStorage.removeItem('choice_wallet_address');
      }
    };
    void handleAuth();
  }, [ready, authenticated, address, user, setUserIdentity]);

  const connect = async (): Promise<boolean> => {
    setConnectionState({ authError: null });
    try {
      login();
      return true;
    } catch (err: any) {
      setConnectionState({ authError: err.message || 'Connection failed.' });
      return false;
    }
  };

  const disconnect = useCallback(async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout failed, clearing local identity anyway', err);
    }

    await clearIdentity();
    setUserIdentity(null);
    setConnectionState({ authError: null });
    localStorage.removeItem('choice_wallet_address');
  }, [logout, setUserIdentity, setConnectionState]);

  const updateIdentity = async (newIdentity: UserIdentity) => {
    const score = calculateReputationScore(newIdentity.credentials);
    setUserIdentity({ ...newIdentity, reputationScore: score });
  };

  const value = useMemo(() => ({
    address,
    isConnected: authenticated && !!address,
    isConnecting: !ready,
    isLoadingIdentity: isRehydrating || (authenticated && !!address && !userIdentity),
    userIdentity,
    connect,
    disconnect,
    updateIdentity,
    authError,
  }), [address, authenticated, ready, isRehydrating, userIdentity, authError, disconnect]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

// Fallback provider when Privy is not configured
const FallbackWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userIdentity, isRehydrating, setUserIdentity, authError, rehydrate } = useChoiceStore();

  useEffect(() => { void rehydrate(); }, [rehydrate]);

  const value = useMemo(() => ({
    address: userIdentity?.address || null,
    isConnected: !!userIdentity,
    isConnecting: false,
    isLoadingIdentity: isRehydrating,
    userIdentity,
    connect: async () => { console.warn('Privy not configured'); return false; },
    disconnect: () => { setUserIdentity(null); },
    updateIdentity: async (i: UserIdentity) => { setUserIdentity(i); },
    authError,
  }), [userIdentity, isRehydrating, authError, setUserIdentity]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

// Export the right provider based on whether Privy is available
const hasPrivy = !!import.meta.env.VITE_PRIVY_APP_ID;

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (hasPrivy) return <PrivyWalletProvider>{children}</PrivyWalletProvider>;
  return <FallbackWalletProvider>{children}</FallbackWalletProvider>;
};
