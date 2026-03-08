import React from 'react';
import { Check, Loader2, Star } from 'lucide-react';
import { WalletEntry } from '@/data/walletRegistry';
import { WalletLogo } from './WalletLogo';
import { cn } from '@/lib/utils';

interface DetectedWalletsProps {
  wallets: WalletEntry[];
  connecting: string | null;
  successSet: Set<string>;
  onConnect: (walletId: string) => void;
}

const POPULARITY_RANK: Record<string, number> = {
  metamask: 1, phantom: 2, coinbase: 3, trust: 4, rainbow: 5, walletconnect: 6,
  rabby: 7, okx: 8, brave: 9, zerion: 10, exodus: 11, keplr: 12,
};

export const DetectedWallets: React.FC<DetectedWalletsProps> = ({
  wallets, connecting, successSet, onConnect,
}) => {
  if (wallets.length === 0) return null;

  const sorted = [...wallets].sort((a, b) => {
    const ra = POPULARITY_RANK[a.id] ?? 999;
    const rb = POPULARITY_RANK[b.id] ?? 999;
    return ra - rb;
  });

  const hero = sorted[0];
  const others = sorted.slice(1);

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em]">
          Detected in your browser
        </span>
      </div>

      {/* Hero — most popular detected wallet */}
      <button
        onClick={() => onConnect(hero.id)}
        disabled={connecting === hero.id}
        className={cn(
          "w-full flex items-center justify-between p-3.5 rounded-xl border",
          "border-primary/30 bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20",
          "transition-all disabled:opacity-60"
        )}
      >
        <div className="flex items-center gap-3">
          <WalletLogo src={hero.logo} name={hero.name} size={32} className="rounded-lg" />
          <div className="flex flex-col items-start">
            <span className="font-bold text-sm text-foreground">{hero.name}</span>
            <span className="text-[9px] text-muted-foreground font-medium">Recommended</span>
          </div>
          <Star size={12} className="text-primary fill-primary" />
        </div>
        {connecting === hero.id ? (
          <Loader2 size={16} className="animate-spin text-primary" />
        ) : successSet.has(hero.id) ? (
          <Check size={16} className="text-emerald-500" />
        ) : (
          <span className="text-xs font-black text-primary uppercase tracking-wider">Connect</span>
        )}
      </button>

      {/* Other detected wallets — compact row */}
      {others.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {others.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => onConnect(wallet.id)}
              disabled={connecting === wallet.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border border-border",
                "bg-muted/30 hover:bg-muted/60 transition-all disabled:opacity-60 text-xs"
              )}
            >
              <WalletLogo src={wallet.logo} name={wallet.name} size={20} className="rounded" />
              <span className="font-semibold text-foreground">{wallet.name}</span>
              {connecting === wallet.id && <Loader2 size={12} className="animate-spin text-primary" />}
              {successSet.has(wallet.id) && <Check size={12} className="text-emerald-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
