import React, { useState, useEffect } from 'react';
import { Coins, History, TrendingUp, Users, BookOpen, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getChoiceBalance,
  getTransactionHistory,
  getRewardLabel,
  getRewardCategory,
  ChoiceTransaction,
} from '@/services/rewardService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ChoiceBalanceCardProps {
  userId: string;
  refreshKey?: number; // bump to trigger re-fetch
}

const categoryIcons: Record<string, React.ElementType> = {
  identity: Wallet,
  education: BookOpen,
  community: Users,
  finance: TrendingUp,
};

const categoryColors: Record<string, string> = {
  identity: 'text-primary',
  education: 'text-purple-400',
  community: 'text-amber-400',
  finance: 'text-emerald-400',
};

export const ChoiceBalanceCard: React.FC<ChoiceBalanceCardProps> = ({ userId, refreshKey }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<ChoiceTransaction[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    getChoiceBalance(userId).then((b) => {
      setBalance(b);
      setIsLoading(false);
    });
  }, [userId, refreshKey]);

  const loadHistory = async () => {
    const txs = await getTransactionHistory(userId);
    setTransactions(txs);
    setHistoryOpen(true);
  };

  // Group transactions by category for summary
  const categorySummary = transactions.reduce<Record<string, number>>((acc, tx) => {
    const cat = getRewardCategory(tx.type);
    acc[cat] = (acc[cat] || 0) + tx.amount;
    return acc;
  }, {});

  return (
    <>
      <div className="bg-[hsl(var(--dark))] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-border/10">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 rounded-full blur-[80px] opacity-10 pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <span className="text-primary text-lg font-black">◈</span>
              </div>
              <div>
                <h3 className="text-white text-sm font-black uppercase tracking-widest">CHOICE Balance</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Identity Fuel</p>
              </div>
            </div>
            <button
              onClick={loadHistory}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              title="View history"
            >
              <History size={16} className="text-slate-400" />
            </button>
          </div>

          {/* Balance */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                {isLoading ? '—' : balance.toLocaleString()}
              </span>
              <span className="text-primary text-sm font-black uppercase tracking-wider">CHOICE</span>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'identity', label: 'Identity' },
              { key: 'education', label: 'Education' },
              { key: 'community', label: 'Community' },
            ].map(({ key, label }) => {
              const Icon = categoryIcons[key];
              return (
                <div
                  key={key}
                  className="bg-white/[0.04] rounded-xl px-3 py-2.5 border border-white/[0.06]"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={12} className={categoryColors[key]} />
                    <span className="text-slate-500 text-[8px] font-black uppercase tracking-widest">{label}</span>
                  </div>
                  <span className="text-white text-sm font-black tracking-tighter">
                    {isLoading ? '—' : '+'}{!isLoading && (categorySummary[key] || 0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transaction History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-primary text-lg">◈</span> CHOICE Transaction History
            </DialogTitle>
            <DialogDescription>
              All earned CHOICE coins from your activity
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 mt-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No transactions yet. Start earning CHOICE coins!
              </div>
            ) : (
              transactions.map((tx) => {
                const category = getRewardCategory(tx.type);
                const Icon = categoryIcons[category];
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border"
                  >
                    <div className={cn('p-2 rounded-lg bg-card border border-border', categoryColors[category])}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{getRewardLabel(tx.type)}</p>
                      <p className="text-[10px] text-muted-foreground font-medium truncate">
                        {tx.reason.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-primary font-black text-sm">+{tx.amount}</span>
                      <p className="text-[9px] text-muted-foreground font-medium">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
