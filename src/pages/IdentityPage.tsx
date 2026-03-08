import React, { useState, useMemo, useCallback } from 'react';
import { UserIdentity, GeneratedCV, Job } from '@/types';
import { mockGenerateCV, mockGenerateBio, generateReputationHash } from '@/services/cryptoService';
import { calculateReputation } from '@/services/reputationEngine';
import { calculateJobMatch } from '@/services/jobMatchingService';
import { ALL_JOBS } from '@/data/jobsData';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Link, useLocation } from 'react-router-dom';
import {
  Download, Edit2, Sparkles, FileText, Camera, CheckCircle, Info,
  TrendingUp, Lock, ExternalLink, Shield, Briefcase, Bell, FileCheck,
  PenTool, Target, ArrowRight, Clock, Hash, Award, Zap, Settings,
  ArrowLeft, X, Eye, Send, Gift, Copy, Share2, Move
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { useWallet } from '@/contexts/WalletContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

const IdentityPage: React.FC = () => {
  const { userIdentity: identity, updateIdentity: onUpdateIdentity } = useWallet();
  const { toast } = useToast();
  const location = useLocation();
  const navState = location.state as { verificationSuccess?: boolean; verificationData?: any } | null;
  const [cv, setCv] = useState<GeneratedCV | null>(null);
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [jobDescInput, setJobDescInput] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedCV, setOptimizedCV] = useState<GeneratedCV | null>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [selectedJobForCover, setSelectedJobForCover] = useState<Job | null>(null);
  const [isSendingApp, setIsSendingApp] = useState(false);
  const [appSent, setAppSent] = useState(false);
  const [affiliateLink, setAffiliateLink] = useState('');
  const [invitedCount] = useState(() => Math.floor(Math.random() * 5));

  // Popup states
  const [cvPopupOpen, setCvPopupOpen] = useState(false);
  const [jobPopupOpen, setJobPopupOpen] = useState(false);
  const [selectedJobForPopup, setSelectedJobForPopup] = useState<(Job & { matchResult: { score: number; reason: string; matchingSkills: string[]; missingSkills: string[]; recommendations: string[] } }) | null>(null);

  // Grid layout state
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      resizeObserver.observe(node);
      setContainerWidth(node.offsetWidth);
    }
  }, []);

  const defaultLayout: GridLayoutItem[] = [
    { i: 'scoreboard', x: 0, y: 0, w: 12, h: 7, minW: 6, minH: 5 },
    { i: 'profile', x: 0, y: 7, w: 5, h: 8, minW: 3, minH: 6 },
    { i: 'verification', x: 5, y: 7, w: 7, h: 8, minW: 4, minH: 6 },
    { i: 'recommendations', x: 0, y: 15, w: 7, h: 9, minW: 4, minH: 6 },
    { i: 'cv', x: 7, y: 15, w: 5, h: 9, minW: 3, minH: 5 },
    { i: 'referral', x: 0, y: 24, w: 12, h: 4, minW: 6, minH: 3 },
  ];

  const [layout, setLayout] = useState<GridLayoutItem[]>(() => {
    try {
      const saved = localStorage.getItem('identity_page_layout');
      return saved ? JSON.parse(saved) : defaultLayout;
    } catch {
      return defaultLayout;
    }
  });

  const onLayoutChange = (newLayout: GridLayoutItem[]) => {
    setLayout(newLayout);
    localStorage.setItem('identity_page_layout', JSON.stringify(newLayout));
  };

  const resetLayout = () => {
    setLayout(defaultLayout);
    localStorage.removeItem('identity_page_layout');
    toast({ title: 'Layout reset', description: 'Blocks returned to default positions.' });
  };

  const reputation = identity ? calculateReputation(identity.credentials) : null;
  const score = reputation?.score ?? 0;
  const physical = reputation?.breakdown.categories.physical ?? 0;
  const social = reputation?.breakdown.categories.social ?? 0;
  const finance = reputation?.breakdown.categories.finance ?? 0;
  const education = reputation?.breakdown.categories.education ?? 0;

  const safePercent = (val: number, max: number) => {
    const result = (val / max) * 100;
    return isNaN(result) || !isFinite(result) ? 0 : Math.min(result, 100);
  };

  const chartData = [
    { subject: 'Social', value: safePercent(social, 40), fullMark: 100 },
    { subject: 'Education', value: safePercent(education, 30), fullMark: 100 },
    { subject: 'Real World', value: safePercent(physical, 20), fullMark: 100 },
    { subject: 'Finance', value: safePercent(finance, 10), fullMark: 100 },
  ];

  const getTier = (s: number) => {
    if (s >= 80) return { label: 'Grand Master', color: 'text-primary' };
    if (s >= 60) return { label: 'Expert Verified', color: 'text-secondary' };
    if (s >= 30) return { label: 'Verified Identity', color: 'text-muted-foreground/50' };
    return { label: 'New Entrant', color: 'text-muted-foreground' };
  };

  const tier = getTier(score);

  const topJobMatches = useMemo(() => {
    if (!identity) return [];
    const matched = ALL_JOBS.map(job => ({
      ...job,
      matchResult: calculateJobMatch(job, identity),
    }));
    return matched
      .sort((a, b) => b.matchResult.score - a.matchResult.score)
      .slice(0, 5);
  }, [identity]);

  const scoreAlerts = useMemo(() => {
    const alerts: { icon: React.ReactNode; text: string; type: 'success' | 'info' | 'warning' }[] = [];
    if (score >= 60 && score < 80) {
      alerts.push({ icon: <TrendingUp size={14} />, text: `You're ${80 - score} points away from Grand Master tier — unlock premium job matches!`, type: 'info' });
    }
    if (score >= 30 && score < 60) {
      alerts.push({ icon: <Zap size={14} />, text: `Reach 60 points to unlock Expert Verified status and higher-tier positions.`, type: 'warning' });
    }
    if (social >= 20 && education === 0) {
      alerts.push({ icon: <Award size={14} />, text: `Strong social presence detected! Complete a course to boost your match scores significantly.`, type: 'info' });
    }
    if (finance === 0) {
      alerts.push({ icon: <Bell size={14} />, text: `Connect a wallet to add up to 10 Finance points and unlock DeFi job matches.`, type: 'warning' });
    }
    if (physical === 0) {
      alerts.push({ icon: <Lock size={14} />, text: `Add a Diploma or ID to unlock 20+ points and "Real World" badge.`, type: 'warning' });
    }
    if (social < 30) {
      alerts.push({ icon: <Info size={14} />, text: `Link more social accounts (GitHub, X) to max out Social Score.`, type: 'info' });
    }
    if (education === 0) {
      alerts.push({ icon: <TrendingUp size={14} />, text: `Complete "Web3 Basics" course to earn +5 Education points.`, type: 'info' });
    }
    return alerts;
  }, [score, social, education, finance, physical]);

  const verificationData = useMemo(() => {
    if (identity?.lastAnchorHash) {
      const mockTxHash = `0x${identity.lastAnchorHash.slice(2, 66) || 'a1b2c3d4e5f6'.repeat(5)}`;
      return {
        date: identity.lastAnchorTimestamp ? new Date(identity.lastAnchorTimestamp).toLocaleString() : null,
        score,
        txHash: mockTxHash,
        explorerUrl: `https://sepolia.arbiscan.io/tx/${mockTxHash}`,
      };
    }
    if (navState?.verificationData) {
      return {
        date: navState.verificationData.date,
        score,
        txHash: navState.verificationData.txHash,
        explorerUrl: navState.verificationData.explorerUrl || `https://sepolia.arbiscan.io/tx/${navState.verificationData.txHash}`,
      };
    }
    try {
      const stored = localStorage.getItem('choice_last_verification');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          date: parsed.date,
          score,
          txHash: parsed.txHash,
          explorerUrl: parsed.explorerUrl || `https://sepolia.arbiscan.io/tx/${parsed.txHash}`,
        };
      }
    } catch {}
    return null;
  }, [identity?.lastAnchorHash, identity?.lastAnchorTimestamp, score, navState]);

  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="bg-muted p-6 rounded-full">
          <CheckCircle size={64} className="text-muted-foreground/30" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Please connect your wallet to view your identity.</h2>
      </div>
    );
  }

  const handleGenerateCV = async () => {
    setIsGeneratingCV(true);
    try {
      const generated = await mockGenerateCV(identity);
      setCv(generated);
      setOptimizedCV(null);
      setCoverLetter(null);
      if (!identity.bio) {
        const newBio = await mockGenerateBio(identity);
        onUpdateIdentity({ ...identity, bio: newBio });
      }
    } catch (e) { console.error(e); }
    finally { setIsGeneratingCV(false); }
  };

  const handleOptimizeForJD = async () => {
    if (!cv || !jobDescInput.trim()) return;
    setIsOptimizing(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const jdLower = jobDescInput.toLowerCase();
      const prioritizedSkills = [...cv.skills].sort((a, b) => {
        const aMatch = jdLower.includes(a.toLowerCase()) ? -1 : 1;
        const bMatch = jdLower.includes(b.toLowerCase()) ? -1 : 1;
        return aMatch - bMatch;
      });
      const jdKeywords = jobDescInput.split(/[\s,;]+/).filter(w => w.length > 3).slice(0, 3);
      setOptimizedCV({
        ...cv,
        summary: `Tailored professional with verified on-chain credentials, specializing in ${jdKeywords.join(', ')}. ${cv.summary}`,
        skills: prioritizedSkills,
      });
    } catch (e) { console.error(e); }
    finally { setIsOptimizing(false); }
  };

  const handleGenerateCoverLetter = async (job?: Job) => {
    if (!cv) return;
    setIsGeneratingCover(true);
    setSelectedJobForCover(job || null);
    try {
      await new Promise(r => setTimeout(r, 2000));
      const targetRole = job?.title || 'the position';
      const targetCompany = job?.company || 'your organization';
      const topSkills = cv.skills.slice(0, 4).join(', ');
      const letter = `Dear Hiring Manager at ${targetCompany},

I am writing to express my strong interest in the ${targetRole} position. As a verified Web3 professional with a CHOICE Trust Score of ${score}/100 (${tier.label}), I bring a unique combination of on-chain credentials and real-world expertise.

My verified profile demonstrates proficiency in ${topSkills}, backed by cryptographic proofs anchored on-chain. ${cv.experience.length > 0 ? `With experience as ${cv.experience[0].role} at ${cv.experience[0].company}, I have a proven track record of delivering results in the decentralized ecosystem.` : ''}

${cv.education.length > 0 ? `My education includes ${cv.education[0].degree} from ${cv.education[0].institution}, complementing my practical blockchain experience.` : ''}

I am excited about the opportunity to contribute to ${targetCompany}'s mission and would welcome the chance to discuss how my verified credentials align with your team's needs.

Best regards,
${identity.displayName || 'CHOICE ID Holder'}
DID: ${identity.did}`;
      setCoverLetter(letter);
    } catch (e) { console.error(e); }
    finally { setIsGeneratingCover(false); }
  };

  const handleSaveProfile = () => {
    onUpdateIdentity({ ...identity, displayName: newName || identity.displayName });
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        onUpdateIdentity({ ...identity, avatar: ev.target?.result as string });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleJobClick = (job: typeof topJobMatches[0]) => {
    setSelectedJobForPopup(job);
    setJobPopupOpen(true);
    setAppSent(false);
  };

  const handleOptimizeForJob = async () => {
    if (!cv || !selectedJobForPopup) return;
    const fakeJD = `${selectedJobForPopup.title} at ${selectedJobForPopup.company}. ${selectedJobForPopup.description}. Skills: ${selectedJobForPopup.requiredSkills.join(', ')}`;
    setJobDescInput(fakeJD);
    setIsOptimizing(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const jdLower = fakeJD.toLowerCase();
      const prioritizedSkills = [...cv.skills].sort((a, b) => {
        const aMatch = jdLower.includes(a.toLowerCase()) ? -1 : 1;
        const bMatch = jdLower.includes(b.toLowerCase()) ? -1 : 1;
        return aMatch - bMatch;
      });
      setOptimizedCV({
        ...cv,
        summary: `Tailored professional with verified credentials for ${selectedJobForPopup.title} at ${selectedJobForPopup.company}. ${cv.summary}`,
        skills: prioritizedSkills,
      });
    } catch (e) { console.error(e); }
    finally { setIsOptimizing(false); }
  };

  const displayCV = optimizedCV || cv;

  const generateAffiliateLink = () => {
    const link = `https://choice.love/join?ref=${identity.address.slice(0, 10)}`;
    setAffiliateLink(link);
    navigator.clipboard.writeText(link);
    toast({ title: 'Link created & copied!', description: 'Share it with friends.' });
  };

  // Block wrapper with drag handle
  const BlockWrapper = ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div className="h-full w-full relative group">
      <div className="drag-handle absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-move bg-muted/90 backdrop-blur-sm p-1.5 rounded-lg border border-border flex items-center gap-1">
        <Move size={12} className="text-muted-foreground" />
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
      </div>
      <div className="h-full overflow-auto">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      {/* Header with reset layout button */}
      <div className="flex items-center justify-between">
        {verificationData && (
          <Link to="/verify" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/5 border border-primary/20 px-4 py-2 rounded-xl">
            <ArrowLeft size={16} /> Back to Verification
          </Link>
        )}
        <button
          onClick={resetLayout}
          className="ml-auto inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted border border-border px-3 py-1.5 rounded-lg transition-colors"
        >
          <Move size={12} /> Reset Layout
        </button>
      </div>

      {/* Draggable/Resizable Grid */}
      <div ref={containerRef} className="w-full">
        <GridLayout
          className="layout"
          layout={layout}
          gridConfig={{ cols: 12, rowHeight: 50 }}
          width={containerWidth}
          onLayoutChange={(newLayout: any) => onLayoutChange(newLayout)}
          draggableHandle=".drag-handle"
          isResizable={true}
          isDraggable={true}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
        >
          <div key="scoreboard">
            <BlockWrapper title="Score">
              <div className="bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden h-full">
                <div className="bg-[#020617] p-6 md:p-8 relative h-full">
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <CheckCircle size={300} className="text-white" />
                  </div>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10 h-full">
                    <div className="text-center md:text-left space-y-4">
                      <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 rounded-full px-4 py-1.5 backdrop-blur-md">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-300">CHOICE Trust ID</span>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-3 justify-center md:justify-start">
                          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-xl">{score}</h1>
                          <span className="text-lg text-slate-500 font-bold mb-2">/100</span>
                        </div>
                        <h2 className={`text-xl md:text-2xl font-bold ${tier.color} tracking-tight`}>{tier.label}</h2>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto md:mx-0">
                        Your score is a cryptographic aggregate of your digital and physical footprint.
                      </p>
                    </div>

                    <div className="h-[180px] md:h-[200px] w-full relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                          <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Score" dataKey="value" stroke="#00E5FF" strokeWidth={3} fill="#00E5FF" fillOpacity={0.2} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC', borderRadius: '12px' }}
                            itemStyle={{ color: '#00E5FF' }}
                            formatter={(value: number) => [`${Math.round(value)}%`, 'Capacity']}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </BlockWrapper>
          </div>

          {/* PROFILE CARD */}
          <div key="profile">
            <BlockWrapper title="Profile">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col items-center text-center relative overflow-hidden h-full">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/5 to-transparent"></div>
                <Link
                  to="/profile/settings"
                  className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-muted/80 border border-border hover:bg-accent transition-colors backdrop-blur-sm"
                  title="Edit Profile"
                >
                  <Settings size={14} className="text-muted-foreground" />
                </Link>

                <div className="relative group mb-4 z-10">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-2xl bg-muted flex items-center justify-center relative">
                    {identity.avatar ? (
                      <img src={identity.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-muted-foreground/30">{identity.displayName?.charAt(0) || '?'}</span>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px] rounded-full">
                      <Camera size={20} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>

                <div className="w-full mb-3 relative z-10">
                  {isEditing ? (
                    <div className="flex gap-2 justify-center mb-2 items-center">
                      <input type="text" className="border-2 border-primary/20 focus:border-primary rounded-lg px-3 py-1 text-base font-bold text-foreground w-full text-center outline-none bg-muted" defaultValue={identity.displayName} onChange={(e) => setNewName(e.target.value)} placeholder="Display Name" autoFocus />
                      <ChoiceButton size="sm" onClick={handleSaveProfile} className="shrink-0"><CheckCircle size={14} /></ChoiceButton>
                    </div>
                  ) : (
                    <h2 className="text-lg font-bold text-foreground mb-1 flex items-center justify-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
                      {identity.displayName || "Anonymous User"}
                      <Edit2 size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </h2>
                  )}
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-muted border border-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-muted-foreground font-mono text-[9px] truncate max-w-[120px]">{identity.did}</p>
                  </div>
                </div>

                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-3 ${
                  score >= 80 ? 'bg-primary/10 border-primary/20 text-primary' :
                  score >= 60 ? 'bg-secondary/10 border-secondary/20 text-secondary' :
                  'bg-muted border-border text-muted-foreground'
                }`}>
                  <Award size={12} />
                  <span className="text-[10px] font-bold">{tier.label}</span>
                </div>

                <div className="bg-muted p-3 rounded-xl text-muted-foreground text-xs border border-border w-full relative flex-1">
                  <span className="absolute -top-2 left-4 bg-card px-2 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Bio</span>
                  {identity.bio ? <p className="leading-relaxed text-xs">{identity.bio}</p> : <p className="italic text-muted-foreground/50 text-xs">No bio yet.</p>}
                </div>
              </div>
            </BlockWrapper>
          </div>

          {/* ON-CHAIN VERIFICATION */}
          <div key="verification">
            <BlockWrapper title="Verify">
              <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden h-full flex flex-col">
                <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 border-b border-border">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-2 rounded-xl">
                        <Shield size={16} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">Verify On-Chain</h3>
                        <p className="text-muted-foreground text-[10px]">Anchor your reputation hash.</p>
                      </div>
                    </div>
                    <Link to="/verify" className="shrink-0">
                      <ChoiceButton size="sm" className="shadow-lg hover:shadow-xl transition-all text-xs">
                        VERIFY NOW <CheckCircle className="ml-1" size={12} />
                      </ChoiceButton>
                    </Link>
                  </div>
                </div>

                {verificationData ? (
                  <div className="p-4 flex-1 flex flex-col justify-center space-y-3">
                    {navState?.verificationSuccess && (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                        <div className="bg-emerald-100 p-1 rounded-full">
                          <CheckCircle size={14} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-800">Verification Successful</p>
                        </div>
                      </div>
                    )}

                    <div className="bg-muted rounded-2xl border border-border overflow-hidden">
                      <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center gap-2">
                        <CheckCircle size={12} className="text-emerald-600" />
                        <span className="text-[10px] font-bold text-emerald-700">Transaction Confirmed</span>
                      </div>
                      <div className="divide-y divide-border text-xs">
                        <div className="flex items-center justify-between px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-muted-foreground" />
                            <span className="text-[10px] font-semibold text-muted-foreground">Date</span>
                          </div>
                          <span className="text-xs font-semibold text-foreground">{verificationData.date}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Award size={12} className="text-muted-foreground" />
                            <span className="text-[10px] font-semibold text-muted-foreground">Score</span>
                          </div>
                          <span className="text-xs font-bold text-foreground">{verificationData.score}/100</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2 gap-2">
                          <div className="flex items-center gap-2 shrink-0">
                            <Hash size={12} className="text-muted-foreground" />
                            <span className="text-[10px] font-semibold text-muted-foreground">TX Hash</span>
                          </div>
                          <span className="text-[10px] font-mono text-primary truncate">{verificationData.txHash.slice(0, 20)}...</span>
                        </div>
                      </div>
                      <div className="px-4 py-2 border-t border-border bg-muted/50">
                        <a
                          href={verificationData.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 text-xs font-bold text-secondary hover:text-primary transition-colors"
                        >
                          View on Arbiscan <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center flex-1 flex items-center justify-center">
                    <div className="bg-muted rounded-2xl p-6 border-2 border-dashed border-border w-full">
                      <Shield size={24} className="text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-muted-foreground text-xs font-medium">
                        No on-chain verification yet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </BlockWrapper>
          </div>

          {/* SMART RECOMMENDATIONS */}
          <div key="recommendations">
            <BlockWrapper title="Jobs">
              <div className="bg-card border border-border rounded-3xl p-5 shadow-xl h-full overflow-auto">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2 text-base">
                  <Sparkles className="text-primary" size={18} /> Smart Recommendations
                </h3>

                <div className="space-y-2 mb-4">
                  {scoreAlerts.slice(0, 3).map((alert, i) => (
                    <div key={`alert-${i}`} className={`flex items-start gap-2 p-2.5 rounded-xl text-xs border ${
                      alert.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      alert.type === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      <span className="shrink-0 mt-0.5">{alert.icon}</span>
                      <span className="leading-relaxed">{alert.text}</span>
                    </div>
                  ))}
                </div>

                {topJobMatches.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Briefcase size={12} /> Top Job Matches
                    </h4>
                    <div className="space-y-2">
                      {topJobMatches.slice(0, 4).map((job) => (
                        <button
                          key={job.id}
                          onClick={() => handleJobClick(job)}
                          className="w-full flex items-center gap-3 p-3 bg-muted rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group text-left"
                        >
                          <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black ${
                            job.matchResult.score >= 70 ? 'bg-emerald-100 text-emerald-700' :
                            job.matchResult.score >= 40 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {job.matchResult.score}%
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground font-bold text-xs group-hover:text-primary transition-colors truncate">{job.title}</p>
                            <p className="text-muted-foreground text-[10px] truncate">{job.company}</p>
                          </div>
                          <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </button>
                      ))}
                    </div>
                    <Link to="/jobs" className="block mt-3 text-center">
                      <span className="text-xs font-bold text-primary hover:underline">View all positions →</span>
                    </Link>
                  </div>
                )}
              </div>
            </BlockWrapper>
          </div>

          {/* CHOICE CV */}
          <div key="cv">
            <BlockWrapper title="CV">
              <div className="bg-card border border-border rounded-3xl p-5 shadow-xl h-full">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <FileText size={16} className="text-primary" /> CHOICE CV
                  </h3>
                </div>

                {!cv ? (
                  <div className="text-center py-6">
                    <div className="bg-muted p-3 rounded-full inline-flex mb-3">
                      <FileText size={24} className="text-muted-foreground/30" />
                    </div>
                    <p className="text-muted-foreground text-xs mb-3">Generate a verifiable CV from your credentials.</p>
                    <ChoiceButton onClick={handleGenerateCV} isLoading={isGeneratingCV} className="w-full text-sm">
                      <Sparkles size={14} className="mr-2" /> Generate CV
                    </ChoiceButton>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-muted rounded-xl p-3 border border-border">
                      <p className="text-foreground text-xs leading-relaxed line-clamp-3">{displayCV?.summary}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {displayCV?.skills.slice(0, 5).map((skill, i) => (
                        <span key={i} className="bg-foreground text-background px-2 py-0.5 rounded-lg text-[9px] font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <ChoiceButton size="sm" onClick={() => setCvPopupOpen(true)} className="flex-1 text-xs">
                        <Eye size={12} className="mr-1" /> View Full CV
                      </ChoiceButton>
                      <ChoiceButton variant="outline" size="sm" onClick={() => { setCv(null); setOptimizedCV(null); setCoverLetter(null); }} className="text-xs">
                        Redo
                      </ChoiceButton>
                    </div>
                  </div>
                )}
              </div>
            </BlockWrapper>
          </div>

          {/* REFERRAL SECTION */}
          <div key="referral">
            <BlockWrapper title="Invite">
              <div className="bg-card border border-border rounded-3xl p-5 shadow-xl h-full">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                    <Gift size={28} className="text-primary" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-base font-bold text-foreground mb-1">Invite Friends to CHOICE.love</h3>
                    <p className="text-muted-foreground text-xs">Share your affiliate link and grow the CHOICE community.</p>
                    <div className="flex items-center gap-4 mt-2 justify-center md:justify-start">
                      <div className="bg-muted rounded-lg px-3 py-1.5 border border-border">
                        <span className="text-[10px] text-muted-foreground">Friends Invited</span>
                        <span className="ml-2 text-sm font-bold text-foreground">{invitedCount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {score >= 50 ? (
                      affiliateLink ? (
                        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 border border-border">
                          <span className="text-[10px] font-mono text-primary truncate max-w-[140px]">{affiliateLink}</span>
                          <button onClick={() => { navigator.clipboard.writeText(affiliateLink); toast({ title: 'Copied!' }); }} className="p-1 hover:bg-primary/10 rounded">
                            <Copy size={12} className="text-primary" />
                          </button>
                        </div>
                      ) : (
                        <ChoiceButton size="sm" onClick={generateAffiliateLink} className="text-xs">
                          <Share2 size={12} className="mr-1" /> Create Link
                        </ChoiceButton>
                      )
                    ) : (
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground mb-1">Unlock at 50 points</p>
                        <div className="w-24 bg-muted rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(score / 50) * 100}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </BlockWrapper>
          </div>
        </GridLayout>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CV POPUP DIALOG                                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={cvPopupOpen} onOpenChange={setCvPopupOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={20} className="text-primary" /> CHOICE CV
              {optimizedCV && <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2">JD-Optimized</span>}
            </DialogTitle>
            <DialogDescription>Your verifiable, on-chain backed curriculum vitae.</DialogDescription>
          </DialogHeader>

          {displayCV && (
            <div className="mt-4 space-y-5">
              <div className="bg-muted p-5 rounded-2xl border border-border space-y-5">
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 border-b border-border pb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div> Summary
                    {optimizedCV && <span className="text-primary text-[9px] bg-primary/10 px-1.5 py-0.5 rounded ml-auto">JD-Optimized</span>}
                  </h4>
                  <p className="text-foreground leading-relaxed text-sm">{displayCV.summary}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 border-b border-border pb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div> Experience
                  </h4>
                  <div className="space-y-2">
                    {displayCV.experience.map((exp, i) => (
                      <div key={i} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-3 rounded-xl shadow-sm border border-border">
                        <div>
                          <div className="font-bold text-foreground text-sm">{exp.role}</div>
                          <div className="text-xs text-primary font-semibold">{exp.company}</div>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-1 rounded border border-border mt-1 md:mt-0">{exp.duration}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 border-b border-border pb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full"></div> Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {displayCV.skills.map((skill, i) => (
                      <span key={i} className="bg-foreground text-background px-2.5 py-1 rounded-lg text-xs font-bold shadow-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-secondary/5 to-primary/5 border border-border rounded-2xl p-5">
                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Target size={16} className="text-secondary" /> Optimize for Job Description
                </h4>
                <div className="flex gap-3">
                  <textarea
                    value={jobDescInput}
                    onChange={(e) => setJobDescInput(e.target.value)}
                    placeholder="Paste a job description here to tailor your CV..."
                    className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground resize-none h-20 outline-none focus:border-primary/40 transition-colors"
                  />
                  <div className="flex flex-col gap-2 shrink-0">
                    <ChoiceButton size="sm" onClick={handleOptimizeForJD} isLoading={isOptimizing} disabled={!jobDescInput.trim()} className="text-xs">
                      <FileCheck size={14} className="mr-1" /> Optimize
                    </ChoiceButton>
                    <ChoiceButton size="sm" variant="outline" onClick={() => handleGenerateCoverLetter()} isLoading={isGeneratingCover && !selectedJobForCover} className="text-xs">
                      <PenTool size={14} className="mr-1" /> Cover Letter
                    </ChoiceButton>
                  </div>
                </div>
                {optimizedCV && (
                  <p className="text-[10px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                    <CheckCircle size={10} /> CV optimized for the pasted job description
                  </p>
                )}
              </div>

              {coverLetter && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <PenTool size={14} className="text-accent" /> Generated Cover Letter
                      {selectedJobForCover && (
                        <span className="text-[10px] text-muted-foreground font-normal">for {selectedJobForCover.title}</span>
                      )}
                    </h4>
                    <div className="flex gap-2">
                      <button onClick={() => navigator.clipboard.writeText(coverLetter)} className="text-[10px] font-bold text-primary hover:underline">Copy</button>
                      <button onClick={() => setCoverLetter(null)} className="text-[10px] font-bold text-muted-foreground hover:text-destructive">Dismiss</button>
                    </div>
                  </div>
                  <pre className="text-foreground text-xs leading-relaxed whitespace-pre-wrap font-sans bg-muted p-4 rounded-xl border border-border max-h-48 overflow-y-auto">
                    {coverLetter}
                  </pre>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <ChoiceButton variant="outline" size="sm" onClick={() => alert("Downloading PDF...")}>
                  <Download size={14} className="mr-1" /> Download PDF
                </ChoiceButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* JOB POPUP DIALOG                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={jobPopupOpen} onOpenChange={setJobPopupOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedJobForPopup && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Briefcase size={20} className="text-primary" /> {selectedJobForPopup.title}
                </DialogTitle>
                <DialogDescription>{selectedJobForPopup.company} · {selectedJobForPopup.type} · {selectedJobForPopup.salary}</DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-5">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                  selectedJobForPopup.matchResult.score >= 70 ? 'bg-emerald-100 text-emerald-700' :
                  selectedJobForPopup.matchResult.score >= 40 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-600'
                }`}>
                  <Target size={14} />
                  {selectedJobForPopup.matchResult.score}% Match
                </div>

                <div className="bg-muted rounded-2xl p-5 border border-border">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Job Description</h4>
                  <p className="text-foreground text-sm leading-relaxed">{selectedJobForPopup.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedJobForPopup.requiredSkills.map((skill, i) => (
                      <span key={i} className="bg-foreground/10 text-foreground px-2 py-0.5 rounded-lg text-[10px] font-semibold">{skill}</span>
                    ))}
                  </div>
                </div>

                {!cv ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm mb-3">Generate your CV first to optimize for this role.</p>
                    <ChoiceButton onClick={async () => { await handleGenerateCV(); }} isLoading={isGeneratingCV}>
                      <Sparkles size={16} className="mr-2" /> Generate CV
                    </ChoiceButton>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <ChoiceButton size="sm" onClick={handleOptimizeForJob} isLoading={isOptimizing} className="flex-1">
                        <FileCheck size={14} className="mr-1" /> Optimize CV for this Role
                      </ChoiceButton>
                      <ChoiceButton size="sm" variant="outline" onClick={() => handleGenerateCoverLetter(selectedJobForPopup)} isLoading={isGeneratingCover} className="flex-1">
                        <PenTool size={14} className="mr-1" /> Generate Cover Letter
                      </ChoiceButton>
                    </div>

                    {optimizedCV && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-700">
                        <CheckCircle size={14} />
                        <span className="font-semibold">CV optimized for {selectedJobForPopup.title}</span>
                      </div>
                    )}

                    {coverLetter && selectedJobForCover?.id === selectedJobForPopup.id && (
                      <div className="bg-card border border-border rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                            <PenTool size={12} className="text-accent" /> Cover Letter
                          </h4>
                          <button onClick={() => navigator.clipboard.writeText(coverLetter)} className="text-[10px] font-bold text-primary hover:underline">Copy</button>
                        </div>
                        <pre className="text-foreground text-xs leading-relaxed whitespace-pre-wrap font-sans bg-muted p-3 rounded-xl border border-border max-h-40 overflow-y-auto">
                          {coverLetter}
                        </pre>
                      </div>
                    )}

                    <button onClick={() => { setCvPopupOpen(true); setJobPopupOpen(false); }} className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mx-auto">
                      <Eye size={12} /> View Full CV
                    </button>

                    <div className="pt-3 border-t border-border">
                      {appSent ? (
                        <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-5 py-3 text-sm font-bold">
                          <CheckCircle size={16} /> Application Sent Successfully!
                        </div>
                      ) : (
                        <ChoiceButton
                          className="w-full"
                          onClick={() => {
                            setIsSendingApp(true);
                            setTimeout(() => {
                              setIsSendingApp(false);
                              setAppSent(true);
                            }, 1500);
                          }}
                          isLoading={isSendingApp}
                        >
                          <Send size={16} className="mr-2" /> Send Application
                        </ChoiceButton>
                      )}
                      <p className="text-[10px] text-muted-foreground text-center mt-2">Your CHOICE CV and Trust Score will be securely shared.</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IdentityPage;
