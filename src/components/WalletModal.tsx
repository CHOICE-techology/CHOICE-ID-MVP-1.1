import React, { useState } from 'react';
import { X, Mail, Wallet, Globe, Shield } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { connect } = useWallet();
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleConnect = () => {
    connect();
    onClose();
  };

  const socialProviders = [
    { id: 'google', name: 'Google', icon: '🔵', color: 'hover:border-blue-400' },
    { id: 'x', name: 'X', icon: '✕', color: 'hover:border-foreground', isText: true },
    { id: 'apple', name: 'Apple', icon: '🍎', color: 'hover:border-foreground' },
    { id: 'discord', name: 'Discord', icon: '💬', color: 'hover:border-indigo-400' },
  ];

  const wallets = [
    { id: 'metamask', name: 'MetaMask', emoji: '🦊' },
    { id: 'trust', name: 'Trust Wallet', emoji: '🔵' },
    { id: 'rainbow', name: 'Rainbow', emoji: '🌈' },
    { id: 'coinbase', name: 'Coinbase', emoji: '💎' },
    { id: 'walletconnect', name: 'WalletConnect', emoji: '🔗' },
    { id: 'phantom', name: 'Phantom', emoji: '👻' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield size={18} className="text-primary" />
              </div>
              <span className="text-lg font-black tracking-tight">
                CHOICE<span className="text-primary">iD</span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Detected Browser Wallet */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em]">
                Detected in your browser
              </span>
            </div>
            <button
              onClick={handleConnect}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all"
            >
              <span className="font-bold text-sm text-foreground">MetaMask</span>
              <span className="text-xs font-black text-primary uppercase tracking-wider">Connect</span>
            </button>
          </div>

          {/* Social Sign In */}
          <div className="mb-6">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
              Sign in with
            </span>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {socialProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={handleConnect}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all text-sm font-bold text-foreground"
                >
                  {provider.isText ? (
                    <span className="text-base font-black">✕</span>
                  ) : (
                    <span className="text-base">{provider.icon}</span>
                  )}
                  {provider.name}
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div className="mb-6">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
              Or continue with email
            </span>
            <div className="flex gap-2 mt-3">
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-muted/30">
                <Mail size={16} className="text-muted-foreground shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
              <button
                onClick={handleConnect}
                className="px-5 py-3 rounded-xl bg-foreground text-background text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity shrink-0"
              >
                Continue
              </button>
            </div>
          </div>

          {/* Connect a Wallet */}
          <div className="mb-6">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
              Connect a wallet
            </span>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {wallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={handleConnect}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all"
                >
                  <span className="text-2xl">{wallet.emoji}</span>
                  <span className="text-[10px] font-bold text-foreground leading-tight text-center">
                    {wallet.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-[10px] font-medium text-muted-foreground text-center leading-relaxed">
            By connecting, you agree to the{' '}
            <span className="text-foreground font-bold">Terms of Service</span> and{' '}
            <span className="text-foreground font-bold">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
