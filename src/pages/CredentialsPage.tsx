import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { VerifiableCredential } from '@/types';
import { addCredential } from '@/services/storageService';
import { mockUploadToIPFS } from '@/services/cryptoService';
import { analyzeWalletHistory, BlockchainStats } from '@/services/blockchainService';

import { ChoiceButton } from '@/components/ChoiceButton';
import { SocialReputationHub } from '@/components/social/SocialReputationHub';
import {
  FileText, Upload, FileCheck, GraduationCap, Award, BadgeCheck,
  CreditCard, Wallet, Activity, CheckCircle2, Clock3, ChevronDown, ChevronUp,
  ExternalLink, Zap, Globe,
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
  { id: 'ethereum', name: 'ETHEREUM', logo: ethereumLogo },
  { id: 'arbitrum', name: 'ARBITRUM', logo: arbitrumLogo },
  { id: 'base', name: 'BASE', logo: baseLogo },
  { id: 'bitcoin', name: 'BITCOIN', logo: bitcoinLogo },
  { id: 'solana', name: 'SOLANA', logo: solanaLogo },
  { id: 'avalanche', name: 'AVALANCHE', logo: avalancheLogo },
  { id: 'cardano', name: 'CARDANO', logo: cardanoLogo },
  { id: 'polkadot', name: 'POLKADOT', logo: polkadotLogo },
  { id: 'tezos', name: 'TEZOS', logo: tezosLogo },
];

const CredentialsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userIdentity: identity, updateIdentity: onUpdateIdentity } = useWallet();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<'Diploma' | 'Certification' | 'Award' | 'ID'>('Diploma');
  const [isVerifyingDoc, setIsVerifyingDoc] = useState(false);

  const [walletStats, setWalletStats] = useState<BlockchainStats | null>(null);
  const [isAnalyzingWallet, setIsAnalyzingWallet] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [walletExpanded, setWalletExpanded] = useState(false);

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
      await grantWalletAnalysisReward(identity.address, identity.address);
    } catch (e) {
      console.error('Wallet analysis failed', e);
    } finally {
      setIsAnalyzingWallet(false);
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
        {/* Dark header */}
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
          <div className="flex flex-wrap gap-3 md:gap-4 mb-6 justify-center md:justify-start">
            {CHAINS.map((chain) => {
              const active = walletCredential ? isChainActive(chain.id) : false;
              return (
                <button
                  key={chain.id}
                  onClick={() => setSelectedChain(selectedChain === chain.id ? null : chain.id)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-xl border transition-all min-w-[60px]',
                    active
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-slate-700 bg-slate-800/50 opacity-50 hover:opacity-80',
                    selectedChain === chain.id && 'ring-2 ring-primary/50',
                  )}
                >
                  <img src={chain.logo} alt={chain.name} className="w-6 h-6 object-contain" />
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-wider">{chain.name}</span>
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
                  { label: 'TRUST SIGNAL', value: '+7 pts', icon: CheckCircle2, highlight: true },
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
                    <a href={`https://etherscan.io/address/${identity.address}`} target="_blank" rel="noreferrer"
                      className="text-[10px] text-primary font-bold flex items-center gap-1 hover:underline">
                      <ExternalLink size={10} /> View on-chain details
                    </a>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Add wallet button */}
          <button
            onClick={() => navigate('/wallet-manager')}
            className="w-full mt-4 py-3 border border-dashed border-slate-600 rounded-xl text-slate-400 text-xs font-bold hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2"
          >
            + Add wallet from another chain
          </button>
        </div>
      </section>

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
          <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20 hidden sm:inline-flex">+20 PTS</span>
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
