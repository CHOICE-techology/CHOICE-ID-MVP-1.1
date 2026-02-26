import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { VerifiableCredential } from '@/types';
import { addCredential } from '@/services/storageService';
import { mockUploadToIPFS, mockConnectSocial, mockVerifyPhysicalDocument } from '@/services/cryptoService';
import { analyzeWalletHistory, BlockchainStats } from '@/services/blockchainService';
import { ChoiceButton } from '@/components/ChoiceButton';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import {
  FileText, Check, Wallet, History,
  Linkedin, Twitter, Facebook, Instagram, Youtube, Globe,
  Zap, X, Upload, FileCheck,
  Activity, Github,
  Send, MessageSquare, Music,
  PlusCircle, CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CredentialsPage: React.FC = () => {
  const { userIdentity: identity, updateIdentity: onUpdateIdentity } = useWallet();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [customPlatformName, setCustomPlatformName] = useState('');
  const [handleInput, setHandleInput] = useState('');
  const [isVerifyingSocial, setIsVerifyingSocial] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<'Diploma' | 'Certification' | 'Award' | 'ID'>('Diploma');
  const [isVerifyingDoc, setIsVerifyingDoc] = useState(false);

  if (!identity) return <div className="text-center text-muted-foreground mt-20 font-medium">Please connect wallet to access credentials.</div>;

  const handleAnalyzeWallet = async () => {
    setIsAnalyzing(true);
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
    } catch (e) { console.error("Wallet analysis failed", e); }
    finally { setIsAnalyzing(false); }
  };

  const initiateSocialConnect = (platform: string) => {
    setActivePlatform(platform);
    setHandleInput('');
    setCustomPlatformName('');
  };

  const confirmSocialConnect = async () => {
    const platformToUse = activePlatform === 'Custom' ? customPlatformName : activePlatform;
    if (!platformToUse || !handleInput) return;
    setIsVerifyingSocial(true);
    try {
      const result = await mockConnectSocial(platformToUse, handleInput);
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
    } catch (e) { console.error(`Failed to connect ${activePlatform}`, e); }
    finally { setIsVerifyingSocial(false); }
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
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-8">
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                We scan your full transaction history to identify professional expertise.
                <span className="text-primary"> DeFi usage</span>,
                <span className="text-primary"> NFT collecting</span>, and
                <span className="text-primary"> Governance participation</span> builds your score.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <ChoiceButton onClick={handleAnalyzeWallet} isLoading={isAnalyzing} className="rounded-2xl py-4 px-8 font-black text-xs uppercase tracking-widest shadow-glow-primary">
                  {identity.credentials.some(vc => vc.type.includes('WalletHistoryCredential')) ? 'Refresh Analysis' : 'Analyze Wallet History'}
                </ChoiceButton>
                <div className="flex flex-wrap gap-3">
                  {['DeFi Power User', 'OG Holder', 'NFT Collector'].map(tag => (
                    <span key={tag} className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20 flex items-center gap-2">
                      <Check size={12} strokeWidth={3} /> {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Account Age', value: blockchainStats?.accountAge || '7 Yrs' },
                  { label: 'Total Volume', value: blockchainStats?.totalVolume || '100 ETH', color: 'text-primary' },
                  { label: 'Assets Held', value: blockchainStats?.assetsHeld || '10 Token(s)', color: 'text-purple-400' },
                  { label: 'Est. Net Value', value: blockchainStats?.netValue || '$19,344.65', color: 'text-emerald-400' }
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
            Connect your profiles to build your <strong className="text-foreground">Off-Chain Authority</strong>. We analyze followers, engagement, and post history.
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
          <span className="md:ml-auto bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-emerald-100 w-fit">+40 Points Max</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="relative group">
            <div className="bg-muted border-2 border-dashed border-border rounded-[2rem] p-8 md:p-12 text-center hover:bg-muted/70 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden">
              <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" accept=".pdf,.jpg,.png" />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-4 text-primary animate-fade-in">
                  <div className="p-4 bg-primary/10 rounded-full"><FileText size={48} /></div>
                  <span className="font-black text-lg tracking-tight">{selectedFile.name}</span>
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
                    className={cn("px-6 py-3 rounded-2xl text-sm font-bold transition-all border",
                      docType === type ? "bg-dark text-white border-dark shadow-lg scale-105" : "bg-card border-border text-muted-foreground hover:bg-muted hover:border-border")}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <ChoiceButton onClick={verifyPhysicalDocument} isLoading={isVerifyingDoc} disabled={!selectedFile} className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-glow-primary">
              Verify & Mint Credential
            </ChoiceButton>
          </div>
        </div>
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
              {activePlatform === 'Custom' ? "Enter the platform name and your username to verify your social presence." : "Enter the URL to your profile. We will verify ownership and run a reputation scan."}
            </p>
            {activePlatform === 'Custom' && (
              <div className="mb-6">
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">PLATFORM NAME</label>
                <input type="text" value={customPlatformName} onChange={(e) => setCustomPlatformName(e.target.value)}
                  className="w-full bg-muted border border-border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground" placeholder="e.g. Threads, Mastodon" />
              </div>
            )}
            <div className="mb-8">
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">{activePlatform === 'Custom' ? 'USERNAME' : 'PROFILE LINK'}</label>
              <input type="text" value={handleInput} onChange={(e) => setHandleInput(e.target.value)}
                className="w-full bg-muted border border-border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground"
                placeholder={activePlatform === 'Custom' ? "@username" : `https://${activePlatform.toLowerCase()}.com/...`} autoFocus={activePlatform !== 'Custom'} />
            </div>
            <ChoiceButton onClick={confirmSocialConnect} isLoading={isVerifyingSocial} className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-glow-primary"
              disabled={!handleInput || (activePlatform === 'Custom' && !customPlatformName)}>
              Verify & Connect
            </ChoiceButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default CredentialsPage;
