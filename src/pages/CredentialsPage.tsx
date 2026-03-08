import React, { useState } from 'react';
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
  PlusCircle, CheckCircle, AlertCircle
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

// Handle validation patterns
const HANDLE_PATTERNS: Record<string, { regex: RegExp; example: string }> = {
  Telegram: { regex: /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/, example: '@username' },
  Discord: { regex: /^@?[a-zA-Z0-9_.]{2,32}$/, example: '@username#0000 or @username' },
  Farcaster: { regex: /^@?[a-zA-Z0-9_.-]{1,20}$/, example: '@username' },
};

const CredentialsPage: React.FC = () => {
  const { userIdentity: identity, updateIdentity: onUpdateIdentity } = useWallet();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [customPlatformName, setCustomPlatformName] = useState('');
  const [handleInput, setHandleInput] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isVerifyingSocial, setIsVerifyingSocial] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<'Diploma' | 'Certification' | 'Award' | 'ID'>('Diploma');
  const [isVerifyingDoc, setIsVerifyingDoc] = useState(false);

  if (!identity) return <div className="text-center text-muted-foreground mt-20 font-medium">Please connect wallet to access credentials.</div>;

  const handleAnalyzeWallet = async () => {
    setIsAnalyzing(true);
    setWalletError(null);
    try {
      const stats = await analyzeWalletHistory(identity.address);
      setBlockchainStats(stats);
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
    } catch (e: any) {
      console.error("Wallet analysis failed", e);
      setWalletError(e.message || 'Analysis failed. Ensure your wallet address is valid.');
    } finally {
      setIsAnalyzing(false);
    }
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

    // Validate input
    if (!validateInput(handleInput, activePlatform || '')) {
      setLinkError(isHandlePlatform(activePlatform) ? 'Please provide a valid handle.' : 'Please provide a valid profile URL before connecting.');
      return;
    }

    setIsVerifyingSocial(true);
    setLinkError(null);
    try {
      // For handle-based platforms, construct a synthetic profile URL for the AI
      const profileUrl = isHandlePlatform(activePlatform)
        ? `https://${platformToUse.toLowerCase()}.com/${handleInput.replace(/^@/, '')}`
        : handleInput;

      const { data, error } = await supabase.functions.invoke('analyze-social', {
        body: { platform: platformToUse, profileUrl },
      });

      if (error) throw new Error(error.message || 'Analysis failed');
      if (data?.error) throw new Error(data.error);

      const result = data;

      const socialVC: VerifiableCredential = {
        id: `urn:uuid:${Math.random().toString(36).substring(2)}`,
        type: ['VerifiableCredential', 'SocialCredential'],
        issuer: `did:web:${platformToUse.toLowerCase().replace(/\s+/g, '')}.com`,
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: identity.did, ...result }
      };
      await mockUploadToIPFS(socialVC);
      const newIdentity = addCredential(identity, socialVC);
      onUpdateIdentity(newIdentity);
      setActivePlatform(null);
    } catch (e: any) {
      console.error(`Failed to connect ${activePlatform}`, e);
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
  const chartData = [
    { name: 'Jan', tx: 12 }, { name: 'Feb', tx: 19 }, { name: 'Mar', tx: 3 },
    { name: 'Apr', tx: 5 }, { name: 'May', tx: 22 }, { name: 'Jun', tx: 30 }
  ];

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

  const docTypeIcons: Record<string, string> = {
    Diploma: '🎓',
    Certification: '📜',
    Award: '🏆',
    ID: '🪪',
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2 tracking-tighter">Credentials Manager</h1>
        <p className="text-muted-foreground text-base md:text-lg font-medium">Manage real-world proofs, social connections, and chain history.</p>
      </header>

      {/* Wallet History */}
      <section className="bg-[#020617] rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 p-8 opacity-[0.03] pointer-events-none"><History size={320} className="text-white" /></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20"><Wallet size={24} className="text-primary" /></div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Wallet History Analysis</h2>
            <span className="ml-2 bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/30">Live On-Chain</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-8">
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                Real-time analysis across <span className="text-primary">Ethereum</span>, <span className="text-primary">Arbitrum</span>, <span className="text-primary">Base</span>, <span className="text-primary">Polygon</span>, <span className="text-primary">Bitcoin</span>, and <span className="text-primary">Solana</span>. We query live RPC nodes to verify your on-chain activity.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <ChoiceButton onClick={handleAnalyzeWallet} isLoading={isAnalyzing} className="rounded-2xl py-4 px-8 font-black text-xs uppercase tracking-widest shadow-glow-primary">
                  {identity.credentials.some(vc => vc.type.includes('WalletHistoryCredential')) ? 'Refresh Analysis' : 'Analyze Wallet History'}
                </ChoiceButton>
                {blockchainStats?.activeChains && (
                  <div className="flex flex-wrap gap-2">
                    {blockchainStats.activeChains.map(chain => (
                      <span key={chain} className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20 flex items-center gap-1.5">
                        <Check size={10} strokeWidth={3} /> {chain}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {walletError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-sm font-medium">
                  <AlertCircle size={16} /> {walletError}
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Account Age', value: blockchainStats?.accountAge || '—' },
                  { label: 'Total Volume', value: blockchainStats?.totalVolume || '—', color: 'text-primary' },
                  { label: 'Assets Held', value: blockchainStats?.assetsHeld || '—', color: 'text-purple-400' },
                  { label: 'Est. Net Value', value: blockchainStats?.netValue || '—', color: 'text-emerald-400' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 p-4 md:p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{stat.label}</span>
                    <span className={cn("text-base md:text-lg font-black tracking-tight", stat.color || "text-white")}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5 flex flex-col">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">ACTIVITY (LAST 6 MONTHS)</h3>
              <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={blockchainStats?.activityData || chartData}>
                    <Bar dataKey="tx" fill="#00E5FF" radius={[6, 6, 0, 0]} />
                    <XAxis dataKey="name" stroke="#334155" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', color: '#F8FAFC', fontSize: '12px' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Reputation */}
      <section className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20"><Globe size={24} className="text-blue-500" /></div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">High-Fidelity Social Reputation</h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-3xl font-medium">
            Connect your profiles with a <strong className="text-foreground">real profile URL</strong>. We verify the link format and run AI-powered reputation analysis.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {socialPlatforms.map((social) => {
            const isConnected = connectedPlatforms.includes(social.id);
            return (
              <div key={social.id} className="bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group">
                <div className="mb-6 p-4 bg-muted rounded-2xl group-hover:bg-primary/5 transition-colors">
                  <social.icon className={cn("w-8 h-8 md:w-10 md:h-10", isConnected ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-6">{social.name}</h3>
                <ChoiceButton variant={isConnected ? "primary" : "outline"}
                  className={cn("w-full rounded-2xl py-4 font-black text-xs uppercase tracking-widest transition-all", !isConnected && "border-border hover:border-primary hover:text-primary")}
                  onClick={() => !isConnected && initiateSocialConnect(social.id)} disabled={isConnected}>
                  {isConnected ? "Connected" : "Connect & Analyze"}
                </ChoiceButton>
              </div>
            );
          })}
        </div>

        {socialCredentials.length > 0 && (
          <div className="border-t border-border pt-12 animate-fade-in">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-8">SOCIAL CAPITAL ANALYSIS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {socialCredentials.map((vc) => (
                <div key={vc.id} className="bg-[#020617] text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden group border border-white/5">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <h4 className="font-black text-xl flex items-center gap-2 tracking-tighter">{vc.credentialSubject.platform as string}</h4>
                      <div className="bg-white/10 px-3 py-1 rounded-lg text-[10px] text-primary font-black uppercase tracking-widest">
                        @{(vc.credentialSubject.handle as string)?.split('/').pop()}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-black uppercase tracking-widest mb-1">Followers</span>
                        <span className="font-black text-2xl tracking-tighter">{(vc.credentialSubject.followers as number)?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-black uppercase tracking-widest mb-1">Engagement</span>
                        <span className="font-black text-2xl text-primary tracking-tighter">{vc.credentialSubject.engagementRate as string}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-black uppercase tracking-widest mb-1">Bot Risk</span>
                        <span className="font-black text-2xl text-emerald-400 tracking-tighter">{vc.credentialSubject.botProbability as string}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-black uppercase tracking-widest mb-1">Behavior</span>
                        <span className="font-black text-white text-xs bg-white/10 px-3 py-1.5 rounded-xl inline-block uppercase tracking-widest">{vc.credentialSubject.behaviorScore as string}</span>
                      </div>
                    </div>
                    {vc.credentialSubject.sector && (
                      <div className="mt-6 pt-4 border-t border-white/10">
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Sector: </span>
                        <span className="text-white text-sm font-bold">{vc.credentialSubject.sector as string}</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-10 -right-10 text-white/5 group-hover:text-white/10 transition-colors pointer-events-none"><Activity size={180} /></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Physical Verification */}
      <section className="bg-card border border-border rounded-[2.5rem] p-6 md:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20"><FileCheck size={28} className="text-primary" /></div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Real-World Proofs</h2>
              <p className="text-muted-foreground text-sm md:text-base font-medium">Verify official documents to anchor your physical identity.</p>
            </div>
          </div>
          <span className="md:ml-auto bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-emerald-100 w-fit">+20 Points Max</span>
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
                      docType === type ? "bg-dark text-white border-dark shadow-lg scale-105" : "bg-card border-border text-muted-foreground hover:bg-muted hover:border-border")}>
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

        {/* Verified Documents List */}
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

      {/* Social Modal */}
      {activePlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-dark/40 backdrop-blur-md animate-fade-in">
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
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">PROFILE URL</label>
              <input
                type="url"
                value={handleInput}
                onChange={(e) => handleInputChange(e.target.value)}
                className={cn(
                  "w-full bg-muted border rounded-2xl px-5 py-4 outline-none focus:ring-2 transition-all font-medium text-foreground",
                  linkError ? "border-red-500 focus:ring-red-500/20" : "border-border focus:ring-primary/20"
                )}
                placeholder={PLATFORM_URL_PATTERNS[activePlatform]?.example || 'https://...'}
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
