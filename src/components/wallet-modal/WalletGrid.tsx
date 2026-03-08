import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { WalletEntry } from '@/data/walletRegistry';
import { cn } from '@/lib/utils';

interface WalletGridProps {
  wallets: WalletEntry[];
  connecting: string | null;
  successSet: Set<string>;
  detectedIds: Set<string>;
  onConnect: (walletId: string) => void;
}

export const WalletGrid: React.FC<WalletGridProps> = ({
  wallets,
  connecting,
  successSet,
  detectedIds,
  onConnect,
}) => {
  if (wallets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No wallets match your search.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {wallets.map((wallet) => (
        <button
          key={wallet.id}
          onClick={() => onConnect(wallet.id)}
          disabled={!!connecting}
          className={cn(
            "flex flex-col items-center gap-2 p-3 rounded-xl border border-border",
            "hover:border-primary/30 hover:bg-muted/50 transition-all disabled:opacity-60",
            connecting === wallet.id && "border-primary/30 bg-muted/50",
            successSet.has(wallet.id) && "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20",
            detectedIds.has(wallet.id) && "ring-1 ring-emerald-400/40"
          )}
        >
          {connecting === wallet.id ? (
            <Loader2 size={24} className="animate-spin text-primary" />
          ) : successSet.has(wallet.id) ? (
            <Check size={24} className="text-emerald-500" />
          ) : (
            <img
              src={wallet.logo}
              alt={wallet.name}
              className="w-8 h-8 object-contain rounded-md"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <span className="text-[10px] font-bold text-foreground leading-tight text-center line-clamp-1">
            {wallet.name}
          </span>
        </button>
      ))}
    </div>
  );
};
