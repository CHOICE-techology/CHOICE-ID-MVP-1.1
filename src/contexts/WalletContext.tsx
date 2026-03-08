import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserIdentity } from '../types';
import { loadIdentity, saveIdentity, syncIdentity, loadIdentityWithSync } from '../services/storageService';
import { generateDID, calculateReputationScore } from '../services/cryptoService';
import { supabase } from '@/integrations/supabase/client';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  userIdentity: UserIdentity | null;
  connect: (method?: string, payload?: Record<string, string>) => Promise<void>;
  disconnect: () => void;
  updateIdentity: (identity: UserIdentity) => void;
  authError: string | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    console.warn('useWallet called outside WalletProvider — returning defaults');
    return {
      address: null,
      isConnected: false,
      isConnecting: false,
      userIdentity: null,
      connect: async () => {},
      disconnect: () => {},
      updateIdentity: () => {},
      authError: null,
    } as WalletContextType;
  }
  return ctx;
};

/**
 * Helper: given an address, load identity from DB (source of truth) then fallback to localStorage.
 * If nothing exists, creates a new identity and persists it.
 */
const resolveIdentity = async (
  addr: string,
  meta?: { displayName?: string; avatar?: string }
): Promise<UserIdentity> => {
  // Try DB first, then localStorage
  const existing = await loadIdentityWithSync(addr);
  if (existing) return existing;

  // Create fresh identity
  const identity: UserIdentity = {
    address: addr,
    did: generateDID(addr),
    displayName: meta?.displayName,
    avatar: meta?.avatar,
    credentials: [],
    reputationScore: calculateReputationScore([]),
  };
  await syncIdentity(identity);
  return identity;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userIdentity, setUserIdentity] = useState<UserIdentity | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Listen for Supabase auth state changes (handles OAuth redirect)
  useEffect(() => {
    // Auto-reconnect persistent wallet (MetaMask)
    const savedMethod = localStorage.getItem('choice_wallet_method');
    const savedAddr = localStorage.getItem('choice_wallet_address');
    if (savedMethod === 'metamask' && savedAddr) {
      const ethereum = (window as any).ethereum;
      if (ethereum) {
        ethereum.request({ method: 'eth_accounts' }).then(async (accounts: string[]) => {
          if (accounts.length > 0) {
            const addr = accounts[0];
            setAddress(addr);
            const identity = await resolveIdentity(addr);
            setUserIdentity(identity);
          }
        }).catch(() => {});
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user;
        const addr = user.email || user.id;
        setAddress(addr);
        const identity = await resolveIdentity(addr, {
          displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
          avatar: user.user_metadata?.avatar_url,
        });
        setUserIdentity(identity);
        setIsConnecting(false);
      } else if (event === 'SIGNED_OUT') {
        setAddress(null);
        setUserIdentity(null);
      }
    });

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const user = session.user;
        const addr = user.email || user.id;
        setAddress(addr);
        const identity = await resolveIdentity(addr, {
          displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
          avatar: user.user_metadata?.avatar_url,
        });
        setUserIdentity(identity);
      } else {
        // Restore persistent wallet connection from localStorage
        const savedMethod = localStorage.getItem('choice_wallet_method');
        const savedAddr = localStorage.getItem('choice_wallet_address');
        if (savedMethod && savedAddr) {
          setAddress(savedAddr);
          const identity = await resolveIdentity(savedAddr);
          setUserIdentity(identity);
        } else {
          const saved = loadIdentity();
          if (saved) {
            setAddress(saved.address);
            setUserIdentity(saved);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const connect = async (method?: string, payload?: Record<string, string>) => {
    setIsConnecting(true);
    setAuthError(null);

    try {
      if (method === 'metamask' || method === 'wallet') {
        const ethereum = (window as any).ethereum;
        if (!ethereum) {
          setAuthError('No wallet extension detected. Please install MetaMask.');
          setIsConnecting(false);
          return;
        }
        const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          const addr = accounts[0];
          setAddress(addr);
          localStorage.setItem('choice_wallet_method', 'metamask');
          localStorage.setItem('choice_wallet_address', addr);
          const identity = await resolveIdentity(addr);
          setUserIdentity(identity);
        }
        setIsConnecting(false);
      } else if (method === 'email') {
        const email = payload?.email;
        if (!email) {
          setAuthError('Please enter an email address.');
          setIsConnecting(false);
          return;
        }
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) {
          setAuthError(error.message);
          setIsConnecting(false);
        }
      } else if (method === 'google' || method === 'apple') {
        setIsConnecting(false);
      } else {
        setAuthError('Please select a connection method.');
        setIsConnecting(false);
      }
    } catch (err: any) {
      console.error('Connection failed:', err);
      setAuthError(err.message || 'Connection failed. Please try again.');
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('choice_wallet_method');
    localStorage.removeItem('choice_wallet_address');
    // Note: we do NOT clear localStorage identity or DB data — it persists for reconnect
    setAddress(null);
    setUserIdentity(null);
  };

  const updateIdentity = (newIdentity: UserIdentity) => {
    const score = calculateReputationScore(newIdentity.credentials);
    const updated = { ...newIdentity, reputationScore: score };
    setUserIdentity(updated);
    // Sync to both localStorage and database
    syncIdentity(updated);
  };

  return (
    <WalletContext.Provider value={{
      address,
      isConnected: !!address,
      isConnecting,
      userIdentity,
      connect,
      disconnect,
      updateIdentity,
      authError,
    }}>
      {children}
    </WalletContext.Provider>
  );
};
