import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  createProfile: () => Promise<boolean>;
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
  createProfile: async () => false,
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
    displayName: meta?.displayName || `Guest ${addr}`,
    avatar: meta?.avatar,
  };

  await syncIdentity(identity);
  return identity;
};

const PrivyWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { login, logout, user, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const [pendingConnect, setPendingConnect] = useState(false);
  const [forceDisconnected, setForceDisconnected] = useState(false);
  const connectTimeoutRef = useRef<number | null>(null);

  const {
    userIdentity,
    setUserIdentity,
    authError,
    rehydrate,
    setConnectionState,
  } = useChoiceStore();

  const rawAddress = wallets[0]?.address || user?.wallet?.address || null;
  const address = forceDisconnected || !ready || !authenticated ? null : rawAddress;
  const displayNameHint = user?.email?.address || user?.google?.email;

  const clearConnectTimeout = useCallback(() => {
    if (connectTimeoutRef.current) {
      window.clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    void rehydrate();
  }, [rehydrate]);

  useEffect(() => {
    const syncSession = async () => {
      if (!ready) {
        clearConnectTimeout();
        setPendingConnect(false);
        setUserIdentity(null);
        setConnectionState({
          address: null,
          isConnected: false,
          isConnecting: false,
          authError: null,
        });
        return;
      }

      if (!authenticated || forceDisconnected) {
        clearConnectTimeout();
        setPendingConnect(false);
        setUserIdentity(null);
        setConnectionState({
          address: null,
          isConnected: false,
          isConnecting: false,
          authError: null,
        });
        localStorage.removeItem('choice_wallet_address');
        return;
      }

      if (!rawAddress) {
        clearConnectTimeout();
        setPendingConnect(false);
        setConnectionState({
          address: null,
          isConnected: false,
          isConnecting: false,
          authError: 'No wallet address detected. Please reconnect.',
        });
        return;
      }

      try {
        const identity = await resolveIdentity(rawAddress, {
          displayName: displayNameHint || `Guest ${rawAddress}`,
        });
        setUserIdentity(identity);
        setConnectionState({
          address: rawAddress,
          isConnected: true,
          isConnecting: false,
          authError: null,
        });

        const savedAddr = localStorage.getItem('choice_wallet_address');
        if (savedAddr !== rawAddress) {
          localStorage.setItem('choice_wallet_address', rawAddress);
          await grantWalletConnectReward(rawAddress);
        }
      } catch (err) {
        console.warn('Session sync failed', err);
        setConnectionState({
          address: rawAddress,
          isConnected: false,
          isConnecting: false,
          authError: 'Failed to load your profile. Please try Create Profile.',
        });
      } finally {
        clearConnectTimeout();
        setPendingConnect(false);
      }
    };

    void syncSession();
  }, [ready, authenticated, rawAddress, forceDisconnected, displayNameHint, setUserIdentity, setConnectionState, clearConnectTimeout]);

  const connect = async (method?: string, _payload?: Record<string, string>): Promise<boolean> => {
    setForceDisconnected(false);
    setConnectionState({
      authError: null,
      isConnecting: true,
      isConnected: false,
    });
    setPendingConnect(true);

    const normalizedMethod = (method || '').toLowerCase();
    const socialMethodMap: Record<string, string> = {
      google: 'google',
      x: 'twitter',
      twitter: 'twitter',
      discord: 'discord',
      github: 'github',
      apple: 'apple',
      email: 'email',
    };

    try {
      if (normalizedMethod && socialMethodMap[normalizedMethod]) {
        await Promise.resolve(login({ loginMethods: [socialMethodMap[normalizedMethod]] } as any));
      } else if (normalizedMethod) {
        await Promise.resolve(login({ loginMethods: ['wallet'] } as any));
      } else {
        await Promise.resolve(login());
      }
      return true;
    } catch (err: any) {
      setPendingConnect(false);
      setConnectionState({
        authError: err?.message || 'Connection failed.',
        isConnecting: false,
        isConnected: false,
      });
      return false;
    }
  };

  const disconnect = useCallback(async () => {
    setForceDisconnected(true);
    setPendingConnect(false);

    try {
      await logout();
    } catch (err) {
      console.warn('Logout failed, clearing local identity anyway', err);
    }

    await clearIdentity();
    setUserIdentity(null);
    setConnectionState({
      authError: null,
      address: null,
      isConnected: false,
      isConnecting: false,
      userIdentity: null,
    });
    localStorage.removeItem('choice_wallet_address');
    localStorage.removeItem('choice_last_verification');
    localStorage.removeItem('choice_job_applications_v1');
    localStorage.removeItem('choice_claimed_bounties');
  }, [logout, setUserIdentity, setConnectionState]);

  const createProfile = useCallback(async (): Promise<boolean> => {
    if (!address || !authenticated) {
      setConnectionState({ authError: 'No wallet detected. Please connect first.' });
      return false;
    }

    try {
      const identity = await resolveIdentity(address, {
        displayName: user?.email?.address || user?.google?.email || `Guest ${address}`,
      });
      setUserIdentity(identity);
      setConnectionState({ authError: null, address, isConnected: true, isConnecting: false });
      setForceDisconnected(false);
      return true;
    } catch (err) {
      console.warn('Profile creation failed', err);
      setConnectionState({ authError: 'Failed to create profile. Please try again.' });
      return false;
    }
  }, [address, user, setUserIdentity, setConnectionState]);

  const updateIdentity = async (newIdentity: UserIdentity) => {
    const score = calculateReputationScore(newIdentity.credentials);
    setUserIdentity({ ...newIdentity, reputationScore: score });
  };

  const value = useMemo(() => ({
    address,
    isConnected: ready && authenticated && !!address,
    isConnecting: pendingConnect && !authenticated,
    isLoadingIdentity: !ready || (pendingConnect && !address),
    userIdentity,
    connect,
    disconnect,
    createProfile,
    updateIdentity,
    authError,
  }), [address, ready, authenticated, userIdentity, pendingConnect, authError, disconnect, createProfile]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

const FallbackWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userIdentity, isRehydrating, setUserIdentity, authError, rehydrate, setConnectionState } = useChoiceStore();

  useEffect(() => {
    void rehydrate();
  }, [rehydrate]);

  const createProfile = useCallback(async () => {
    if (!userIdentity?.address) {
      setConnectionState({ authError: 'No wallet detected. Please connect first.' });
      return false;
    }
    return true;
  }, [userIdentity?.address, setConnectionState]);

  const value = useMemo(() => ({
    address: userIdentity?.address || null,
    isConnected: !!userIdentity,
    isConnecting: false,
    isLoadingIdentity: isRehydrating,
    userIdentity,
    connect: async () => {
      console.warn('Privy not configured');
      return false;
    },
    disconnect: () => {
      void clearIdentity();
      setUserIdentity(null);
      localStorage.removeItem('choice_wallet_address');
    },
    createProfile,
    updateIdentity: async (i: UserIdentity) => {
      setUserIdentity(i);
    },
    authError,
  }), [userIdentity, isRehydrating, authError, setUserIdentity, createProfile]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

const rawPrivyAppId = import.meta.env.VITE_PRIVY_APP_ID;
const sanitizedPrivyAppId = typeof rawPrivyAppId === 'string' ? rawPrivyAppId.trim() : '';
const hasPrivy = Boolean(sanitizedPrivyAppId) && ![
  'undefined',
  'null',
  'your-privy-app-id',
  'changeme',
].includes(sanitizedPrivyAppId.toLowerCase());

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (hasPrivy) return <PrivyWalletProvider>{children}</PrivyWalletProvider>;
  return <FallbackWalletProvider>{children}</FallbackWalletProvider>;
};
