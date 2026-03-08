import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Shield } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { addCredential } from '@/services/storageService';
import { mockConnectSocial, mockUploadToIPFS } from '@/services/cryptoService';
import { VerifiableCredential } from '@/types';
import { lovable } from '@/integrations/lovable/index';
import { walletRegistry, getDetectedWallets, WalletEntry } from '@/data/walletRegistry';
import { WalletSearchBar } from '@/components/wallet-modal/WalletSearchBar';
import { DetectedWallets } from '@/components/wallet-modal/DetectedWallets';
import { WalletGrid } from '@/components/wallet-modal/WalletGrid';
import { SocialSignIn } from '@/components/wallet-modal/SocialSignIn';
import { EmailSignIn } from '@/components/wallet-modal/EmailSignIn';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/social-auth`;

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { connect, authError, userIdentity, updateIdentity } = useWallet();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [successSet, setSuccessSet] = useState<Set<string>>(new Set());
  const [localError, setLocalError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [detectedIds, setDetectedIds] = useState<Set<string>>(new Set());

  // Detect browser wallets on mount
  useEffect(() => {
    if (isOpen) {
      setDetectedIds(getDetectedWallets());
    }
  }, [isOpen]);

  // Listen for AUTH_SUCCESS from popup windows
  const handleMessage = useCallback(async (event: MessageEvent) => {
    if (event.data?.type !== 'AUTH_SUCCESS') return;
    const { platform, handle, displayName } = event.data;
    if (!platform || !userIdentity) return;

    try {
      const result = await mockConnectSocial(displayName || platform, handle || `${platform}_user`);
      const socialVC: VerifiableCredential = {
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential', 'SocialCredential'],
        issuer: `did:web:${platform.toLowerCase()}.com`,
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: userIdentity.did, ...result },
      };
      await mockUploadToIPFS(socialVC);
      const newIdentity = addCredential(userIdentity, socialVC);
      updateIdentity(newIdentity);
      setSuccessSet(prev => new Set(prev).add(platform.toLowerCase()));
      setConnecting(null);
    } catch (err) {
      console.error('Social credential creation failed:', err);
      setLocalError(`Failed to create credential for ${platform}`);
      setConnecting(null);
    }
  }, [userIdentity, updateIdentity]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Filtered wallets for search
  const detectedWallets = useMemo(
    () => walletRegistry.filter(w => detectedIds.has(w.id)),
    [detectedIds]
  );

  const filteredWallets = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = q
      ? walletRegistry.filter(w => w.name.toLowerCase().includes(q))
      : walletRegistry;
    return list;
  }, [search, detectedIds]);

  if (!isOpen) return null;

  const openSocialPopup = (platformId: string) => {
    setConnecting(platformId);
    setLocalError(null);
    const url = `${EDGE_FN_URL}?platform=${encodeURIComponent(platformId)}&origin=${encodeURIComponent(window.location.origin)}`;
    const popup = window.open(url, 'choiceid_auth', 'width=500,height=650,left=200,top=100');
    const timer = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(timer);
        setConnecting(prev => prev === platformId ? null : prev);
      }
    }, 500);
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setConnecting(provider);
    setLocalError(null);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setLocalError(result.error.message || `${provider} sign-in failed`);
        setConnecting(null);
      }
    } catch (err: any) {
      setLocalError(err.message || `${provider} connection failed`);
      setConnecting(null);
    }
  };

  const handleSocialConnect = (providerId: string) => {
    if (providerId === 'google' || providerId === 'apple') {
      handleOAuth(providerId);
    } else {
      openSocialPopup(providerId);
    }
  };

  const handleWalletConnect = async (walletId: string) => {
    setConnecting(walletId);
    setLocalError(null);

    // MetaMask / EVM extension connect
    if (walletId === 'metamask' || detectedIds.has(walletId)) {
      const ethereum = (window as any).ethereum;
      if (ethereum) {
        try {
          await connect('metamask');
          setSuccessSet(prev => new Set(prev).add(walletId));
          setConnecting(null);
          setTimeout(() => onClose(), 800);
          return;
        } catch (err: any) {
          setLocalError(err.message || 'Wallet connection failed');
          setConnecting(null);
          return;
        }
      }
    }

    // Phantom / Solana
    if (walletId === 'phantom') {
      const phantom = (window as any).phantom?.solana || (window as any).solana;
      if (phantom?.isPhantom) {
        try {
          const resp = await phantom.connect();
          const addr = resp.publicKey.toString();
          await connect('wallet', { address: addr } as any);
          setSuccessSet(prev => new Set(prev).add(walletId));
          setConnecting(null);
          setTimeout(() => onClose(), 800);
          return;
        } catch {
          setLocalError('Phantom connection rejected');
          setConnecting(null);
          return;
        }
      }
    }

    setLocalError(`${walletRegistry.find(w => w.id === walletId)?.name || walletId} — install the extension or use WalletConnect.`);
    setConnecting(null);
  };

  const handleEmailConnect = async (email: string) => {
    setConnecting('email');
    setLocalError(null);
    await connect('email', { email });
    setConnecting(null);
  };

  const error = localError || authError;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header — fixed */}
        <div className="p-6 pb-0 sm:px-8 sm:pt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield size={18} className="text-primary" />
              </div>
              <span className="text-lg font-black tracking-tight">
                CHOICE<span className="text-primary">iD</span>
              </span>
            </div>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 sm:px-8 sm:pb-8">
          {/* Detected browser wallets */}
          <DetectedWallets
            wallets={detectedWallets}
            connecting={connecting}
            successSet={successSet}
            onConnect={handleWalletConnect}
          />

          {/* Social sign-in */}
          <SocialSignIn
            connecting={connecting}
            successSet={successSet}
            onConnect={handleSocialConnect}
          />

          {/* Email */}
          <EmailSignIn connecting={connecting} onConnect={handleEmailConnect} />

          {/* Wallet search + grid */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
                Connect CHOICE ID
              </span>
              {!search && (
                <span className="text-[9px] text-muted-foreground">
                  Search for 50+ wallets
                </span>
              )}
            </div>
            <div className="mt-2">
              <WalletSearchBar value={search} onChange={setSearch} />
              <WalletGrid
                wallets={filteredWallets}
                connecting={connecting}
                successSet={successSet}
                detectedIds={detectedIds}
                onConnect={handleWalletConnect}
                isSearching={!!search.trim()}
              />
            </div>
          </div>

          {/* Footer */}
          <p className="text-[10px] font-medium text-muted-foreground text-center leading-relaxed pt-2">
            By connecting, you agree to the{' '}
            <span className="text-foreground font-bold">Terms of Service</span> and{' '}
            <span className="text-foreground font-bold">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
