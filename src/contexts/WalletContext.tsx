import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIdentity } from '../types';
import { loadIdentity, saveIdentity, syncIdentity, loadIdentityWithSync, clearIdentity } from '../services/storageService';
import { generateDID, calculateReputationScore } from '../services/cryptoService';
import { supabase } from '@/integrations/supabase/client';
import { grantWalletConnectReward, grantGoogleConnectReward } from '@/services/rewardService';
import { triggerRewardAnimation } from '@/components/RewardAnimation';

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
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Handle user sign-in
  const handleSignIn = useCallback(async (user: any) => {
    const addr = user.email || user.id;
    setAddress(addr);
    const identity = await resolveIdentity(addr, {
      displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
      avatar: user.user_metadata?.avatar_url,
    });
    setUserIdentity(identity);
    setIsConnecting(false);
  }, []);

  // Listen for Supabase auth state changes (handles OAuth redirect)
  useEffect(() => {
    let isMounted = true;

    // First: restore session (source of truth)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      
      if (session?.user) {
        await handleSignIn(session.user);
      } else {
        // Try persistent wallet connection
        const savedMethod = localStorage.getItem('choice_wallet_method');
        const savedAddr = localStorage.getItem('choice_wallet_address');
        if (savedMethod && savedAddr) {
          // Verify MetaMask is still connected
          if (savedMethod === 'metamask') {
            const ethereum = (window as any).ethereum;
            if (ethereum) {
              try {
                const accounts: string[] = await ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddr.toLowerCase()) {
                  setAddress(accounts[0]);
                  const identity = await resolveIdentity(accounts[0]);
                  setUserIdentity(identity);
                }
              } catch {}
            }
          } else {
            setAddress(savedAddr);
            const identity = await resolveIdentity(savedAddr);
            setUserIdentity(identity);
          }
        } else {
          const saved = loadIdentity();
          if (saved) {
            setAddress(saved.address);
            setUserIdentity(saved);
          }
        }
      }
      setIsAuthReady(true);
    });

    // Then: listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Fire and forget - don't await inside callback
        handleSignIn(session.user);
      } else if (event === 'SIGNED_OUT') {
        setAddress(null);
        setUserIdentity(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [handleSignIn]);

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

  const disconnect = useCallback(async () => {
    try {
      // Clear Supabase session
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
    } catch (err) {
      console.error('Sign out failed:', err);
    }
    
    // Always clear local state regardless of signOut result
    localStorage.removeItem('choice_wallet_method');
    localStorage.removeItem('choice_wallet_address');
    clearIdentity();
    setAddress(null);
    setUserIdentity(null);
    setAuthError(null);
  }, []);

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
