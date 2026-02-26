import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserIdentity } from '../types';
import { loadIdentity, saveIdentity } from '../services/storageService';
import { generateDID, calculateReputationScore } from '../services/cryptoService';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  userIdentity: UserIdentity | null;
  connect: () => void;
  disconnect: () => void;
  updateIdentity: (identity: UserIdentity) => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
};

// Mock wallet address
const MOCK_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38';

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userIdentity, setUserIdentity] = useState<UserIdentity | null>(null);

  useEffect(() => {
    // Check for existing connection
    const saved = loadIdentity();
    if (saved) {
      setAddress(saved.address);
      setUserIdentity(saved);
    }
  }, []);

  const connect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      const addr = MOCK_ADDRESS;
      setAddress(addr);

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
      setIsConnecting(false);
    }, 1500);
  };

  const disconnect = () => {
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
    }}>
      {children}
    </WalletContext.Provider>
  );
};
