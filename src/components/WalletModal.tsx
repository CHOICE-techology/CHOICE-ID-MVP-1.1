import React from 'react';
import { X, Wallet, ShieldCheck, Smartphone } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { connect } = useWallet();

  if (!isOpen) return null;

  const connectors = [
    { id: 'metamask', name: 'MetaMask', icon: <ShieldCheck className="text-orange-500" />, type: 'Extension' },
    { id: 'walletconnect', name: 'WalletConnect', icon: <Smartphone className="text-blue-500" />, type: 'Mobile & Desktop' },
    { id: 'injected', name: 'Browser Wallet', icon: <Wallet className="text-primary" />, type: 'Extension' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-dark/60 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-background rounded-[40px] shadow-2xl overflow-hidden animate-scale-in border border-border">
        <div className="p-8 sm:p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground mb-1">Connect Wallet</h2>
              <p className="text-sm font-medium text-muted-foreground">Select your preferred provider</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-2xl transition-all"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-3">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => {
                  connect();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-5 rounded-3xl border-2 border-muted hover:border-primary/20 hover:bg-primary/5 transition-all group active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-background shadow-sm border border-border flex items-center justify-center group-hover:scale-110 transition-transform">
                    {connector.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-black text-foreground uppercase tracking-wider text-xs">
                      {connector.name}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                      {connector.type}
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Wallet size={14} />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-muted">
            <p className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-[0.2em] leading-relaxed">
              By connecting, you agree to the <br />
              <span className="text-foreground">Terms of Service</span> and <span className="text-foreground">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
