import React, { useState, useEffect } from 'react';
import { ConnectGuideAnimation } from '@/components/ConnectGuideAnimation';
import { useWallet } from '@/contexts/WalletContext';
import { VerifiableCredential } from '@/types';
import { addCredential } from '@/services/storageService';
import { mockUploadToIPFS, mockVerifyPhysicalDocument } from '@/services/cryptoService';
import { analyzeWalletHistory, BlockchainStats } from '@/services/blockchainService';
import { supabase } from '@/integrations/supabase/client';
import { ChoiceButton } from '@/components/ChoiceButton';
import { WalletHistorySection, WalletEntry } from '@/components/WalletHistorySection';
import {
  FileText, Check,
  Linkedin, Twitter, Facebook, Instagram, Youtube, Globe,
  Zap, X, Upload, FileCheck,
  Github,
  Send, MessageSquare, Music,
  PlusCircle, CheckCircle, AlertCircle, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

const HANDLE_PLATFORMS = new Set(['Telegram', 'Discord', 'Farcaster']);

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
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (identity && wallets.length === 0) {
      setWallets([{ address: identity.address }]);
    }
  }, [identity]);

  // Track revealed social capital cards for animation
  useEffect(() => {
    if (identity) {
      const socialCreds = identity.credentials.filter(vc => vc.type.includes('SocialCredential'));
      const timer = setTimeout(() => {
        setRevealedCards(new Set(socialCreds.map(vc => vc.id)));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [identity?.credentials?.length]);

  if (!identity) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <h2 className="text-xl font-bold text-foreground">Connect your CHOICE ID to access credentials.</h2>
      <p className="text-muted-foreground text-sm max-w-sm">Here's how it works:</p>
      <ConnectGuideAnimation />
    </div>
  );

  const analyzeWallet = async (index: number) => {
    // Use functional state access to avoid stale closure issues
    let targetWallet: WalletEntry | undefined;
    setWallets(prev => {
      targetWallet = prev[index];
      return prev.map((p, i) => i === index ? { ...p, analyzing: true, error: undefined } : p);
    });
    // Wait a tick for state setter to run
    await new Promise(r => setTimeout(r, 0));
    if (!targetWallet) return;
    try {
      const stats = await analyzeWalletHistory(targetWallet.address);
      setWallets(prev => prev.map((p, i) => i === index ? { ...p, stats, analyzing: false, chain: stats.chain } : p));
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
    { name: 'X', icon: Twitter, id: 'X' },
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
    { name: 'Other', icon: PlusCircle, id: 'Custom' },
  ];

  const docTypeIcons: Record<string, string> = { Diploma: '🎓', Certification: '📜', Award: '🏆', ID: '🪪' };



  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Narrative header */}
      <header className="mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-1 tracking-tighter">Identity Profile</h1>
        <p className="text-muted-foreground text-sm font-medium">
          On-chain activity → Real-world proof → Social reputation → Trust score
        </p>
      </header>

      {/* ═══════════════ 1. WALLET HISTORY ANALYSIS ═══════════════ */}
      <WalletHistorySection wallets={wallets} setWallets={setWallets} onAnalyze={analyzeWallet} />

      {/* ═══════════════ 2. REAL-WORLD PROOFS ═══════════════ */}
      <section className="bg-card border border-border rounded-2xl p-5 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg border border-primary/20"><FileCheck size={20} className="text-primary" /></div>
            <div>
              <h2 className="text-lg font-black text-foreground tracking-tight">Real-World Proofs</h2>
              <p className="text-muted-foreground text-xs font-medium">Anchor your physical identity with verified documents.</p>
            </div>
          </div>
          <span className="md:ml-auto bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20 w-fit">+20 pts</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload area */}
          <div className="relative group">
            <div className="bg-muted border-2 border-dashed border-border rounded-xl p-6 md:p-10 text-center hover:bg-muted/70 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden">
              <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" accept=".pdf,.jpg,.png" />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-3 text-primary animate-fade-in">
                  <div className="p-3 bg-primary/10 rounded-full"><FileText size={36} /></div>
                  <span className="font-black text-base tracking-tight">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground font-medium">Type: <strong className="text-foreground">{docType}</strong></span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="p-3 bg-card rounded-full shadow-sm"><Upload size={36} /></div>
                  <span className="font-bold text-sm tracking-tight">Upload PDF / Image</span>
                  <p className="text-[10px] font-medium text-muted-foreground">Diploma, ID, Certification, Award</p>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-5 justify-center">
            <div>
              <label className="block text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3">Document Type</label>
              <div className="flex flex-wrap gap-2">
                {(['Diploma', 'Certification', 'Award', 'ID'] as const).map(type => (
                  <button key={type} onClick={() => setDocType(type)}
                    className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5",
                      docType === type ? "bg-foreground text-background border-foreground shadow-md" : "bg-card border-border text-muted-foreground hover:bg-muted")}>
                    <span>{docTypeIcons[type]}</span> {type}
                  </button>
                ))}
              </div>
            </div>
            <ChoiceButton onClick={verifyPhysicalDocument} isLoading={isVerifyingDoc} disabled={!selectedFile} className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-glow-primary">
              Verify & Mint Credential
            </ChoiceButton>
          </div>
        </div>

        {/* Verified documents */}
        {physicalCredentials.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border">
            <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Verified Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {physicalCredentials.map((vc) => {
                const dtype = vc.credentialSubject.documentType as string;
                const fname = vc.credentialSubject.fileName as string;
                return (
                  <div key={vc.id} className="bg-muted border border-border rounded-xl p-3.5 flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">{docTypeIcons[dtype] || '📄'}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-black text-foreground text-xs">{dtype}</span>
                        <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/20">Verified</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium truncate">{fname}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════ 3. SOCIAL REPUTATION ═══════════════ */}
      <section className="space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="bg-secondary/10 p-2 rounded-lg border border-secondary/20"><Shield size={18} className="text-secondary" /></div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground">Social Reputation</h2>
            <p className="text-muted-foreground text-xs font-medium">Connect profiles for AI-powered reputation analysis.</p>
          </div>
        </div>

        {/* Compact social platform grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {socialPlatforms.map((social) => {
            const isConnected = connectedPlatforms.includes(social.id);
            const justConnected = recentlyConnected === social.id;
            return (
              <button
                key={social.id}
                onClick={() => !isConnected && initiateSocialConnect(social.id)}
                disabled={isConnected}
                className={cn(
                  "relative bg-card border rounded-xl p-2.5 flex flex-col items-center gap-1 text-center transition-all duration-200 group",
                  isConnected
                    ? "border-primary/30 bg-primary/5"
                    : "border-border hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
                  justConnected && "animate-scale-in"
                )}
              >
                <social.icon className={cn("w-4 h-4", isConnected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground transition-colors')} />
                <span className="text-[9px] font-bold text-foreground leading-tight">{social.name}</span>
                {isConnected ? (
                  <Check size={8} className="text-primary" />
                ) : (
                  <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">+</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Social Capital Analysis — dynamic entry */}
        {socialCredentials.length > 0 && (
          <div className="pt-4">
            <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Social Capital Analysis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {socialCredentials.map((vc, idx) => {
                const isRevealed = revealedCards.has(vc.id);
                const isNew = recentlyConnected === (vc.credentialSubject.platform as string);
                return (
                  <div
                    key={vc.id}
                    className={cn(
                      "bg-[hsl(var(--dark))] text-white rounded-xl shadow-lg relative overflow-hidden border border-border/10 transition-all duration-500",
                      isNew ? "animate-scale-in" : isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    )}
                    style={{
                      transitionDelay: `${idx * 60}ms`,
                    }}
                  >
                    <div className="relative z-10 p-3.5">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="font-black text-xs tracking-tight">{vc.credentialSubject.platform as string}</h4>
                        <span className="bg-white/10 px-1.5 py-0.5 rounded text-[8px] text-primary font-bold truncate max-w-[80px]">
                          @{(vc.credentialSubject.handle as string)?.split('/').pop()}
                        </span>
                      </div>
                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="bg-white/[0.05] rounded-lg px-2 py-1.5">
                          <span className="text-slate-500 block text-[7px] font-black uppercase tracking-widest">Followers</span>
                          <span className="font-black text-sm tracking-tighter">{(vc.credentialSubject.followers as number)?.toLocaleString() || '—'}</span>
                        </div>
                        <div className="bg-white/[0.05] rounded-lg px-2 py-1.5">
                          <span className="text-slate-500 block text-[7px] font-black uppercase tracking-widest">Engagement</span>
                          <span className="font-black text-sm text-primary tracking-tighter">{(vc.credentialSubject.engagementRate as string) || '—'}</span>
                        </div>
                        <div className="bg-white/[0.05] rounded-lg px-2 py-1.5">
                          <span className="text-slate-500 block text-[7px] font-black uppercase tracking-widest">Bot Risk</span>
                          <span className="font-black text-sm text-emerald-400 tracking-tighter">{(vc.credentialSubject.botProbability as string) || '—'}</span>
                        </div>
                        <div className="bg-white/[0.05] rounded-lg px-2 py-1.5">
                          <span className="text-slate-500 block text-[7px] font-black uppercase tracking-widest">Behavior</span>
                          <span className="font-bold text-white text-[9px] bg-white/10 px-1.5 py-0.5 rounded inline-block uppercase tracking-wider">{(vc.credentialSubject.behaviorScore as string) || '—'}</span>
                        </div>
                      </div>
                      {vc.credentialSubject.sector && (
                        <div className="mt-2 pt-1.5 border-t border-white/8">
                          <span className="text-slate-500 text-[7px] font-black uppercase tracking-widest">Sector: </span>
                          <span className="text-white text-[10px] font-bold">{vc.credentialSubject.sector as string}</span>
                        </div>
                      )}
                    </div>
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
          <div className="bg-card rounded-2xl p-5 md:p-8 max-w-md w-full shadow-2xl border border-border">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-lg"><CheckCircle size={20} className="text-primary" /></div>
                <h3 className="text-xl font-black text-foreground tracking-tight">Link {activePlatform}</h3>
              </div>
              <button onClick={() => setActivePlatform(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
            </div>
            <p className="text-muted-foreground mb-6 text-sm font-medium leading-relaxed">
              {activePlatform === 'Custom'
                ? "Enter the platform name and your profile URL."
                : isHandlePlatform(activePlatform)
                  ? `Enter your ${activePlatform} handle for AI reputation analysis.`
                  : `Paste your ${activePlatform} profile URL for AI reputation analysis.`}
            </p>
            {activePlatform === 'Custom' && (
              <div className="mb-4">
                <label className="block text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Platform Name</label>
                <input type="text" value={customPlatformName} onChange={(e) => setCustomPlatformName(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground text-sm" placeholder="e.g. Threads, Mastodon" />
              </div>
            )}
            <div className="mb-3">
              <label className="block text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                {isHandlePlatform(activePlatform) ? 'Username / Handle' : 'Profile URL'}
              </label>
              <input
                type={isHandlePlatform(activePlatform) ? 'text' : 'url'}
                value={handleInput}
                onChange={(e) => handleInputChange(e.target.value)}
                className={cn(
                  "w-full bg-muted border rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all font-medium text-foreground text-sm",
                  linkError ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary/20"
                )}
                placeholder={isHandlePlatform(activePlatform) ? (HANDLE_PATTERNS[activePlatform!]?.example || '@username') : (PLATFORM_URL_PATTERNS[activePlatform!]?.example || 'https://...')}
                autoFocus={activePlatform !== 'Custom'}
              />
            </div>
            {linkError && (
              <div className="flex items-center gap-2 text-destructive text-xs font-medium mb-4 bg-destructive/10 border border-destructive/20 px-3 py-2.5 rounded-lg">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{linkError}</span>
              </div>
            )}
            {!linkError && <div className="mb-4" />}
            <ChoiceButton onClick={confirmSocialConnect} isLoading={isVerifyingSocial} className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-glow-primary"
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
