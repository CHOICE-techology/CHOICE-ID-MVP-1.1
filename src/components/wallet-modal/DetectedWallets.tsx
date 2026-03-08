import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { WalletEntry } from '@/data/walletRegistry';
import { cn } from '@/lib/utils';

interface DetectedWalletsProps {
  wallets: WalletEntry[];
  connecting: string | null;
  successSet: Set<string>;
  onConnect: (walletId: string) => void;
}

export const DetectedWallets: React.FC<DetectedWalletsProps> = ({
  wallets,
  connecting,
  successSet,
  onConnect,
}) => {
  if (wallets.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em]">
          Detected in your browser
        </span>
      </div>
      <div className="space-y-1.5">
        {wallets.map((wallet) => (
          <button
            key={wallet.id}
            onClick={() => onConnect(wallet.id)}
            disabled={connecting === wallet.id}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl border border-border",
              "bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40",
              "transition-all disabled:opacity-60"
            )}
          >
            <div className="flex items-center gap-3">
              <img src={wallet.logo} alt={wallet.name} className="w-7 h-7 object-contain rounded-md" />
              <span className="font-bold text-sm text-foreground">{wallet.name}</span>
            </div>
            {connecting === wallet.id ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : successSet.has(wallet.id) ? (
              <Check size={16} className="text-emerald-500" />
            ) : (
              <span className="text-xs font-black text-primary uppercase tracking-wider">Connect</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
