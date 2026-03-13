import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { VerifiableCredential } from '@/types';
import { addCredential } from '@/services/storageService';
import { mockUploadToIPFS } from '@/services/cryptoService';
import { analyzeWalletHistory, BlockchainStats } from '@/services/blockchainService';
import { calculateReputationBreakdown } from '@/services/scoreEngine';

import { ChoiceButton } from '@/components/ChoiceButton';
import { SocialReputationHub } from '@/components/social/SocialReputationHub';
import {
  FileText, Upload, FileCheck, GraduationCap, Award, BadgeCheck,
  CreditCard, Wallet, Activity, CheckCircle2, Clock3, ChevronDown, ChevronUp,
  ExternalLink, Zap, Globe, X, Shield, TrendingUp, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

// Chain logos
import ethereumLogo from '@/assets/logos/ethereum.svg';
import arbitrumLogo from '@/assets/logos/arbitrum.svg';
import baseLogo from '@/assets/logos/base.svg';
import bitcoinLogo from '@/assets/logos/bitcoin.svg';
import solanaLogo from '@/assets/logos/solana.svg';
import avalancheLogo from '@/assets/logos/avalanche.svg';
import cardanoLogo from '@/assets/logos/cardano.svg';
import polkadotLogo from '@/assets/logos/polkadot.svg';
import tezosLogo from '@/assets/logos/tezos.svg';

const CHAINS = [
  { id: 'ethereum', name: 'ETHEREUM', logo: ethereumLogo, color: '#627EEA', letter: 'E' },
  { id: 'arbitrum', name: 'ARBITRUM', logo: arbitrumLogo, color: '#28A0F0', letter: 'A' },
  { id: 'base', name: 'BASE', logo: baseLogo, color: '#0052FF', letter: 'B' },
  { id: 'bitcoin', name: 'BITCOIN', logo: bitcoinLogo, color: '#F7931A', letter: 'B' },
  { id: 'solana', name: 'SOLANA', logo: solanaLogo, color: '#9945FF', letter: 'S' },
  { id: 'avalanche', name: 'AVALANCHE', logo: avalancheLogo, color: '#E84142', letter: 'A' },
  { id: 'cardano', name: 'CARDANO', logo: cardanoLogo, color: '#0033AD', letter: 'C' },
  { id: 'polkadot', name: 'POLKADOT', logo: polkadotLogo, color: '#E6007A', letter: 'P' },
  { id: 'tezos', name: 'TEZOS', logo: tezosLogo, color: '#2C7DF7', letter: 'T' },
  { id: 'polygon', name: 'POLYGON', logo: null, color: '#8247E5', letter: 'P' },
  { id: 'optimism', name: 'OPTIMISM', logo: null, color: '#FF0420', letter: 'O' },
  { id: 'bnb chain', name: 'BNB', logo: null, color: '#F3BA2F', letter: 'B' },
  { id: 'cosmos', name: 'COSMOS', logo: null, color: '#2E3148', letter: 'C' },
  { id: 'near', name: 'NEAR', logo: null, color: '#000000', letter: 'N' },
  { id: 'tron', name: 'TRON', logo: null, color: '#FF0013', letter: 'T' },
  { id: 'starknet', name: 'STARKNET', logo: null, color: '#0C0C4F', letter: 'S' },
  { id: 'zksync', name: 'ZKSYNC', logo: null, color: '#1E69FF', letter: 'Z' },
  { id: 'sui', name: 'SUI', logo: null, color: '#4DA2FF', letter: 'S' },
  { id: 'aptos', name: 'APTOS', logo: null, color: '#2DD8A3', letter: 'A' },
  { id: 'fantom', name: 'FANTOM', logo: null, color: '#1969FF', letter: 'F' },
  { id: 'celo', name: 'CELO', logo: null, color: '#FCFF52', letter: 'C' },
  { id: 'harmony', name: 'HARMONY', logo: null, color: '#00AEE9', letter: 'H' },
  { id: 'moonbeam', name: 'MOONBEAM', logo: null, color: '#53CBC9', letter: 'M' },
  { id: 'cronos', name: 'CRONOS', logo: null, color: '#002D74', letter: 'C' },
  { id: 'gnosis', name: 'GNOSIS', logo: null, color: '#04795B', letter: 'G' },
  { id: 'hedera', name: 'HEDERA', logo: null, color: '#000000', letter: 'H' },
  { id: 'filecoin', name: 'FILECOIN', logo: null, color: '#0090FF', letter: 'F' },
  { id: 'icp', name: 'ICP', logo: null, color: '#29ABE2', letter: 'I' },
  { id: 'algorand', name: 'ALGORAND', logo: null, color: '#000000', letter: 'A' },
  { id: 'flow', name: 'FLOW', logo: null, color: '#00EF8B', letter: 'F' },
  { id: 'klaytn', name: 'KLAYTN', logo: null, color: '#FE3300', letter: 'K' },
];

interface AddedWallet {
  chain: string;
  address: string;
  stats: BlockchainStats;
}

const CredentialsPage: React.FC = () => {
  const { userIdentity: identity, updateIdentity: onUpdateIdentity } = useWallet();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<'Diploma' | 'Certification' | 'Award' | 'ID'>('Diploma');
  const [isVerifyingDoc, setIsVerifyingDoc] = useState(false);

  const [walletStats, setWalletStats] = useState<BlockchainStats | null>(null);
  const [isAnalyzingWallet, setIsAnalyzingWallet] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [walletExpanded, setWalletExpanded] = useState(false);

  // Add wallet dialog state
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [addWalletChain, setAddWalletChain] = useState<string | null>(null);
  const [addWalletAddress, setAddWalletAddress] = useState('');
  const [isAnalyzingAdded, setIsAnalyzingAdded] = useState(false);
  const [addedWallets, setAddedWallets] = useState<AddedWallet[]>([]);

  // Auto-analyze connected wallet on mount
  useEffect(() => {
    if (identity?.address && !walletStats && !walletCredential && !isAnalyzingWallet) {
      analyzeWallet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity?.address]);

  if (!identity)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Connect your CHOICE ID to access credentials.</h2>
        <p className="text-muted-foreground text-sm max-w-sm">Wallet activity, social proof, and manual verification appear here once connected.</p>
      </div>
    );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) setSelectedFile(event.target.files[0]);
  };

  const submitPhysicalProofForManualReview = async () => {
    if (!selectedFile) return;
    setIsVerifyingDoc(true);
    try {
      const docVC: VerifiableCredential = {
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential', 'PhysicalCredential'],
        issuer: 'did:web:choice.love/manual-review',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: identity.did,
          documentType: docType,
          fileName: selectedFile.name,
          verificationStatus: 'Pending Manual Review',
          submittedAt: new Date().toISOString(),
        },
      };
      await mockUploadToIPFS(docVC);
      const newIdentity = await addCredential(identity, docVC);
      await onUpdateIdentity(newIdentity);
      setSelectedFile(null);
    } catch (e) {
      console.error('Manual proof submission failed', e);
    } finally {
      setIsVerifyingDoc(false);
    }
  };

  const analyzeWallet = async () => {
    setIsAnalyzingWallet(true);
    try {
      const stats = await analyzeWalletHistory(identity.address);
      setWalletStats(stats);

      const walletVC: VerifiableCredential = {
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential', 'WalletHistoryCredential'],
        issuer: 'did:web:choice.love/wallet-analyzer',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: identity.did,
          ...stats,
          firstTxDate: new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString(),
        },
      };

      await mockUploadToIPFS(walletVC);
      const dedupedIdentity = {
        ...identity,
        credentials: [
          ...identity.credentials.filter((vc: VerifiableCredential) => !vc.type.includes('WalletHistoryCredential')),
          walletVC,
        ],
      };
      await onUpdateIdentity(dedupedIdentity);

      // Grant CHOICE reward for wallet analysis
      try {
        const { grantWalletAnalysisReward } = await import('@/services/rewardService');
        await grantWalletAnalysisReward(identity.address, identity.address);
      } catch (err) {
        console.warn('Wallet analysis reward failed:', err);
      }
    } catch (e) {
      console.error('Wallet analysis failed', e);
    } finally {
      setIsAnalyzingWallet(false);
    }
  };

  const analyzeAddedWallet = async () => {
    if (!addWalletChain || !addWalletAddress.trim()) return;
    setIsAnalyzingAdded(true);
    try {
      const stats = await analyzeWalletHistory(addWalletAddress.trim());
      const chainName = CHAINS.find(c => c.id === addWalletChain)?.name || addWalletChain;
      const enrichedStats = { ...stats, chain: chainName };

      setAddedWallets(prev => [...prev.filter(w => !(w.chain === addWalletChain && w.address === addWalletAddress.trim())), { chain: addWalletChain, address: addWalletAddress.trim(), stats: enrichedStats }]);

      // Create credential for this wallet
      const walletVC: VerifiableCredential = {
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential', 'WalletCreatedCredential'],
        issuer: 'did:web:choice.love/wallet-analyzer',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: identity.did,
          chain: chainName,
          address: addWalletAddress.trim(),
          ...enrichedStats,
        },
      };
      await mockUploadToIPFS(walletVC);
      const newIdentity = await addCredential(identity, walletVC);
      await onUpdateIdentity(newIdentity);

      setShowAddWallet(false);
      setAddWalletAddress('');
      setAddWalletChain(null);
    } catch (e) {
      console.error('Added wallet analysis failed', e);
    } finally {
      setIsAnalyzingAdded(false);
    }
  };

  const physicalCredentials = identity.credentials.filter((vc: VerifiableCredential) =>
    vc.type.includes('PhysicalCredential')
  );

  const walletCredential = identity.credentials.find((vc: VerifiableCredential) =>
    vc.type.includes('WalletHistoryCredential')
  );

  const walletSubject = walletCredential?.credentialSubject as Record<string, any> | undefined;
  const activeChains = walletSubject?.activeChains as string[] || walletStats?.activeChains || [];
  const activityData = walletSubject?.activityData || walletStats?.activityData || [
    { name: 'Jan', tx: 0 }, { name: 'Feb', tx: 0 }, { name: 'Mar', tx: 0 },
    { name: 'Apr', tx: 0 }, { name: 'May', tx: 0 }, { name: 'Jun', tx: 0 },
  ];

  const docTypeIconComponents: Record<string, React.ElementType> = {
    Diploma: GraduationCap,
    Certification: BadgeCheck,
    Award: Award,
    ID: CreditCard,
  };

  const isChainActive = (chainId: string) =>
    activeChains.some(c => c.toLowerCase() === chainId.toLowerCase());

  const totalTxns = walletSubject?.txCount ?? walletStats?.txCount ?? 0;

  // Score breakdown for display
  const breakdown = calculateReputationBreakdown(identity.credentials);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-1 tracking-tighter">Identity Profile</h1>
        <p className="text-muted-foreground text-sm font-medium">
          On-chain activity → Real-world proof → Social reputation → Trust score
        </p>
      </header>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* WALLET HISTORY — DARK MULTI-CHAIN BLOCK                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section className="rounded-2xl overflow-hidden shadow-xl border border-slate-700/50">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                <Wallet size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-white tracking-tight leading-tight">Wallet History</h2>
                <p className="text-slate-400 text-xs font-medium mt-0.5">Multi-chain on-chain activity profile</p>
              </div>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
            </span>
          </div>

          {/* Chain icons row */}
          <div className="flex flex-wrap gap-2 md:gap-3 mb-6 justify-center md:justify-start">
            {CHAINS.map((chain) => {
              const active = walletCredential ? isChainActive(chain.id) : false;
              return (
                <button
                  key={chain.id}
                  onClick={() => setSelectedChain(selectedChain === chain.id ? null : chain.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-1.5 md:p-2 rounded-lg border transition-all min-w-[48px]',
                    active
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-slate-700 bg-slate-800/50 opacity-50 hover:opacity-80',
                    selectedChain === chain.id && 'ring-2 ring-primary/50',
                  )}
                >
                  {chain.logo ? (
                    <img src={chain.logo} alt={chain.name} className="w-5 h-5 object-contain" />
                  ) : (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-black" style={{ backgroundColor: chain.color }}>
                      {chain.letter}
                    </div>
                  )}
                  <span className="text-[7px] font-black text-slate-300 uppercase tracking-wider">{chain.name}</span>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              );
            })}
          </div>

          {/* Wallet address bar + ANALYZE button */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-2.5 mb-6">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Wallet size={14} className="text-primary" />
            </div>
            <span className="flex-1 text-xs font-mono text-slate-300 truncate">{identity.address}</span>
            <button
              onClick={analyzeWallet}
              disabled={isAnalyzingWallet}
              className={cn(
                'px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                isAnalyzingWallet
                  ? 'bg-primary/30 text-primary/60 cursor-wait'
                  : 'bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/30',
              )}
            >
              {isAnalyzingWallet ? 'Analyzing...' : 'ANALYZE'}
            </button>
          </div>

          {/* Stats row (visible after analysis) */}
          {walletCredential && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                  { label: 'ACCOUNT AGE', value: walletSubject?.accountAge ?? walletStats?.accountAge ?? '—', icon: Clock3 },
                  { label: 'TOTAL VOLUME', value: walletSubject?.totalVolume ?? walletStats?.totalVolume ?? '—', icon: Activity },
                  { label: 'TOTAL TXNS', value: String(totalTxns), icon: Zap },
                  { label: 'ACTIVE CHAINS', value: `${activeChains.length} / ${CHAINS.length}`, icon: Globe },
                  { label: 'TRUST SIGNAL', value: `+${breakdown.categories.finance} pts`, icon: CheckCircle2, highlight: true },
                ].map(({ label, value, icon: Icon, highlight }) => (
                  <div key={label} className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={11} className="text-slate-400" />
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                    </div>
                    <p className={cn('text-sm font-bold', highlight ? 'text-emerald-400' : 'text-white')}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Transaction Activity Chart */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Transaction Activity</span>
                  <span className="text-[10px] text-primary font-bold">{totalTxns} total</span>
                </div>
                <div className="h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData}>
                      <defs>
                        <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={false} axisLine={false} tickLine={false} width={0} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px', fontSize: '11px' }}
                      />
                      <Area type="monotone" dataKey="tx" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#txGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Behavior Insights */}
              <div className="mb-4">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Behavior Insights</span>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1.5 rounded-lg border border-primary/20">
                    ◈ Moderate on-chain presence
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    ◈ Cross-chain activity across {activeChains.length} networks
                  </span>
                </div>
              </div>

              {/* Expandable wallet details card */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setWalletExpanded(e => !e)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1.5 rounded-lg">
                      <Wallet size={14} className="text-primary" />
                    </div>
                    <span className="text-xs font-mono text-slate-300 truncate max-w-[200px] md:max-w-[400px]">{identity.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-primary/20 text-primary text-[9px] font-bold px-2 py-0.5 rounded uppercase">{walletSubject?.chain || 'ETHEREUM'}</span>
                    <span className="text-slate-400 text-[10px] font-bold">{totalTxns} txns</span>
                    {walletExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </div>
                </button>

                {walletExpanded && (
                  <div className="border-t border-slate-700 p-4 animate-fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: 'TRANSACTIONS', value: String(totalTxns) },
                        { label: 'AGE', value: walletSubject?.accountAge ?? '—' },
                        { label: 'BALANCE', value: walletSubject?.balance ?? walletStats?.balance ?? '—' },
                        { label: 'NET VALUE', value: walletSubject?.netValue ?? walletStats?.netValue ?? '—' },
                      ].map(item => (
                        <div key={item.label} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                          <p className="text-sm font-bold text-white">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active on</span>
                      {activeChains.map(chain => (
                        <span key={chain} className="bg-slate-700 text-slate-300 text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {chain.toLowerCase()}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Transaction:</span>
                      <span className="text-[10px] font-mono text-primary">
                        {identity.lastAnchorHash
                          ? `${(`0x${identity.lastAnchorHash.slice(2, 66)}`).slice(0, 6)}...${(`0x${identity.lastAnchorHash.slice(2, 66)}`).slice(-4)}`
                          : `${identity.address.slice(0, 6)}...${identity.address.slice(-4)}`}
                      </span>
                      <a href={`https://etherscan.io/tx/${identity.lastAnchorHash ? `0x${identity.lastAnchorHash.slice(2, 66)}` : identity.address}`} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-primary font-bold flex items-center gap-1 hover:underline">
                        <ExternalLink size={10} /> View Transaction
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Added wallets display */}
          {addedWallets.length > 0 && (
            <div className="mt-4 space-y-3">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Added Wallets</span>
              {addedWallets.map((w, i) => {
                const chainDef = CHAINS.find(c => c.id === w.chain);
                return (
                  <div key={i} className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {chainDef?.logo ? (
                        <img src={chainDef.logo} alt={chainDef.name} className="w-5 h-5" />
                      ) : (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-black" style={{ backgroundColor: chainDef?.color || '#666' }}>
                          {chainDef?.letter || '?'}
                        </div>
                      )}
                      <span className="text-xs font-bold text-white">{chainDef?.name || w.chain}</span>
                      <span className="text-xs font-mono text-slate-400 truncate flex-1">{w.address}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
                        <p className="text-[7px] font-black text-slate-500 uppercase">Txns</p>
                        <p className="text-xs font-bold text-white">{w.stats.txCount}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
                        <p className="text-[7px] font-black text-slate-500 uppercase">Volume</p>
                        <p className="text-xs font-bold text-white">{w.stats.totalVolume}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
                        <p className="text-[7px] font-black text-slate-500 uppercase">Age</p>
                        <p className="text-xs font-bold text-white">{w.stats.accountAge}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
                        <p className="text-[7px] font-black text-slate-500 uppercase">Balance</p>
                        <p className="text-xs font-bold text-white">{w.stats.balance}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add wallet button */}
          <button
            onClick={() => setShowAddWallet(true)}
            className="w-full mt-4 py-3 border border-dashed border-slate-600 rounded-xl text-slate-400 text-xs font-bold hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2"
          >
            + Add wallet from another chain
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ADD WALLET MODAL                                          */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showAddWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-border animate-scale-in bg-card max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                  <Wallet size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground tracking-tight">Add Wallet</h3>
                  <p className="text-muted-foreground text-xs font-medium">Select chain & paste address</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAddWallet(false); setAddWalletChain(null); setAddWalletAddress(''); }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chain selection grid */}
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3">Select Chain</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-5 max-h-[200px] overflow-y-auto pr-1">
              {CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => setAddWalletChain(chain.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-xl border transition-all',
                    addWalletChain === chain.id
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border bg-muted/50 hover:border-primary/30',
                  )}
                >
                  {chain.logo ? (
                    <img src={chain.logo} alt={chain.name} className="w-5 h-5 object-contain" />
                  ) : (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-black" style={{ backgroundColor: chain.color }}>
                      {chain.letter}
                    </div>
                  )}
                  <span className="text-[7px] font-black text-muted-foreground uppercase">{chain.name}</span>
                </button>
              ))}
            </div>

            {/* Address input */}
            {addWalletChain && (
              <>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Wallet Address</p>
                <input
                  type="text"
                  value={addWalletAddress}
                  onChange={(e) => setAddWalletAddress(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 font-mono text-foreground text-sm transition-all placeholder:text-muted-foreground mb-4"
                  placeholder={`Paste your ${CHAINS.find(c => c.id === addWalletChain)?.name || ''} address`}
                  autoFocus
                />

                <ChoiceButton
                  onClick={analyzeAddedWallet}
                  isLoading={isAnalyzingAdded}
                  disabled={!addWalletAddress.trim()}
                  className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest"
                >
                  ANALYZE WALLET
                </ChoiceButton>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* REAL-WORLD PROOFS                                         */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section className="bg-card border border-border rounded-2xl p-5 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
              <FileCheck size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-foreground tracking-tight leading-tight">Real-World Proofs</h2>
              <p className="text-muted-foreground text-xs font-medium mt-0.5">Upload and verify physical documents to strengthen your identity</p>
            </div>
          </div>
          <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20 hidden sm:inline-flex">
            {breakdown.categories.physical}/20 PTS
          </span>
        </div>

        {/* Score breakdown from reputation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Physical Score', value: `${breakdown.categories.physical}/20`, icon: Shield, color: 'text-emerald-400' },
            { label: 'Docs Verified', value: `${physicalCredentials.length}/4`, icon: FileCheck, color: 'text-primary' },
            { label: 'Social Score', value: `${breakdown.categories.social}/40`, icon: Users, color: 'text-secondary' },
            { label: 'Total Score', value: `${breakdown.score}/100`, icon: TrendingUp, color: 'text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-muted/60 border border-border rounded-xl p-3 text-center">
              <Icon size={16} className={cn('mx-auto mb-1.5', color)} />
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
              <p className="text-sm font-black text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <div className="mb-5">
          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-2.5">Document Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['Diploma', 'Certification', 'Award', 'ID'] as const).map((type) => {
              const IconComp = docTypeIconComponents[type];
              return (
                <button
                  key={type}
                  onClick={() => setDocType(type)}
                  className={cn(
                    'px-4 py-3 rounded-xl text-xs font-bold transition-all border flex items-center gap-2.5',
                    docType === type
                      ? 'bg-foreground text-background border-foreground shadow-md'
                      : 'bg-muted border-border text-muted-foreground hover:bg-muted/70 hover:border-primary/30'
                  )}
                >
                  <IconComp size={16} /> {type}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative group mb-5">
          <div className="bg-muted border-2 border-dashed border-border rounded-xl p-6 md:p-8 text-center hover:bg-muted/70 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden">
            <input
              type="file"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              accept=".pdf,.jpg,.png"
            />
            {selectedFile ? (
              <div className="flex items-center gap-4 text-primary animate-fade-in justify-center">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <FileText size={24} />
                </div>
                <div className="text-left min-w-0">
                  <span className="font-black text-sm tracking-tight block truncate">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground font-medium">
                    Type: <strong className="text-foreground">{docType}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="p-3 bg-card rounded-xl shadow-sm">
                  <Upload size={28} />
                </div>
                <div className="text-center">
                  <span className="font-bold text-sm tracking-tight block">Drop file here or click to upload</span>
                  <p className="text-xs font-medium text-muted-foreground mt-1">Supports PDF, JPG, PNG</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <ChoiceButton
          onClick={submitPhysicalProofForManualReview}
          isLoading={isVerifyingDoc}
          disabled={!selectedFile}
          className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest"
        >
          VERIFY & MINT CREDENTIAL
        </ChoiceButton>

        {physicalCredentials.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-3">Submitted Documents</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {physicalCredentials.map((vc: VerifiableCredential) => {
                const dtype = vc.credentialSubject.documentType as string;
                const fname = vc.credentialSubject.fileName as string;
                const status = (vc.credentialSubject.verificationStatus as string) || 'Pending Manual Review';
                const IconComp = docTypeIconComponents[dtype] || FileText;
                const pending = status.toLowerCase().includes('pending');
                return (
                  <div key={vc.id} className="bg-muted border border-border rounded-xl p-3.5 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <IconComp size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-foreground text-sm">{dtype}</span>
                        <span className={cn('text-[8px] font-black px-2 py-0.5 rounded-full uppercase border inline-flex items-center gap-1', pending ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20')}>
                          {pending ? <Clock3 size={10} /> : <CheckCircle2 size={10} />} {status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">{fname}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SOCIAL REPUTATION                                         */}
      {/* ══════════════════════════════════════════════════════════ */}
      <SocialReputationHub identity={identity} onUpdateIdentity={onUpdateIdentity} />
    </div>
  );
};

export default CredentialsPage;
