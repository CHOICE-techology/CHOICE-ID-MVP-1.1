import React, { useState, useEffect, useCallback } from 'react';
import {
  History, TrendingUp, Users, BookOpen, Wallet, Target, Zap, RefreshCw,
  ArrowUpRight, Award, ChevronDown, ChevronUp, Filter, Calendar,
  Shield, Gift, Bug, Globe, UserPlus, GraduationCap, Link2, ExternalLink,
} from 'lucide-react';
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
  education: 'text-violet-400',
  community: 'text-emerald-400',
  finance: 'text-amber-400',
};

const categoryBgColors: Record<string, string> = {
  identity: 'bg-primary/10 border-primary/20',
  education: 'bg-violet-500/10 border-violet-500/20',
  community: 'bg-emerald-500/10 border-emerald-500/20',
  finance: 'bg-amber-500/10 border-amber-500/20',
};

const categoryGlowColors: Record<string, string> = {
  identity: 'shadow-primary/20',
  education: 'shadow-violet-500/20',
  community: 'shadow-emerald-500/20',
  finance: 'shadow-amber-500/20',
};

/** Map reason strings to human-friendly task descriptions */
function getTaskDescription(reason: string, type: string): string {
  const descriptions: Record<string, string> = {
    wallet_connect: 'Connected wallet to CHOICE ID',
    google_connect: 'Linked Google account',
    social_discord: 'Connected Discord profile',
    social_twitter: 'Connected X (Twitter) profile',
    social_telegram: 'Connected Telegram profile',
    social_github: 'Connected GitHub profile',
    bounty_verify_professional: 'Verified professional credentials',
    bounty_beta_test: 'Completed beta testing program',
    bounty_bug_report: 'Submitted a bug report',
    bounty_global_identity: 'Created global identity profile',
    bounty_community_contrib: 'Made a community contribution',
    bounty_multichain: 'Connected multi-chain wallets',
    bounty_education_3: 'Completed 3 education modules',
    bounty_invite_3: 'Invited 3 friends to CHOICE ID',
  };

  const key = reason.toLowerCase();
  if (descriptions[key]) return descriptions[key];

  // Pattern matching for dynamic reasons
  if (key.startsWith('analysis_')) return `Analyzed wallet ${reason.slice(9, 21)}…`;
  if (key.startsWith('course_')) return `Completed course: ${reason.slice(7).replace(/-/g, ' ')}`;
  if (key.startsWith('referral_')) return `Referred a new user`;
  if (key.startsWith('social_')) return `Connected ${reason.slice(7)} profile`;
  if (key.startsWith('bounty_')) return `Completed bounty: ${reason.slice(7).replace(/_/g, ' ')}`;

  return reason.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Get a specific icon for a transaction based on its reason */
function getTransactionIcon(reason: string, type: string): React.ElementType {
  const r = reason.toLowerCase();
  if (r.includes('wallet') || r.includes('connect')) return Wallet;
  if (r.includes('bug')) return Bug;
  if (r.includes('global') || r.includes('identity')) return Globe;
  if (r.includes('invite') || r.includes('referral')) return UserPlus;
  if (r.includes('education') || r.includes('course')) return GraduationCap;
  if (r.includes('verify') || r.includes('professional')) return Shield;
  if (r.includes('beta') || r.includes('test')) return Target;
  if (r.includes('community') || r.includes('contrib')) return Gift;
  if (r.includes('multichain')) return Link2;
  if (r.includes('social') || r.includes('discord') || r.includes('twitter')) return Users;
  if (r.includes('analysis')) return TrendingUp;

  const cat = getRewardCategory(type);
  return categoryIcons[cat] || Award;
}

/** Get linked page URL for a transaction */
function getTransactionLink(reason: string, type: string): string | null {
  if (type.includes('education') || reason.includes('course') || reason.includes('education')) return '/education';
  if (type.includes('bounty') || reason.includes('bounty')) return '/bounty-board';
  if (type.includes('identity') || reason.includes('wallet') || reason.includes('connect')) return '/identity';
  if (type.includes('referral') || reason.includes('invite')) return '/bounty-board';
  return null;
}

type FilterType = 'all' | 'identity' | 'education' | 'community' | 'finance';

export const ChoiceBalanceCard: React.FC<ChoiceBalanceCardProps> = ({ userId, refreshKey }) => {
  const [balance, setBalance] = useState(0);
  const [prevBalance, setPrevBalance] = useState(0);
  const [transactions, setTransactions] = useState<ChoiceTransaction[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categorySummary, setCategorySummary] = useState<Record<string, number>>({});
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [newTxIds, setNewTxIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showAllInline, setShowAllInline] = useState(false);

  const fetchData = useCallback(async (showRefresh = false, newIds?: string[]) => {
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

      const summary = txs.reduce<Record<string, number>>((acc, tx) => {
        const cat = getRewardCategory(tx.type);
        acc[cat] = (acc[cat] || 0) + tx.amount;
        return acc;
      }, {});
      setCategorySummary(summary);

      // Mark new transaction IDs for animation
      if (newIds && newIds.length > 0) {
        setNewTxIds(new Set(newIds));
        setTimeout(() => setNewTxIds(new Set()), 3000);
      }
    } catch (e) {
      console.error('ChoiceBalanceCard fetch error:', e);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, [userId, balance]);

  useEffect(() => {
    fetchData();
  }, [userId, refreshKey]);

  // Real-time subscription
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
        (payload) => {
          const newId = (payload.new as any)?.id;
          fetchData(true, newId ? [newId] : undefined);
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

  const streakDays = (() => {
    if (transactions.length === 0) return 0;
    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstTxDate = new Date(transactions[0].created_at);
    firstTxDate.setHours(0, 0, 0, 0);
    if (firstTxDate.getTime() < today.getTime() - 86400000) return 0;
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

  // Filtered transactions
  const filteredTransactions = activeFilter === 'all'
    ? transactions
    : transactions.filter(tx => getRewardCategory(tx.type) === activeFilter);

  const inlineTransactions = showAllInline ? filteredTransactions.slice(0, 10) : filteredTransactions.slice(0, 3);

  return (
    <>
      <div className="bg-card rounded-2xl p-5 md:p-7 shadow-lg relative overflow-hidden border border-border">
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary rounded-full blur-[100px] opacity-[0.06] pointer-events-none" />

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
                <span className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">
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

          {/* Category breakdown */}
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
                  {!isLoading && (
                    <div className="mt-1.5 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', {
                          'bg-primary': key === 'identity',
                          'bg-violet-400': key === 'education',
                          'bg-emerald-400': key === 'community',
                          'bg-amber-400': key === 'finance',
                        })}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Enhanced Recent Activity Feed ── */}
          {!isLoading && transactions.length > 0 && (
            <div className="border-t border-white/[0.06] pt-4">
              {/* Activity header with filters */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Recent Activity</span>
                  <div className="flex items-center gap-1 ml-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-[9px] font-bold">Live</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Filter size={10} className="text-slate-600" />
                  {(['all', 'identity', 'education', 'community', 'finance'] as FilterType[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => { setActiveFilter(f); setShowAllInline(false); }}
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider transition-all',
                        activeFilter === f
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'
                      )}
                    >
                      {f === 'all' ? 'All' : f.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction list */}
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-4 text-slate-600 text-xs">
                    No {activeFilter} activity yet
                  </div>
                ) : (
                  inlineTransactions.map((tx) => {
                    const category = getRewardCategory(tx.type);
                    const TxIcon = getTransactionIcon(tx.reason, tx.type);
                    const isNew = newTxIds.has(tx.id);
                    const isExpanded = expandedTxId === tx.id;
                    const description = getTaskDescription(tx.reason, tx.type);
                    const link = getTransactionLink(tx.reason, tx.type);

                    return (
                      <div
                        key={tx.id}
                        className={cn(
                          'rounded-xl border transition-all duration-500 cursor-pointer group',
                          isNew
                            ? 'bg-primary/[0.08] border-primary/30 shadow-lg animate-fade-in'
                            : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1]',
                          isNew && categoryGlowColors[category],
                        )}
                        onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                      >
                        {/* Main row */}
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <div className={cn(
                            'p-2 rounded-lg border transition-transform group-hover:scale-110',
                            categoryBgColors[category],
                            isNew && 'ring-1 ring-primary/40'
                          )}>
                            <TxIcon size={14} className={categoryColors[category]} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-white text-xs font-bold truncate">{getRewardLabel(tx.type)}</p>
                              {isNew && (
                                <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[7px] font-black uppercase tracking-widest shrink-0">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500 text-[10px] font-medium truncate mt-0.5">
                              {description}
                            </p>
                          </div>
                          <div className="text-right shrink-0 flex items-center gap-2">
                            <div>
                              <span className={cn(
                                'font-black text-sm',
                                tx.amount > 0 ? 'text-primary' : 'text-red-400',
                              )}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                              </span>
                              <p className="text-slate-600 text-[9px] font-medium">
                                {formatDate(tx.created_at)}
                              </p>
                            </div>
                            <ChevronDown
                              size={12}
                              className={cn(
                                'text-slate-600 transition-transform duration-200',
                                isExpanded && 'rotate-180'
                              )}
                            />
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-0 animate-fade-in">
                            <div className="border-t border-white/[0.06] pt-2.5 ml-11">
                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div>
                                  <span className="text-slate-600 font-bold uppercase tracking-widest">Status</span>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span className="text-emerald-400 font-bold">Claimed</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-600 font-bold uppercase tracking-widest">Category</span>
                                  <p className={cn('font-bold mt-0.5 capitalize', categoryColors[category])}>
                                    {category}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-slate-600 font-bold uppercase tracking-widest">Date & Time</span>
                                  <p className="text-slate-400 font-medium mt-0.5">
                                    {formatFullDateTime(tx.created_at)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-slate-600 font-bold uppercase tracking-widest">Amount</span>
                                  <p className="text-primary font-black mt-0.5">◈ {tx.amount} CHOICE</p>
                                </div>
                              </div>
                              {link && (
                                <a
                                  href={link}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 mt-2 text-[10px] text-primary/80 hover:text-primary font-bold transition-colors"
                                >
                                  <ExternalLink size={10} />
                                  View related page
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Show more / less toggle */}
              {filteredTransactions.length > 5 && (
                <button
                  onClick={() => setShowAllInline(!showAllInline)}
                  className="w-full mt-2 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors flex items-center justify-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-widest"
                >
                  {showAllInline ? (
                    <>Show Less <ChevronUp size={12} /></>
                  ) : (
                    <>Show All {filteredTransactions.length} Transactions <ChevronDown size={12} /></>
                  )}
                </button>
              )}
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

          <div className="grid grid-cols-4 gap-2 mt-3">
            {(['identity', 'education', 'community', 'finance'] as const).map((key) => {
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

          <div className="space-y-2 mt-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No transactions yet. Start earning CHOICE coins!
              </div>
            ) : (
              transactions.map((tx) => {
                const category = getRewardCategory(tx.type);
                const TxIcon = getTransactionIcon(tx.reason, tx.type);
                const description = getTaskDescription(tx.reason, tx.type);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border"
                  >
                    <div className={cn('p-2 rounded-lg border', categoryBgColors[category])}>
                      <TxIcon size={16} className={categoryColors[category]} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{getRewardLabel(tx.type)}</p>
                      <p className="text-[10px] text-muted-foreground font-medium truncate">
                        {description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-primary font-black text-sm">+{tx.amount}</span>
                      <p className="text-[9px] text-muted-foreground font-medium">
                        {formatDate(tx.created_at)}
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

/** Format as "DD MMM YYYY" */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/** Format full date + time */
function formatFullDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}
