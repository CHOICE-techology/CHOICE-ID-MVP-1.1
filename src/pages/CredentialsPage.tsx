import React, { useState, useRef, useEffect } from 'react';
import { ConnectGuideAnimation } from '@/components/ConnectGuideAnimation';
import { useWallet } from '@/contexts/WalletContext';
import { VerifiableCredential } from '@/types';
import { addCredential } from '@/services/storageService';
import { mockUploadToIPFS, mockVerifyPhysicalDocument } from '@/services/cryptoService';
import { analyzeWalletHistory, BlockchainStats } from '@/services/blockchainService';
import { supabase } from '@/integrations/supabase/client';
import { ChoiceButton } from '@/components/ChoiceButton';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import {
  FileText, Check, Wallet, History,
  Linkedin, Twitter, Facebook, Instagram, Youtube, Globe,
  Zap, X, Upload, FileCheck,
  Activity, Github,
  Send, MessageSquare, Music,
  PlusCircle, CheckCircle, AlertCircle, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Platforms that use @handle instead of URL
const HANDLE_PLATFORMS = new Set(['Telegram', 'Discord', 'Farcaster']);

// URL patterns for each social platform
const PLATFORM_URL_PATTERNS: Record<string, { regex: RegExp; example: string }> = {
  X: { regex: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/, example: 'https://x.com/username' },
  Facebook: { regex: /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._]+\/?$/, example: 'https://facebook.com/username' },
  Linkedin: { regex: /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/, example: 'https://linkedin.com/in/username' },
  Instagram: { regex: /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/, example: 'https://instagram.com/username' },
  Github: { regex: /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/, example: 'https://github.com/username' },
  TikTok: { regex: /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+\/?$/, example: 'https://tiktok.com/@username' },
  Youtube: { regex: /^https?:\/\/(www\.)?youtube\.com\/(@[a-zA-Z0-9_-]+|channel\/[a-zA-Z0-9_-]+)\/?$/, example: 'https://youtube.com/@username' },
  Meta: { regex: /^https?:\/\/(www\.)?(facebook\.com|meta\.com)\/[a-zA-Z0-9._]+\/?$/, example: 'https://facebook.com/username' },
};

const HANDLE_PATTERNS: Record<string, { regex: RegExp; example: string }> = {
  Telegram: { regex: /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/, example: '@username' },
  Discord: { regex: /^@?[a-zA-Z0-9_.]{2,32}$/, example: '@username#0000 or @username' },
  Farcaster: { regex: /^@?[a-zA-Z0-9_.-]{1,20}$/, example: '@username' },
};

const SUPPORTED_CHAINS = [
  'Ethereum', 'Arbitrum', 'Base', 'Avalanche', 'Bitcoin', 'Solana', 'Cardano', 'Polkadot', 'Tezos'
];

interface WalletEntry {
  address: string;
  chain?: string;
  stats?: BlockchainStats;
  analyzing?: boolean;
  error?: string;
}

const CredentialsPage: React.FC = () => {
  const { userIdentity: identity, updateIdentity: onUpdateIdentity } = useWallet();
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [customPlatformName, setCustomPlatformName] = useState('');
  const [handleInput, setHandleInput] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isVerifyingSocial, setIsVerifyingSocial] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<'Diploma' | 'Certification' | 'Award' | 'ID'>('Diploma');
  const [isVerifyingDoc, setIsVerifyingDoc] = useState(false);
  const [recentlyConnected, setRecentlyConnected] = useState<string | null>(null);

  // Initialize primary wallet
  useEffect(() => {
    if (identity && wallets.length === 0) {
      setWallets([{ address: identity.address }]);
    }
  }, [identity]);

  if (!identity) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <h2 className="text-xl font-bold text-foreground">Connect your CHOICE ID to access credentials.</h2>
      <p className="text-muted-foreground text-sm max-w-sm">Here's how it works:</p>
      <ConnectGuideAnimation />
    </div>
  );

  const analyzeWallet = async (index: number) => {
    const w = wallets[index];
    setWallets(prev => prev.map((p, i) => i === index ? { ...p, analyzing: true, error: undefined } : p));
    try {
      const stats = await analyzeWalletHistory(w.address);
      setWallets(prev => prev.map((p, i) => i === index ? { ...p, stats, analyzing: false, chain: stats.chain } : p));
      // Mint credential for the first wallet analysis
      if (index === 0) {
        const historyVC: VerifiableCredential = {
          id: `urn:uuid:${Math.random().toString(36).substring(2)}`,
          type: ['VerifiableCredential', 'WalletHistoryCredential'],
          issuer: 'did:ethr:0xAnalyticsOracle',
          issuanceDate: new Date().toISOString(),
          credentialSubject: { id: identity.did, ...stats }
        };
        await mockUploadToIPFS(historyVC);
        const newIdentity = addCredential(identity, historyVC);
        onUpdateIdentity(newIdentity);
      }
    } catch (e: any) {
      setWallets(prev => prev.map((p, i) => i === index ? { ...p, analyzing: false, error: e.message || 'Analysis failed' } : p));
    }
  };

  const addNewWallet = () => {
    if (!newWalletAddress.trim()) return;
    if (wallets.some(w => w.address.toLowerCase() === newWalletAddress.toLowerCase())) return;
    const newIndex = wallets.length;
    setWallets(prev => [...prev, { address: newWalletAddress.trim() }]);
    setNewWalletAddress('');
    setShowAddWallet(false);
    // Auto-analyze
    setTimeout(() => analyzeWallet(newIndex), 100);
  };

  const initiateSocialConnect = (platform: string) => {
    setActivePlatform(platform);
    setHandleInput('');
    setCustomPlatformName('');
    setLinkError(null);
  };

  const isHandlePlatform = (platform: string | null) => platform ? HANDLE_PLATFORMS.has(platform) : false;

  const validateInput = (value: string, platform: string): boolean => {
    if (platform === 'Custom') return value.startsWith('http');
    if (HANDLE_PLATFORMS.has(platform)) {
      const pattern = HANDLE_PATTERNS[platform];
      return pattern ? pattern.regex.test(value.replace(/^@/, '')) || pattern.regex.test(value) : value.length >= 2;
    }
    const pattern = PLATFORM_URL_PATTERNS[platform];
    if (!pattern) return value.startsWith('http');
    return pattern.regex.test(value);
  };

  const handleInputChange = (value: string) => {
    setHandleInput(value);
    if (value && activePlatform) {
      if (!validateInput(value, activePlatform)) {
        if (isHandlePlatform(activePlatform)) {
          const pattern = HANDLE_PATTERNS[activePlatform];
          setLinkError(`Invalid handle. Expected: ${pattern?.example || '@username'}`);
        } else {
          const pattern = PLATFORM_URL_PATTERNS[activePlatform];
          setLinkError(`Invalid URL format. Expected: ${pattern?.example || 'https://...'}`);
        }
      } else {
        setLinkError(null);
      }
    } else {
      setLinkError(null);
    }
  };

  const confirmSocialConnect = async () => {
    const platformToUse = activePlatform === 'Custom' ? customPlatformName : activePlatform;
    if (!platformToUse || !handleInput) return;
    if (!validateInput(handleInput, activePlatform || '')) {
      setLinkError(isHandlePlatform(activePlatform) ? 'Please provide a valid handle.' : 'Please provide a valid profile URL before connecting.');
      return;
    }
    setIsVerifyingSocial(true);
    setLinkError(null);
    try {
      const profileUrl = isHandlePlatform(activePlatform)
        ? `https://${platformToUse.toLowerCase()}.com/${handleInput.replace(/^@/, '')}`
        : handleInput;
      const { data, error } = await supabase.functions.invoke('analyze-social', {
        body: { platform: platformToUse, profileUrl },
      });
      if (error) throw new Error(error.message || 'Analysis failed');
      if (data?.error) throw new Error(data.error);
      const socialVC: VerifiableCredential = {
        id: `urn:uuid:${Math.random().toString(36).substring(2)}`,
        type: ['VerifiableCredential', 'SocialCredential'],
        issuer: `did:web:${platformToUse.toLowerCase().replace(/\s+/g, '')}.com`,
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: identity.did, ...data }
      };
      await mockUploadToIPFS(socialVC);
      const newIdentity = addCredential(identity, socialVC);
      onUpdateIdentity(newIdentity);
      setRecentlyConnected(platformToUse);
      setTimeout(() => setRecentlyConnected(null), 3000);
      setActivePlatform(null);
    } catch (e: any) {
      setLinkError(e.message || 'Analysis failed. Please try again.');
    } finally {
      setIsVerifyingSocial(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) setSelectedFile(event.target.files[0]);
  };

  const verifyPhysicalDocument = async () => {
    if (!selectedFile) return;
    setIsVerifyingDoc(true);
    try {
      const result = await mockVerifyPhysicalDocument(selectedFile);
      if (result.verified) {
        const docVC: VerifiableCredential = {
          id: `urn:uuid:${Math.random().toString(36).substring(2)}`,
          type: ['VerifiableCredential', 'PhysicalCredential'],
          issuer: 'did:web:choice.love/verifier',
          issuanceDate: new Date().toISOString(),
          credentialSubject: { id: identity.did, documentType: docType, fileName: selectedFile.name, verificationStatus: 'Verified', issuer: result.issuer }
        };
        await mockUploadToIPFS(docVC);
        const newIdentity = addCredential(identity, docVC);
        onUpdateIdentity(newIdentity);
        setSelectedFile(null);
      }
    } catch (e) { console.error("Doc verification failed", e); }
    finally { setIsVerifyingDoc(false); }
  };

  const socialCredentials = identity.credentials.filter(vc => vc.type.includes('SocialCredential'));
  const physicalCredentials = identity.credentials.filter(vc => vc.type.includes('PhysicalCredential'));
  const connectedPlatforms = socialCredentials.map(vc => vc.credentialSubject.platform);

  const socialPlatforms = [
    { name: 'X (Twitter)', icon: Twitter, id: 'X' },
    { name: 'Facebook', icon: Facebook, id: 'Facebook' },
    { name: 'LinkedIn', icon: Linkedin, id: 'Linkedin' },
    { name: 'Instagram', icon: Instagram, id: 'Instagram' },
    { name: 'GitHub', icon: Github, id: 'Github' },
    { name: 'TikTok', icon: Music, id: 'TikTok' },
    { name: 'YouTube', icon: Youtube, id: 'Youtube' },
    { name: 'Meta', icon: Globe, id: 'Meta' },
    { name: 'Telegram', icon: Send, id: 'Telegram' },
    { name: 'Farcaster', icon: Zap, id: 'Farcaster' },
    { name: 'Discord', icon: MessageSquare, id: 'Discord' },
    { name: 'Other Platform', icon: PlusCircle, id: 'Custom' },
  ];

  const docTypeIcons: Record<string, string> = { Diploma: '🎓', Certification: '📜', Award: '🏆', ID: '🪪' };

  // Aggregate stats across all analyzed wallets
  const totalTx = wallets.reduce((sum, w) => sum + (w.stats?.txCount || 0), 0);
  const analyzedCount = wallets.filter(w => w.stats).length;

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2 tracking-tighter">Credentials Manager</h1>
        <p className="text-muted-foreground text-base md:text-lg font-medium">Manage wallet history, real-world proofs, and social reputation.</p>
      </header>

      {/* ═══════════════ 1. WALLET HISTORY ANALYSIS ═══════════════ */}
      <section className="bg-[#020617] rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 p-8 opacity-[0.03] pointer-events-none"><History size={320} className="text-white" /></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20"><Wallet size={24} className="text-primary" /></div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Wallet History Analysis</h2>
            <span className="ml-2 bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/30">Live On-Chain</span>
          </div>

          <p className="text-slate-400 text-sm leading-relaxed font-medium mb-4">
            Live analysis across {SUPPORTED_CHAINS.map((c, i) => (
              <span key={c}><span className="text-primary">{c}</span>{i < SUPPORTED_CHAINS.length - 1 ? ', ' : '.'}</span>
            ))}
          </p>

          {/* Wallet cards */}
          <div className="space-y-4 mb-6">
            {wallets.map((w, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 md:p-6">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <code className="text-xs text-slate-300 font-mono bg-white/5 px-3 py-1.5 rounded-lg truncate max-w-[280px] md:max-w-none">{w.address}</code>
                  {w.stats?.chain && (
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                      {w.stats.chain}
                    </span>
                  )}
                  {w.stats?.activeChains && w.stats.activeChains.length > 1 && w.stats.activeChains.slice(1).map(chain => (
                    <span key={chain} className="bg-white/5 text-slate-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10">
                      <Check size={8} className="inline mr-1" />{chain}
                    </span>
                  ))}
                  {!w.stats && !w.analyzing && (
                    <ChoiceButton onClick={() => analyzeWallet(i)} isLoading={false} className="rounded-xl py-2 px-5 font-black text-[10px] uppercase tracking-widest">
                      Analyze
                    </ChoiceButton>
                  )}
                  {w.analyzing && <span className="text-primary text-xs font-bold animate-pulse">Analyzing...</span>}
                </div>

                {w.error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-xl text-xs font-medium">
                    <AlertCircle size={14} /> {w.error}
                  </div>
                )}

                {w.stats && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {[
                      { label: 'Transactions', value: w.stats.txCount.toLocaleString() },
                      { label: 'Age', value: w.stats.accountAge },
                      { label: 'Volume', value: w.stats.totalVolume, color: 'text-primary' },
                      { label: 'Assets', value: w.stats.assetsHeld, color: 'text-purple-400' },
                      { label: 'Net Value', value: w.stats.netValue, color: 'text-emerald-400' },
                    ].map((stat, si) => (
                      <div key={si} className="bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">{stat.label}</span>
                        <span className={cn("text-sm font-black tracking-tight", stat.color || "text-white")}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {w.stats?.activityData && (
                  <div className="mt-4 h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={w.stats.activityData}>
                        <Bar dataKey="tx" fill="#00E5FF" radius={[4, 4, 0, 0]} />
                        <XAxis dataKey="name" stroke="#334155" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '10px', color: '#F8FAFC', fontSize: '11px' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add wallet */}
          {showAddWallet ? (
            <div className="flex gap-3 items-center animate-fade-in">
              <input
                type="text"
                value={newWalletAddress}
                onChange={e => setNewWalletAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNewWallet()}
                placeholder="Paste wallet address (any chain)..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                autoFocus
              />
              <ChoiceButton onClick={addNewWallet} className="rounded-xl py-3 px-6 font-black text-[10px] uppercase tracking-widest">Add</ChoiceButton>
              <button onClick={() => setShowAddWallet(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
          ) : (
            <button onClick={() => setShowAddWallet(true)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-primary font-bold transition-colors group">
              <Plus size={18} className="group-hover:scale-110 transition-transform" />
              Add another wallet from any chain
            </button>
          )}

          {analyzedCount > 1 && (
            <div className="mt-4 bg-white/5 rounded-xl border border-white/10 px-4 py-3 flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total across {analyzedCount} wallets</span>
              <span className="text-white font-black text-sm">{totalTx.toLocaleString()} txns</span>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ 2. REAL-WORLD PROOFS ═══════════════ */}
      <section className="bg-card border border-border rounded-[2.5rem] p-6 md:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20"><FileCheck size={28} className="text-primary" /></div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Real-World Proofs</h2>
              <p className="text-muted-foreground text-sm md:text-base font-medium">Verify official documents to anchor your physical identity.</p>
            </div>
          </div>
          <span className="md:ml-auto bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 w-fit">+20 Points Max</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="relative group">
            <div className="bg-muted border-2 border-dashed border-border rounded-[2rem] p-8 md:p-12 text-center hover:bg-muted/70 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden">
              <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" accept=".pdf,.jpg,.png" />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-4 text-primary animate-fade-in">
                  <div className="p-4 bg-primary/10 rounded-full"><FileText size={48} /></div>
                  <span className="font-black text-lg tracking-tight">{selectedFile.name}</span>
                  <span className="text-sm text-muted-foreground font-medium">Type: <strong className="text-foreground">{docType}</strong></span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <div className="p-4 bg-card rounded-full shadow-sm"><Upload size={48} /></div>
                  <span className="font-bold text-lg tracking-tight">Upload PDF/Image (Diploma, ID, Certs)</span>
                  <p className="text-xs font-medium text-muted-foreground">Drag and drop or click to browse</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-8 justify-center">
            <div>
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">DOCUMENT TYPE</label>
              <div className="flex flex-wrap gap-3">
                {(['Diploma', 'Certification', 'Award', 'ID'] as const).map(type => (
                  <button key={type} onClick={() => setDocType(type)}
                    className={cn("px-6 py-3 rounded-2xl text-sm font-bold transition-all border flex items-center gap-2",
                      docType === type ? "bg-foreground text-background border-foreground shadow-lg scale-105" : "bg-card border-border text-muted-foreground hover:bg-muted hover:border-border")}>
                    <span>{docTypeIcons[type]}</span> {type}
                  </button>
                ))}
              </div>
            </div>
            <ChoiceButton onClick={verifyPhysicalDocument} isLoading={isVerifyingDoc} disabled={!selectedFile} className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-glow-primary">
              Verify & Mint Credential
            </ChoiceButton>
          </div>
        </div>
        {physicalCredentials.length > 0 && (
          <div className="mt-10 pt-8 border-t border-border">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-6">VERIFIED DOCUMENTS</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {physicalCredentials.map((vc) => {
                const dtype = vc.credentialSubject.documentType as string;
                const fname = vc.credentialSubject.fileName as string;
                return (
                  <div key={vc.id} className="bg-muted border border-border rounded-2xl p-5 flex items-start gap-4">
                    <div className="text-3xl flex-shrink-0">{docTypeIcons[dtype] || '📄'}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-foreground text-sm">{dtype}</span>
                        <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/20">Verified</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium truncate">{fname}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Issued: {new Date(vc.issuanceDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════ 3. SOCIAL REPUTATION ═══════════════ */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20"><Globe size={24} className="text-blue-500" /></div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">High-Fidelity Social Reputation</h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-3xl font-medium">
            Connect profiles with a <strong className="text-foreground">real profile URL</strong>. AI-powered reputation analysis runs instantly.
          </p>
        </div>

        {/* Compact social platform grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {socialPlatforms.map((social) => {
            const isConnected = connectedPlatforms.includes(social.id);
            const justConnected = recentlyConnected === social.id;
            return (
              <button
                key={social.id}
                onClick={() => !isConnected && initiateSocialConnect(social.id)}
                disabled={isConnected}
                className={cn(
                  "relative bg-card border rounded-2xl p-4 flex flex-col items-center gap-2 text-center transition-all duration-300 group overflow-hidden",
                  isConnected
                    ? "border-primary/30 bg-primary/5"
                    : "border-border hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5",
                  justConnected && "animate-scale-in"
                )}
              >
                <social.icon className={cn("w-6 h-6", isConnected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground transition-colors')} />
                <span className="text-xs font-bold text-foreground leading-tight">{social.name}</span>
                {isConnected ? (
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">Connected</span>
                ) : (
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">Connect</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Social Capital Analysis - with animated entry */}
        {socialCredentials.length > 0 && (
          <div className="border-t border-border pt-8">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-5">SOCIAL CAPITAL ANALYSIS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {socialCredentials.map((vc, idx) => {
                const isNew = recentlyConnected === (vc.credentialSubject.platform as string);
                return (
                  <div
                    key={vc.id}
                    className={cn(
                      "bg-[#020617] text-white rounded-2xl shadow-xl relative overflow-hidden border border-white/5 flex flex-col transition-all duration-500",
                      isNew && "animate-[flipIn_0.6s_ease-out]"
                    )}
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <div className="relative z-10 p-4 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-black text-sm tracking-tight truncate">{vc.credentialSubject.platform as string}</h4>
                        <span className="bg-white/10 px-2 py-0.5 rounded-md text-[9px] text-primary font-black uppercase tracking-wider shrink-0 ml-2">
                          @{(vc.credentialSubject.handle as string)?.split('/').pop()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
                          <span className="text-slate-500 block text-[8px] font-black uppercase tracking-widest mb-0.5">Followers</span>
                          <span className="font-black text-base tracking-tighter">{(vc.credentialSubject.followers as number)?.toLocaleString() || '—'}</span>
                        </div>
                        <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
                          <span className="text-slate-500 block text-[8px] font-black uppercase tracking-widest mb-0.5">Engagement</span>
                          <span className="font-black text-base text-primary tracking-tighter">{(vc.credentialSubject.engagementRate as string) || '—'}</span>
                        </div>
                        <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
                          <span className="text-slate-500 block text-[8px] font-black uppercase tracking-widest mb-0.5">Bot Risk</span>
                          <span className="font-black text-base text-emerald-400 tracking-tighter">{(vc.credentialSubject.botProbability as string) || '—'}</span>
                        </div>
                        <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
                          <span className="text-slate-500 block text-[8px] font-black uppercase tracking-widest mb-0.5">Behavior</span>
                          <span className="font-bold text-white text-[9px] bg-white/10 px-1.5 py-0.5 rounded inline-block uppercase tracking-wider leading-tight">{(vc.credentialSubject.behaviorScore as string) || '—'}</span>
                        </div>
                      </div>
                      {vc.credentialSubject.sector && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <span className="text-slate-500 text-[8px] font-black uppercase tracking-widest">Sector: </span>
                          <span className="text-white text-[11px] font-bold">{vc.credentialSubject.sector as string}</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-6 -right-6 text-white/[0.03] pointer-events-none"><Activity size={100} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════ SOCIAL MODAL ═══════════════ */}
      {activePlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-card rounded-[2.5rem] p-6 md:p-10 max-w-md w-full shadow-2xl border border-border">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl"><CheckCircle size={24} className="text-primary" /></div>
                <h3 className="text-2xl font-bold text-foreground tracking-tight">Link {activePlatform}</h3>
              </div>
              <button onClick={() => setActivePlatform(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={24} /></button>
            </div>
            <p className="text-muted-foreground mb-8 font-medium leading-relaxed">
              {activePlatform === 'Custom'
                ? "Enter the platform name and your profile URL to verify your social presence."
                : isHandlePlatform(activePlatform)
                  ? `Enter your ${activePlatform} username or handle. We'll run an AI-powered reputation analysis.`
                  : `Paste your full ${activePlatform} profile URL. We'll validate the format and run an AI-powered reputation analysis.`}
            </p>
            {activePlatform === 'Custom' && (
              <div className="mb-6">
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">PLATFORM NAME</label>
                <input type="text" value={customPlatformName} onChange={(e) => setCustomPlatformName(e.target.value)}
                  className="w-full bg-muted border border-border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground" placeholder="e.g. Threads, Mastodon" />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                {isHandlePlatform(activePlatform) ? 'USERNAME / HANDLE' : 'PROFILE URL'}
              </label>
              <input
                type={isHandlePlatform(activePlatform) ? 'text' : 'url'}
                value={handleInput}
                onChange={(e) => handleInputChange(e.target.value)}
                className={cn(
                  "w-full bg-muted border rounded-2xl px-5 py-4 outline-none focus:ring-2 transition-all font-medium text-foreground",
                  linkError ? "border-red-500 focus:ring-red-500/20" : "border-border focus:ring-primary/20"
                )}
                placeholder={isHandlePlatform(activePlatform) ? (HANDLE_PATTERNS[activePlatform!]?.example || '@username') : (PLATFORM_URL_PATTERNS[activePlatform!]?.example || 'https://...')}
                autoFocus={activePlatform !== 'Custom'}
              />
            </div>
            {linkError && (
              <div className="flex items-center gap-2 text-red-500 text-sm font-medium mb-6 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{linkError}</span>
              </div>
            )}
            {!linkError && <div className="mb-6" />}
            <ChoiceButton onClick={confirmSocialConnect} isLoading={isVerifyingSocial} className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-glow-primary"
              disabled={!handleInput || !!linkError || (activePlatform === 'Custom' && !customPlatformName)}>
              Verify & Connect
            </ChoiceButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default CredentialsPage;
