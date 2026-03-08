import React, { useState, useEffect, useCallback } from 'react';
import { History, TrendingUp, Users, BookOpen, Wallet, Target, Zap, RefreshCw, ArrowUpRight, Clock, Award } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';

interface ChoiceBalanceCardProps {
  userId: string;
  refreshKey?: number;
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

const categoryBgColors: Record<string, string> = {
  identity: 'bg-primary/10 border-primary/20',
  education: 'bg-purple-500/10 border-purple-500/20',
  community: 'bg-amber-500/10 border-amber-500/20',
  finance: 'bg-emerald-500/10 border-emerald-500/20',
};

export const ChoiceBalanceCard: React.FC<ChoiceBalanceCardProps> = ({ userId, refreshKey }) => {
  const [balance, setBalance] = useState(0);
  const [prevBalance, setPrevBalance] = useState(0);
  const [transactions, setTransactions] = useState<ChoiceTransaction[]>([]);
  const [recentTxs, setRecentTxs] = useState<ChoiceTransaction[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categorySummary, setCategorySummary] = useState<Record<string, number>>({});

  const fetchData = useCallback(async (showRefresh = false) => {
    if (!userId) return;
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [bal, txs] = await Promise.all([
        getChoiceBalance(userId),
        getTransactionHistory(userId),
      ]);

      setPrevBalance(balance);
      setBalance(bal);
      setTransactions(txs);

      // Recent 3 transactions
      setRecentTxs(txs.slice(0, 3));

      // Category breakdown from actual transactions
      const summary = txs.reduce<Record<string, number>>((acc, tx) => {
        const cat = getRewardCategory(tx.type);
        acc[cat] = (acc[cat] || 0) + tx.amount;
        return acc;
      }, {});
      setCategorySummary(summary);
    } catch (e) {
      console.error('ChoiceBalanceCard fetch error:', e);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, [userId, balance]);

  // Initial load + refresh on key change
  useEffect(() => {
    fetchData();
  }, [userId, refreshKey]);

  // Real-time subscription to choice_transactions
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`choice-balance-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'choice_transactions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // New transaction detected — refresh data
          fetchData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchData]);

  const loadFullHistory = async () => {
    if (transactions.length === 0) {
      const txs = await getTransactionHistory(userId);
      setTransactions(txs);
    }
    setHistoryOpen(true);
  };

  const totalTransactions = transactions.length;
  const balanceDelta = balance - prevBalance;

  // Calculate earning streak (consecutive days with transactions)
  const streakDays = (() => {
    if (transactions.length === 0) return 0;
    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstTxDate = new Date(transactions[0].created_at);
    firstTxDate.setHours(0, 0, 0, 0);
    if (firstTxDate.getTime() < today.getTime() - 86400000) return 0; // last tx older than yesterday
    
    for (let i = 1; i < transactions.length; i++) {
      const d1 = new Date(transactions[i - 1].created_at);
      d1.setHours(0, 0, 0, 0);
      const d2 = new Date(transactions[i].created_at);
      d2.setHours(0, 0, 0, 0);
      const diffDays = (d1.getTime() - d2.getTime()) / 86400000;
      if (diffDays <= 1) streak++;
      else break;
    }
    return streak;
  })();

  return (
    <>
      <div className="bg-[hsl(var(--dark))] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-border/10">
        {/* Glow effects */}
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
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Identity Fuel · Live</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchData(true)}
                className={cn(
                  'p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors',
                  isRefreshing && 'animate-spin'
                )}
                title="Refresh"
                disabled={isRefreshing}
              >
                <RefreshCw size={14} className="text-slate-400" />
              </button>
              <button
                onClick={loadFullHistory}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                title="View full history"
              >
                <History size={14} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Balance + Stats Row */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                  {isLoading ? '—' : balance.toLocaleString()}
                </span>
                <span className="text-primary text-sm font-black uppercase tracking-wider">CHOICE</span>
              </div>
              {!isLoading && balanceDelta > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight size={12} className="text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-bold">+{balanceDelta} since last refresh</span>
                </div>
              )}
            </div>
            {/* Mini stats */}
            <div className="flex gap-3">
              <div className="text-right">
                <span className="text-white text-lg font-black">{totalTransactions}</span>
                <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Rewards</p>
              </div>
              <div className="text-right">
                <span className="text-white text-lg font-black flex items-center justify-end gap-0.5">
                  {streakDays}<Zap size={12} className="text-amber-400" />
                </span>
                <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Streak</p>
              </div>
            </div>
          </div>

          {/* Category breakdown — 4 cols */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
            {[
              { key: 'identity', label: 'Identity' },
              { key: 'education', label: 'Education' },
              { key: 'community', label: 'Community' },
              { key: 'finance', label: 'Finance' },
            ].map(({ key, label }) => {
              const Icon = categoryIcons[key];
              const val = categorySummary[key] || 0;
              const pct = balance > 0 ? Math.round((val / balance) * 100) : 0;
              return (
                <div
                  key={key}
                  className="bg-white/[0.04] rounded-xl px-3 py-3 border border-white/[0.06]"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon size={12} className={categoryColors[key]} />
                    <span className="text-slate-500 text-[8px] font-black uppercase tracking-widest">{label}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-white text-sm font-black tracking-tighter">
                      {isLoading ? '—' : `+${val}`}
                    </span>
                    {!isLoading && pct > 0 && (
                      <span className="text-slate-600 text-[9px] font-bold">{pct}%</span>
                    )}
                  </div>
                  {/* Mini progress bar */}
                  {!isLoading && (
                    <div className="mt-1.5 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', {
                          'bg-primary': key === 'identity',
                          'bg-purple-400': key === 'education',
                          'bg-amber-400': key === 'community',
                          'bg-emerald-400': key === 'finance',
                        })}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recent Activity Feed */}
          {!isLoading && recentTxs.length > 0 && (
            <div className="border-t border-white/[0.06] pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Recent Activity</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 text-[9px] font-bold">Live</span>
                </div>
              </div>
              <div className="space-y-2">
                {recentTxs.map((tx) => {
                  const category = getRewardCategory(tx.type);
                  const Icon = categoryIcons[category];
                  const timeAgo = getTimeAgo(tx.created_at);
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                    >
                      <div className={cn('p-1.5 rounded-lg border', categoryBgColors[category])}>
                        <Icon size={12} className={categoryColors[category]} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-bold truncate">{getRewardLabel(tx.type)}</p>
                        <p className="text-slate-600 text-[9px] font-medium truncate">
                          {tx.reason.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-primary font-black text-xs">+{tx.amount}</span>
                        <p className="text-slate-600 text-[8px] font-medium">{timeAgo}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Transaction History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-primary text-lg">◈</span> Transaction History
            </DialogTitle>
            <DialogDescription>
              {transactions.length} rewards earned · ◈ {balance.toLocaleString()} CHOICE total
            </DialogDescription>
          </DialogHeader>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-muted rounded-xl p-3 border border-border text-center">
              <Award size={16} className="text-primary mx-auto mb-1" />
              <span className="text-lg font-black text-foreground">{transactions.length}</span>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Total Rewards</p>
            </div>
            <div className="bg-muted rounded-xl p-3 border border-border text-center">
              <Target size={16} className="text-primary mx-auto mb-1" />
              <span className="text-lg font-black text-foreground">{balance.toLocaleString()}</span>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Balance</p>
            </div>
            <div className="bg-muted rounded-xl p-3 border border-border text-center">
              <Zap size={16} className="text-amber-400 mx-auto mb-1" />
              <span className="text-lg font-black text-foreground">{streakDays}</span>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Day Streak</p>
            </div>
          </div>

          {/* Category breakdown in dialog */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {['identity', 'education', 'community', 'finance'].map((key) => {
              const Icon = categoryIcons[key];
              const val = categorySummary[key] || 0;
              return (
                <div key={key} className="bg-muted rounded-lg p-2 border border-border text-center">
                  <Icon size={14} className={cn(categoryColors[key], 'mx-auto mb-1')} />
                  <span className="text-sm font-black text-foreground">+{val}</span>
                  <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider capitalize">{key}</p>
                </div>
              );
            })}
          </div>

          {/* Transaction list */}
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

/** Format relative time */
function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
