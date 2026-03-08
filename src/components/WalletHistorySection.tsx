import React, { useState, useEffect } from 'react';
import { analyzeWalletHistory, BlockchainStats } from '@/services/blockchainService';
import { ChoiceButton } from '@/components/ChoiceButton';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  Wallet, History, Activity, Layers, TrendingUp, Plus, X,
  AlertCircle, ChevronDown, ChevronUp, ExternalLink, Shield, Sparkles, Clock, BarChart3, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Chain logos
import ethereumLogo from '@/assets/logos/ethereum.svg';
import arbitrumLogo from '@/assets/logos/arbitrum.svg';
import bitcoinLogo from '@/assets/logos/bitcoin.svg';
import solanaLogo from '@/assets/logos/solana.svg';
import avalancheLogo from '@/assets/logos/avalanche.svg';
import cardanoLogo from '@/assets/logos/cardano.svg';
import polkadotLogo from '@/assets/logos/polkadot.svg';
import tezosLogo from '@/assets/logos/tezos.svg';

const CHAIN_META: Record<string, { logo: string; explorer: string; color: string }> = {
  ethereum: { logo: ethereumLogo, explorer: 'https://etherscan.io/address/', color: '221 83% 53%' },
  arbitrum: { logo: arbitrumLogo, explorer: 'https://arbiscan.io/address/', color: '212 96% 54%' },
  base: { logo: ethereumLogo, explorer: 'https://basescan.org/address/', color: '220 70% 55%' },
  avalanche: { logo: avalancheLogo, explorer: 'https://snowtrace.io/address/', color: '0 84% 60%' },
  bitcoin: { logo: bitcoinLogo, explorer: 'https://blockchain.info/address/', color: '33 100% 50%' },
  solana: { logo: solanaLogo, explorer: 'https://solscan.io/account/', color: '270 80% 60%' },
  cardano: { logo: cardanoLogo, explorer: 'https://cardanoscan.io/address/', color: '210 70% 50%' },
  polkadot: { logo: polkadotLogo, explorer: 'https://polkadot.subscan.io/account/', color: '340 80% 55%' },
  tezos: { logo: tezosLogo, explorer: 'https://tzkt.io/', color: '210 60% 50%' },
};

const SUPPORTED_CHAINS = [
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'arbitrum', name: 'Arbitrum' },
  { id: 'base', name: 'Base' },
  { id: 'bitcoin', name: 'Bitcoin' },
  { id: 'solana', name: 'Solana' },
  { id: 'avalanche', name: 'Avalanche' },
  { id: 'cardano', name: 'Cardano' },
  { id: 'polkadot', name: 'Polkadot' },
  { id: 'tezos', name: 'Tezos' },
];

export interface WalletEntry {
  address: string;
  chain?: string;
  stats?: BlockchainStats;
  analyzing?: boolean;
  error?: string;
}

function deriveInsights(stats: BlockchainStats): { label: string; type: 'positive' | 'neutral' | 'highlight' }[] {
  const insights: { label: string; type: 'positive' | 'neutral' | 'highlight' }[] = [];
  const tx = stats.txCount;

  if (stats.accountAge === '3+ Yrs') insights.push({ label: 'Early adopter — long-term wallet', type: 'highlight' });
  else if (stats.accountAge === '2+ Yrs') insights.push({ label: 'Mature wallet with history', type: 'positive' });

  if (tx > 500) insights.push({ label: 'High-frequency on-chain user', type: 'highlight' });
  else if (tx > 100) insights.push({ label: 'Consistent activity pattern', type: 'positive' });
  else if (tx > 10) insights.push({ label: 'Moderate on-chain presence', type: 'neutral' });
  else insights.push({ label: 'New or low-activity wallet', type: 'neutral' });

  if (stats.activeChains && stats.activeChains.length > 2) {
    insights.push({ label: `Cross-chain activity across ${stats.activeChains.length} networks`, type: 'highlight' });
  }

  if (stats.netValue && !stats.netValue.includes('$0')) {
    insights.push({ label: 'Holds real asset value', type: 'positive' });
  }

  return insights.slice(0, 4);
}

function getActivityStatus(chain: string, activeChains: string[]): 'active' | 'low' | 'none' {
  if (activeChains.some(ac => ac.toLowerCase() === chain.toLowerCase())) return 'active';
  return 'none';
}

function computeTrustContribution(totalTx: number, chainCount: number): number {
  let score = 0;
  if (totalTx > 0) score += 5;
  if (totalTx > 50) score += 2;
  if (totalTx > 200) score += 1;
  if (chainCount > 1) score += 1;
  if (chainCount > 3) score += 1;
  return Math.min(score, 10);
}

interface Props {
  wallets: WalletEntry[];
  setWallets: React.Dispatch<React.SetStateAction<WalletEntry[]>>;
  onAnalyze: (index: number) => void;
}

export const WalletHistorySection: React.FC<Props> = ({ wallets, setWallets, onAnalyze }) => {
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [expandedWallet, setExpandedWallet] = useState<number | null>(0);

  const totalTx = wallets.reduce((sum, w) => sum + (w.stats?.txCount || 0), 0);
  const analyzedCount = wallets.filter(w => w.stats).length;
  const allActiveChains = [...new Set(wallets.flatMap(w => w.stats?.activeChains || (w.stats?.chain ? [w.stats.chain] : [])))];
  const trustScore = computeTrustContribution(totalTx, allActiveChains.length);

  // Aggregate activity data from all wallets for the combined chart
  const combinedActivity = wallets
    .filter(w => w.stats?.activityData)
    .reduce<Record<string, number>>((acc, w) => {
      w.stats!.activityData.forEach(d => {
        acc[d.name] = (acc[d.name] || 0) + d.tx;
      });
      return acc;
    }, {});
  const chartData = Object.entries(combinedActivity).map(([name, tx]) => ({ name, tx }));

  const addNewWallet = () => {
    if (!newWalletAddress.trim()) return;
    if (wallets.some(w => w.address.toLowerCase() === newWalletAddress.toLowerCase())) return;
    const newIndex = wallets.length;
    setWallets(prev => [...prev, { address: newWalletAddress.trim() }]);
    setNewWalletAddress('');
    setShowAddWallet(false);
    setExpandedWallet(newIndex);
    setTimeout(() => onAnalyze(newIndex), 100);
  };

  return (
    <section className="rounded-2xl overflow-hidden border border-border/10 shadow-2xl bg-[hsl(var(--dark))]">
      {/* ── Header ── */}
      <div className="px-5 md:px-8 pt-6 pb-4 relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
              <Wallet size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">Wallet History</h2>
              <p className="text-[11px] text-slate-500 font-medium">Multi-chain on-chain activity profile</p>
            </div>
          </div>
          <span className="bg-emerald-500/15 text-emerald-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20 hidden md:inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* ── 1. Multi-Chain Overview Bar ── */}
      <div className="px-5 md:px-8 pb-5">
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {SUPPORTED_CHAINS.map(chain => {
            const meta = CHAIN_META[chain.id];
            const status = getActivityStatus(chain.id, allActiveChains);
            return (
              <div
                key={chain.id}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border transition-all",
                  status === 'active'
                    ? "bg-white/[0.06] border-primary/25 shadow-[0_0_12px_hsl(var(--primary)/0.08)]"
                    : "bg-white/[0.02] border-white/5 opacity-50"
                )}
              >
                <img src={meta.logo} alt={chain.name} className="w-5 h-5 object-contain" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{chain.name}</span>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  status === 'active' ? "bg-emerald-400" : "bg-slate-700"
                )} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. Wallet Summary Card (only if analyzed) ── */}
      {analyzedCount > 0 && (
        <div className="mx-5 md:mx-8 mb-5 bg-white/[0.04] border border-white/8 rounded-xl p-4 md:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { icon: Clock, label: 'Account Age', value: wallets.find(w => w.stats)?.stats?.accountAge || '—' },
              { icon: BarChart3, label: 'Total Volume', value: wallets.find(w => w.stats)?.stats?.totalVolume || '—' },
              { icon: Activity, label: 'Total Txns', value: totalTx.toLocaleString() },
              { icon: Layers, label: 'Active Chains', value: `${allActiveChains.length} / ${SUPPORTED_CHAINS.length}` },
              { icon: Shield, label: 'Trust Signal', value: `+${trustScore} pts`, highlight: true },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={cn(
                  "p-1.5 rounded-lg shrink-0",
                  item.highlight ? "bg-emerald-500/15" : "bg-white/[0.06]"
                )}>
                  <item.icon size={14} className={item.highlight ? "text-emerald-400" : "text-slate-400"} />
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block">{item.label}</span>
                  <span className={cn(
                    "text-sm font-black tracking-tight",
                    item.highlight ? "text-emerald-400" : "text-white"
                  )}>{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Activity Visualization ── */}
      {chartData.length > 0 && (
        <div className="mx-5 md:mx-8 mb-5 bg-white/[0.03] border border-white/6 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Transaction Activity</span>
            <span className="text-[9px] font-bold text-slate-600">{totalTx.toLocaleString()} total</span>
          </div>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="#334155" fontSize={9} fontWeight={700} tickLine={false} axisLine={false} />
                <YAxis stroke="#334155" fontSize={9} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222 47% 11%)',
                    border: '1px solid hsl(217 33% 17%)',
                    borderRadius: '10px',
                    color: '#F8FAFC',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                  labelStyle={{ color: '#94A3B8', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Area type="monotone" dataKey="tx" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#txGradient)" dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--dark))' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── 4. Wallet Behavior Insights ── */}
      {analyzedCount > 0 && (
        <div className="mx-5 md:mx-8 mb-5">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3">Behavior Insights</span>
          <div className="flex flex-wrap gap-2">
            {wallets
              .filter(w => w.stats)
              .flatMap(w => deriveInsights(w.stats!))
              .filter((v, i, arr) => arr.findIndex(x => x.label === v.label) === i)
              .map((insight, i) => (
                <span key={i} className={cn(
                  "inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all",
                  insight.type === 'highlight'
                    ? "bg-primary/10 text-primary border-primary/20"
                    : insight.type === 'positive'
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-white/[0.04] text-slate-400 border-white/8"
                )}>
                  {insight.type === 'highlight' ? <Sparkles size={11} /> : insight.type === 'positive' ? <TrendingUp size={11} /> : <Zap size={11} />}
                  {insight.label}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* ── 5. Individual Wallet Cards (Collapsible) ── */}
      <div className="px-5 md:px-8 pb-4 space-y-2">
        {wallets.map((w, i) => {
          const isExpanded = expandedWallet === i;
          const meta = w.stats?.chain ? CHAIN_META[w.stats.chain] : null;
          return (
            <div key={i} className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden transition-all hover:border-white/12">
              {/* Collapsed header */}
              <button
                onClick={() => setExpandedWallet(isExpanded ? null : i)}
                className="w-full flex items-center gap-3 p-3.5 text-left"
              >
                {meta ? (
                  <img src={meta.logo} alt="" className="w-5 h-5 object-contain shrink-0" />
                ) : (
                  <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                    <Wallet size={11} className="text-slate-500" />
                  </div>
                )}
                <code className="text-[11px] text-slate-400 font-mono truncate flex-1">{w.address}</code>
                {w.stats?.chain && (
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-primary/20 shrink-0">
                    {w.stats.chain}
                  </span>
                )}
                {w.analyzing && (
                  <span className="text-primary text-[10px] font-bold flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    Scanning...
                  </span>
                )}
                {!w.stats && !w.analyzing && (
                  <ChoiceButton onClick={(e) => { e.stopPropagation(); onAnalyze(i); }} isLoading={false} className="rounded-lg py-1 px-3 font-black text-[8px] uppercase tracking-widest shrink-0">
                    Analyze
                  </ChoiceButton>
                )}
                {w.stats && (
                  <span className="text-[10px] text-slate-500 font-bold shrink-0">{w.stats.txCount.toLocaleString()} txns</span>
                )}
                {isExpanded ? <ChevronUp size={14} className="text-slate-500 shrink-0" /> : <ChevronDown size={14} className="text-slate-500 shrink-0" />}
              </button>

              {/* Expanded details */}
              {isExpanded && w.stats && (
                <div className="px-3.5 pb-3.5 space-y-3 animate-fade-in">
                  {w.error && (
                    <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded-lg text-xs font-medium">
                      <AlertCircle size={14} /> {w.error}
                    </div>
                  )}

                  {/* Mini stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { label: 'Transactions', value: w.stats.txCount.toLocaleString() },
                      { label: 'Age', value: w.stats.accountAge },
                      { label: 'Balance', value: w.stats.balance || '—' },
                      { label: 'Net Value', value: w.stats.netValue, highlight: true },
                    ].map((s, si) => (
                      <div key={si} className={cn(
                        "px-3 py-2 rounded-lg border",
                        s.highlight ? "bg-emerald-500/8 border-emerald-500/15" : "bg-white/[0.03] border-white/6"
                      )}>
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest block mb-0.5">{s.label}</span>
                        <span className={cn("text-xs font-black tracking-tight", s.highlight ? "text-emerald-400" : "text-white")}>{s.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Active chains */}
                  {w.stats.activeChains && w.stats.activeChains.length > 1 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mr-1">Active on</span>
                      {w.stats.activeChains.map(chain => {
                        const cm = CHAIN_META[chain];
                        return (
                          <span key={chain} className="flex items-center gap-1 bg-white/5 text-slate-300 px-2 py-0.5 rounded text-[9px] font-bold border border-white/8">
                            {cm && <img src={cm.logo} alt="" className="w-3 h-3" />}
                            {chain}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* 6. View on-chain details link */}
                  {meta && (
                    <a
                      href={`${meta.explorer}${w.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-primary transition-colors"
                    >
                      <ExternalLink size={11} />
                      View on-chain details
                    </a>
                  )}
                </div>
              )}

              {/* Expanded but no stats yet and has error */}
              {isExpanded && !w.stats && w.error && (
                <div className="px-3.5 pb-3.5 animate-fade-in">
                  <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded-lg text-xs font-medium">
                    <AlertCircle size={14} /> {w.error}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Add Wallet ── */}
      <div className="px-5 md:px-8 pb-6">
        {showAddWallet ? (
          <div className="flex gap-2 items-center animate-fade-in">
            <input
              type="text"
              value={newWalletAddress}
              onChange={e => setNewWalletAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNewWallet()}
              placeholder="Paste wallet address (any chain)..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-primary/30 font-mono"
              autoFocus
            />
            <ChoiceButton onClick={addNewWallet} className="rounded-lg py-2.5 px-5 font-black text-[9px] uppercase tracking-widest">Add</ChoiceButton>
            <button onClick={() => setShowAddWallet(false)} className="text-slate-600 hover:text-white transition-colors"><X size={18} /></button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddWallet(true)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-primary font-bold transition-colors group w-full justify-center py-3 bg-white/[0.02] border border-dashed border-white/8 rounded-xl hover:border-primary/30 hover:bg-primary/5"
          >
            <Plus size={16} className="group-hover:scale-110 transition-transform" />
            Add wallet from another chain
          </button>
        )}
      </div>
    </section>
  );
};
