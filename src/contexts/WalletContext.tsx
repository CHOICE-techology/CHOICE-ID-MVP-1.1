import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserIdentity } from '../types';
import { loadIdentity, saveIdentity } from '../services/storageService';
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
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userIdentity, setUserIdentity] = useState<UserIdentity | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Listen for Supabase auth state changes (handles OAuth redirect)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user;
        const addr = user.email || user.id;
        setAddress(addr);

        let identity = loadIdentity();
        if (!identity || identity.address !== addr) {
          identity = {
            address: addr,
            did: generateDID(addr),
            displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
            avatar: user.user_metadata?.avatar_url,
            credentials: [],
            reputationScore: calculateReputationScore([]),
          };
          saveIdentity(identity);
        }
        setUserIdentity(identity);
        setIsConnecting(false);
      } else if (event === 'SIGNED_OUT') {
        setAddress(null);
        setUserIdentity(null);
      }
    });

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user = session.user;
        const addr = user.email || user.id;
        setAddress(addr);
        let identity = loadIdentity();
        if (!identity || identity.address !== addr) {
          identity = {
            address: addr,
            did: generateDID(addr),
            displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
            avatar: user.user_metadata?.avatar_url,
            credentials: [],
            reputationScore: calculateReputationScore([]),
          };
          saveIdentity(identity);
        }
        setUserIdentity(identity);
      } else {
        // Fallback: check localStorage for wallet-only connections
        const saved = loadIdentity();
        if (saved) {
          setAddress(saved.address);
          setUserIdentity(saved);
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
          // Persist wallet connection
          localStorage.setItem('choice_wallet_method', 'metamask');
          localStorage.setItem('choice_wallet_address', addr);
          let identity = loadIdentity();
          if (!identity || identity.address !== addr) {
            identity = {
              address: addr,
              did: generateDID(addr),
              credentials: [],
              reputationScore: calculateReputationScore([]),
            };
            saveIdentity(identity);
          }
          setUserIdentity(identity);
        }
        setIsConnecting(false);
      } else if (method === 'email') {
        // Supabase email magic link
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
        // isConnecting stays true until auth state changes or user dismisses
      } else if (method === 'google' || method === 'apple') {
        // Real OAuth via Lovable Cloud - handled in WalletModal
        // The actual call is made in the modal, this is a fallback
        setIsConnecting(false);
      } else {
        // Legacy fallback - should not be used
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
    setAddress(null);
    setUserIdentity(null);
  };

  const updateIdentity = (newIdentity: UserIdentity) => {
    const score = calculateReputationScore(newIdentity.credentials);
    const updated = { ...newIdentity, reputationScore: score };
    setUserIdentity(updated);
    saveIdentity(updated);
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
