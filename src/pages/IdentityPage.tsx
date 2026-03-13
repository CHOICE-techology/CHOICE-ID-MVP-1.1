import React, { useState, useMemo, useEffect } from 'react';

import { UserIdentity, GeneratedCV, Job } from '@/types';
import { mockGenerateCV, mockGenerateBio, generateReputationHash } from '@/services/cryptoService';
import { calculateReputationBreakdown } from '@/services/scoreEngine';
import { calculateJobMatch } from '@/services/jobMatchingService';
import { ALL_JOBS } from '@/data/jobsData';
import { ChoiceButton } from '@/components/ChoiceButton';

import { Link, useLocation } from 'react-router-dom';
import {
  Download, Edit2, Sparkles, FileText, Camera, CheckCircle, Info,
  TrendingUp, Lock, ExternalLink, Shield, Briefcase, Bell, FileCheck,
  PenTool, Target, ArrowRight, Clock, Hash, Award, Zap, Settings,
  ArrowLeft, X, Eye, Send, Gift, Copy, Share2
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { useWallet } from '@/contexts/WalletContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getChoiceBalance, getTransactionHistory, getRewardLabel, getRewardCategory, ChoiceTransaction } from '@/services/rewardService';
const IdentityPage: React.FC = () => {
  const {
    userIdentity: identity,
    address,
    isLoadingIdentity,
    createProfile,
    updateIdentity: onUpdateIdentity,
  } = useWallet();
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
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [affiliateLink, setAffiliateLink] = useState('');
  const [invitedCount] = useState(() => Math.floor(Math.random() * 5));
  const [choiceBalance, setChoiceBalance] = useState(0);
  const [recentTxs, setRecentTxs] = useState<ChoiceTransaction[]>([]);
  const [showAllTxs, setShowAllTxs] = useState(false);

  // Fetch CHOICE balance & transactions
  useEffect(() => {
    if (!identity?.address) return;
    const refresh = () => {
      getChoiceBalance(identity.address).then(setChoiceBalance);
      getTransactionHistory(identity.address).then(txs => setRecentTxs(txs.slice(0, 10)));
    };
    refresh();
    window.addEventListener('choice-rewards-updated', refresh);
    return () => window.removeEventListener('choice-rewards-updated', refresh);
  }, [identity?.address]);

  // Popup states
  const [cvPopupOpen, setCvPopupOpen] = useState(false);
  const [jobPopupOpen, setJobPopupOpen] = useState(false);
  const [selectedJobForPopup, setSelectedJobForPopup] = useState<(Job & { matchResult: { score: number; reason: string; matchingSkills: string[]; missingSkills: string[]; recommendations: string[] } }) | null>(null);

  const reputation = identity ? calculateReputationBreakdown(identity.credentials) : null;
  const score = reputation?.score ?? 0;
  const physical = reputation?.categories.physical ?? 0;
  const social = reputation?.categories.social ?? 0;
  const finance = reputation?.categories.finance ?? 0;
  const education = reputation?.categories.education ?? 0;

  const safePercent = (val: number, max: number) => {
    const result = (val / max) * 100;
    return isNaN(result) || !isFinite(result) ? 0 : Math.min(result, 100);
  };

  const getSafeDisplayDate = (value: unknown): string | null => {
    if (!value) return null;
    const parsedDate = new Date(value as string | number);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toLocaleString();
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
    if (s >= 30) return { label: 'Verified Identity', color: 'text-secondary' };
    return { label: 'New Entrant', color: 'text-foreground' };
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
      alerts.push({ icon: <Bell size={14} />, text: `Connect a wallet in Finance to add up to 10 Finance points and unlock DeFi job matches.`, type: 'warning' });
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
    // Priority: identity anchor data > navState > localStorage
    if (identity?.lastAnchorHash) {
      const mockTxHash = `0x${identity.lastAnchorHash.slice(2, 66) || 'a1b2c3d4e5f6'.repeat(5)}`;
      return {
        date: getSafeDisplayDate(identity.lastAnchorTimestamp),
        score,
        txHash: mockTxHash,
        explorerUrl: `https://etherscan.io/tx/${mockTxHash}`,
      };
    }
    if (navState?.verificationData) {
      return {
        date: getSafeDisplayDate(navState.verificationData.date),
        score,
        txHash: navState.verificationData.txHash,
        explorerUrl: `https://etherscan.io/tx/${navState.verificationData.txHash}`,
      };
    }
    // Fallback: last persisted verification from localStorage
    try {
      const stored = localStorage.getItem('choice_last_verification');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          date: getSafeDisplayDate(parsed.date),
          score,
          txHash: parsed.txHash,
          explorerUrl: `https://etherscan.io/tx/${parsed.txHash}`,
        };
      }
    } catch {}
    return null;
  }, [identity?.lastAnchorHash, identity?.lastAnchorTimestamp, score, navState]);

  const isVerificationPending = Boolean(
    verificationData && (!verificationData.explorerUrl || String(verificationData.txHash || '').startsWith('pending_'))
  );

  if (isLoadingIdentity && !address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <h2 className="text-2xl font-bold text-foreground">Loading your CHOICE ID...</h2>
        <p className="text-muted-foreground text-sm max-w-sm">Opening your local vault securely.</p>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="bg-muted p-6 rounded-full">
          <CheckCircle size={64} className="text-muted-foreground/30" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {address ? 'Wallet connected, profile missing.' : 'Connect your CHOICE ID to view your identity.'}
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          {address
            ? 'Create your guest profile to unlock Identity, Credentials, Jobs, and Lessons.'
            : 'It only takes a few seconds — here\'s how:'}
        </p>
        {address && (
          <ChoiceButton
            isLoading={isCreatingProfile}
            onClick={async () => {
              setIsCreatingProfile(true);
              try {
                await createProfile();
              } finally {
                setIsCreatingProfile(false);
              }
            }}
          >
            Create Profile
          </ChoiceButton>
        )}
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

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* BACK BUTTON (visible after verification)                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {verificationData && (
        <Link to="/verify" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/5 border border-primary/20 px-4 py-2 rounded-xl">
          <ArrowLeft size={16} /> Back to Verification
        </Link>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HERO: TRUST SCORE — SCOREBOARD (UNCHANGED)                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="rounded-[2.5rem] shadow-2xl overflow-hidden relative group transition-all duration-500 border border-slate-700/50">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-12 relative">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <CheckCircle size={400} className="text-primary" />
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-[120px] opacity-[0.07] pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="text-center md:text-left space-y-6">
              <div className="inline-flex items-center gap-2 border border-primary/30 bg-white/5 rounded-full px-4 py-1.5 backdrop-blur-md">
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-300">CHOICE Trust ID</span>
              </div>
              <div>
                <div className="flex items-baseline gap-3 justify-center md:justify-start">
                  <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter drop-shadow-xl">{score}</h1>
                  <span className="text-lg text-slate-400 font-bold mb-2">/100</span>
                </div>
                <h2 className={`text-xl md:text-3xl font-bold text-primary tracking-tight`}>{tier.label}</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto md:mx-0">
                Your score is a cryptographic aggregate of your digital and physical footprint. It proves your humanity and reputation without revealing sensitive data.
              </p>
              <div className="flex flex-col gap-2 max-w-xs mx-auto md:mx-0">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Next Tier Goal</span>
                  <span>{Math.min(score + 20, 100)} pts</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-primary to-secondary h-1.5 rounded-full shadow-glow-primary" style={{ width: `${score}%` }}></div>
                </div>
              </div>
            </div>

            <div className="h-[240px] md:h-[280px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid stroke="#475569" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#CBD5E1', fontSize: 11, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC', borderRadius: '12px' }}
                    itemStyle={{ color: '#00E5FF' }}
                    formatter={(value: number) => [`${Math.round(value)}%`, 'Capacity']}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 right-0 md:-right-4 text-[10px] text-primary font-mono bg-primary/20 border border-primary/30 px-2 py-1 rounded backdrop-blur-sm">
                Identity Vector v1.0
              </div>
            </div>
          </div>
        </div>

        <div className="bg-muted p-6 grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-border border-t border-border">
          <div className="text-center pt-2 md:pt-0">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Social</div>
            <div className="text-xl md:text-2xl font-black text-foreground">{social}<span className="text-sm text-muted-foreground font-medium">/40</span></div>
            <div className="text-[10px] text-blue-600 font-bold bg-blue-50 inline-block px-2 py-0.5 rounded-full mt-1">Influence</div>
          </div>
          <div className="text-center pt-2 md:pt-0">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Education</div>
            <div className="text-xl md:text-2xl font-black text-foreground">{education}<span className="text-sm text-muted-foreground font-medium">/30</span></div>
            <div className="text-[10px] text-purple-600 font-bold bg-purple-50 inline-block px-2 py-0.5 rounded-full mt-1">Skill Badges</div>
          </div>
          <div className="text-center pt-4 md:pt-0">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Real World</div>
            <div className="text-xl md:text-2xl font-black text-foreground">{physical}<span className="text-sm text-muted-foreground font-medium">/20</span></div>
            <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 inline-block px-2 py-0.5 rounded-full mt-1">Proof of Humanity</div>
          </div>
          <div className="text-center pt-4 md:pt-0">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Finance</div>
            <div className="text-xl md:text-2xl font-black text-foreground">{finance}<span className="text-sm text-muted-foreground font-medium">/10</span></div>
            <div className="text-[10px] text-amber-600 font-bold bg-amber-50 inline-block px-2 py-0.5 rounded-full mt-1">Chain Activity</div>
          </div>
        </div>
      </div>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* END SCOREBOARD                                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CHOICE BALANCE CARD                                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <Gift size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">CHOICE BALANCE</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Identity Fuel · Live</p>
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">{choiceBalance.toLocaleString()}</span>
          <span className="text-lg font-bold text-primary">CHOICE</span>
        </div>
        <p className="text-xs text-primary font-semibold mb-6">↗ +{choiceBalance} since last refresh</p>

        {/* Category Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {(() => {
            const idTotal = recentTxs.filter(tx => getRewardCategory(tx.type) === 'identity').reduce((s, tx) => s + tx.amount, 0);
            const eduTotal = recentTxs.filter(tx => getRewardCategory(tx.type) === 'education').reduce((s, tx) => s + tx.amount, 0);
            const comTotal = recentTxs.filter(tx => getRewardCategory(tx.type) === 'community').reduce((s, tx) => s + tx.amount, 0);
            const finTotal = recentTxs.filter(tx => getRewardCategory(tx.type) === 'finance').reduce((s, tx) => s + tx.amount, 0);
            const total = choiceBalance || 1;
            return [
              { label: 'Identity', amount: idTotal, pct: Math.round((idTotal / total) * 100), color: 'bg-primary' },
              { label: 'Education', amount: eduTotal, pct: Math.round((eduTotal / total) * 100), color: 'bg-purple-500' },
              { label: 'Community', amount: comTotal, pct: Math.round((comTotal / total) * 100), color: 'bg-amber-500' },
              { label: 'Finance', amount: finTotal, pct: Math.round((finTotal / total) * 100), color: 'bg-emerald-500' },
            ].map(cat => (
              <div key={cat.label} className="bg-muted rounded-xl p-3 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">⬡ {cat.label}</span>
                  <span className="text-[10px] text-muted-foreground">{cat.pct}%</span>
                </div>
                <span className="text-lg font-black text-foreground">+{cat.amount}</span>
                <div className="w-full bg-border rounded-full h-1 mt-2">
                  <div className={`${cat.color} h-1 rounded-full`} style={{ width: `${Math.min(cat.pct, 100)}%` }} />
                </div>
              </div>
            ));
          })()}
        </div>

        {/* Recent Transactions */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent Activity</span>
          <span className="text-[10px] text-primary font-bold">● Live</span>
        </div>
        <div className="space-y-2">
          {recentTxs.slice(0, showAllTxs ? 10 : 3).map(tx => (
            <div key={tx.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Gift size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{getRewardLabel(tx.type)}</p>
                  <p className="text-[10px] text-muted-foreground">{tx.reason.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-primary">+{tx.amount}</span>
                <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
        {recentTxs.length > 3 && (
          <button
            onClick={() => setShowAllTxs(!showAllTxs)}
            className="w-full mt-3 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted transition-colors uppercase tracking-wider"
          >
            {showAllTxs ? 'Show Less' : `View up to ${Math.min(recentTxs.length, 10)} transactions ▾`}
          </button>
        )}
      </div>

      {/* ── PROFILE + ON-CHAIN VERIFICATION ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* PROFILE CARD — larger, central */}
        <div className="lg:col-span-5">
          <div className="glass border-white/10 rounded-3xl p-8 md:p-10 shadow-xl flex flex-col items-center text-center relative overflow-hidden h-full group transition-all hover:bg-white/5">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent"></div>

            {/* Settings button */}
            <Link
              to="/profile/settings"
              className="absolute top-5 right-5 z-20 p-2 rounded-xl bg-muted/80 border border-border hover:bg-accent transition-colors backdrop-blur-sm"
              title="Edit Profile"
            >
              <Settings size={16} className="text-muted-foreground" />
            </Link>

            <div className="relative group mb-6 z-10">
              <div className="w-40 h-40 rounded-full overflow-hidden border-[6px] border-background shadow-2xl bg-muted flex items-center justify-center relative">
                {identity.avatar ? (
                  <img src={identity.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-bold text-muted-foreground/30">{identity.displayName?.charAt(0) || '?'}</span>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px] rounded-full">
                  <Camera size={28} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            <div className="w-full mb-5 relative z-10">
              {isEditing ? (
                <div className="flex gap-2 justify-center mb-2 items-center">
                  <input type="text" className="border-2 border-primary/20 focus:border-primary rounded-lg px-3 py-1 text-lg font-bold text-foreground w-full text-center outline-none bg-muted" defaultValue={identity.displayName} onChange={(e) => setNewName(e.target.value)} placeholder="Display Name" autoFocus />
                  <ChoiceButton size="sm" onClick={handleSaveProfile} className="shrink-0"><CheckCircle size={16} /></ChoiceButton>
                </div>
              ) : (
                <h2 className="text-2xl font-bold text-foreground mb-1 flex items-center justify-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
                  {identity.displayName || "Anonymous User"}
                  <Edit2 size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </h2>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-muted-foreground font-mono text-[10px] truncate max-w-[180px]">{identity.did}</p>
              </div>
            </div>

            {/* Tier badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-5 ${
              score >= 80 ? 'bg-primary/10 border-primary/20 text-primary' :
              score >= 60 ? 'bg-secondary/10 border-secondary/20 text-secondary' :
              'bg-muted border-border text-muted-foreground'
            }`}>
              <Award size={14} />
              <span className="text-xs font-bold">{tier.label}</span>
              <span className="text-xs font-mono">{score}/100</span>
            </div>

            {/* Bio */}
            <div className="bg-white/5 p-5 rounded-2xl text-muted-foreground text-sm border border-white/10 w-full relative">
              <span className="absolute -top-2 left-5 bg-background/80 backdrop-blur-sm px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider rounded">Bio</span>
              {identity.bio ? <p className="leading-relaxed text-sm">{identity.bio}</p> : <p className="italic text-muted-foreground/50 text-sm">No bio yet. Generate a CV to create one.</p>}
            </div>

            <Link to="/profile/settings" className="mt-5 text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <Settings size={12} /> Edit Profile & Personal Details
            </Link>
          </div>
        </div>

        {/* ON-CHAIN VERIFICATION — transaction-style */}
        <div className="lg:col-span-7">
          <div className="glass border-white/10 rounded-3xl shadow-xl overflow-hidden h-full flex flex-col transition-all hover:bg-white/5">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-5 md:p-6 border-b border-white/10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-xl">
                    <Shield size={20} className="text-primary" />
                  </div>
                   <div>
                    <h3 className="text-lg font-bold text-foreground">Proofs of Verification</h3>
                    <p className="text-muted-foreground text-xs">Your verified credentials and reputation summary.</p>
                  </div>
                </div>
                <Link to="/verify" className="shrink-0">
                  <ChoiceButton size="sm" className="shadow-lg hover:shadow-xl transition-all">
                    OPEN REQUEST <CheckCircle className="ml-1.5" size={14} />
                  </ChoiceButton>
                </Link>
              </div>
            </div>

            {/* Scoreboard Summary */}
            <div className="px-5 pt-5 md:px-6 md:pt-6">
              <div className="bg-muted rounded-2xl border border-border p-4 space-y-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Reputation Summary</h4>
                {[
                  { label: 'Trust Score', value: `${score}/100` },
                  { label: 'Social Score', value: `${social}/40` },
                  { label: 'Wallet Activity', value: `${finance}/10` },
                  { label: 'Courses Completed', value: `${education}/30` },
                  { label: 'Credentials Verified', value: `${identity.credentials.length}` },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">{row.label}</span>
                    <span className="text-xs font-bold text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
              {/* Short Bio */}
              <div className="mt-3 bg-muted rounded-2xl border border-border p-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Short Bio</span>
                <p className="text-sm text-foreground mt-1 leading-relaxed">
                  {identity.bio || 'No bio added yet.'}
                </p>
              </div>
            </div>

            {verificationData ? (
              <div className="p-5 md:p-6 flex-1 flex flex-col justify-center space-y-4">
                {/* Verification Successful banner */}
                {navState?.verificationSuccess && (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3.5">
                    <div className="bg-emerald-100 p-1.5 rounded-full">
                      <CheckCircle size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-800">Verification Successful</p>
                      <p className="text-xs text-emerald-600">Your reputation proof has been verified on-chain.</p>
                    </div>
                  </div>
                )}

                {/* Transaction-style record */}
                <div className="bg-muted rounded-2xl border border-border overflow-hidden">
                  <div className="border-b px-5 py-3 flex items-center gap-2 bg-emerald-500/10 border-emerald-500/20">
                    <CheckCircle size={14} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">Verified</span>
                    <span className="ml-auto text-[10px] font-mono text-emerald-600">Arbitrum Sepolia</span>
                  </div>
                  <div className="divide-y divide-border">
                    <div className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">Date</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{verificationData.date || 'Not available'}</span>
                    </div>
                    {!isVerificationPending && (
                      <div className="flex items-center justify-between px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Award size={14} className="text-muted-foreground" />
                          <span className="text-xs font-semibold text-muted-foreground">Anchored Score</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">{verificationData.score}<span className="text-muted-foreground font-normal">/100</span></span>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-5 py-3.5 gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <Hash size={14} className="text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">{isVerificationPending ? 'Request ID' : 'TX Hash'}</span>
                      </div>
                      <span className="text-xs font-mono text-primary truncate">
                        {verificationData.txHash.length > 10
                          ? `${verificationData.txHash.slice(0, 6)}...${verificationData.txHash.slice(-4)}`
                          : verificationData.txHash}
                      </span>
                    </div>
                  </div>
                  {!isVerificationPending && verificationData.explorerUrl && (
                    <div className="px-5 py-3.5 border-t border-border bg-muted/50">
                      <a
                        href={verificationData.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-sm font-bold text-secondary hover:text-primary transition-colors bg-secondary/10 hover:bg-secondary/15 px-4 py-2.5 rounded-xl w-full"
                      >
                        View Transaction <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 md:p-8 text-center flex-1 flex items-center justify-center">
                <div className="bg-primary/5 rounded-2xl p-8 border border-primary/20 w-full">
                  <Shield size={32} className="text-primary mx-auto mb-3" />
                  <p className="text-foreground text-sm font-semibold">
                    No manual verification request yet. Submit proofs first, then your request is reviewed before any on-chain anchor.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN GRID: Recommendations | CV + Invite ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* SMART RECOMMENDATIONS — left column */}
        <div className="lg:col-span-7">
          <div className="glass border-white/10 rounded-3xl p-6 md:p-8 shadow-xl h-full transition-all hover:bg-white/5">
            <h3 className="font-bold text-foreground mb-6 flex items-center gap-2 text-xl">
              <Sparkles className="text-primary" size={22} /> Smart Recommendations
            </h3>

            {/* Score improvement alerts */}
            <div className="space-y-2.5 mb-6">
              {scoreAlerts.slice(0, 4).map((alert, i) => (
                <div key={`alert-${i}`} className={`flex items-start gap-3 p-3.5 rounded-xl text-sm border ${
                  alert.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  alert.type === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                  <span className="shrink-0 mt-0.5">{alert.icon}</span>
                  <span className="leading-relaxed">{alert.text}</span>
                </div>
              ))}
            </div>

            {/* Job Match Suggestions */}
            {topJobMatches.length > 0 && (
              <div className="pt-5 border-t border-border">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Briefcase size={14} /> Top Job Matches
                </h4>
                <div className="space-y-3">
                  {topJobMatches.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => handleJobClick(job)}
                      className="w-full flex items-center gap-4 p-4 bg-muted rounded-2xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group text-left"
                    >
                      <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black ${
                        job.matchResult.score >= 70 ? 'bg-emerald-100 text-emerald-700' :
                        job.matchResult.score >= 40 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {job.matchResult.score}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-bold text-sm group-hover:text-primary transition-colors">{job.title}</p>
                        <p className="text-muted-foreground text-xs">{job.company} · {job.type}</p>
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
                <Link to="/jobs" className="block mt-4 text-center">
                  <span className="text-sm font-bold text-primary hover:underline">View all 500+ positions →</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CV + Invite Friends stacked */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          {/* CHOICE CV */}
          <div className="glass border-white/10 rounded-3xl p-6 shadow-xl transition-all hover:bg-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileText size={18} className="text-primary" /> CHOICE CV
              </h3>
            </div>

            {!cv ? (
              <div className="text-center py-8">
                <div className="bg-muted p-4 rounded-full inline-flex mb-4">
                  <FileText size={28} className="text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground text-sm mb-4">Generate a verifiable CV from your on-chain credentials.</p>
                <ChoiceButton onClick={handleGenerateCV} isLoading={isGeneratingCV} className="w-full">
                  <Sparkles size={16} className="mr-2" /> Generate CV
                </ChoiceButton>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted rounded-2xl p-4 border border-border">
                  <p className="text-foreground text-sm leading-relaxed line-clamp-3">{displayCV?.summary}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {displayCV?.skills.slice(0, 6).map((skill, i) => (
                    <span key={i} className="bg-foreground text-background px-2.5 py-1 rounded-lg text-[10px] font-bold">
                      {skill}
                    </span>
                  ))}
                  {(displayCV?.skills.length || 0) > 6 && (
                    <span className="text-[10px] text-muted-foreground font-medium px-2 py-1">+{(displayCV?.skills.length || 0) - 6} more</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <ChoiceButton size="sm" onClick={() => setCvPopupOpen(true)} className="flex-1">
                    <Eye size={14} className="mr-1" /> Open Full CV
                  </ChoiceButton>
                  <ChoiceButton variant="outline" size="sm" onClick={() => alert("Downloading PDF...")}>
                    <Download size={14} />
                  </ChoiceButton>
                  <ChoiceButton variant="outline" size="sm" onClick={() => { setCv(null); setOptimizedCV(null); setCoverLetter(null); }}>
                    Redo
                  </ChoiceButton>
                </div>
              </div>
            )}
          </div>

          {/* INVITE FRIENDS */}
          <div className="glass border-white/10 rounded-[2rem] p-6 shadow-xl flex-1 flex flex-col transition-all hover:bg-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                <Gift size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Invite Friends</h3>
                <p className="text-muted-foreground text-xs">Earn <span className="text-primary font-bold">◈ +25 CHOICE</span> when they reach 50 score</p>
              </div>
            </div>

            <div className="bg-muted rounded-xl px-4 py-3 border border-border mb-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Friends Invited</span>
              <p className="text-2xl font-black text-foreground">{invitedCount}</p>
            </div>

            <div className="mt-auto">
              {score >= 50 ? (
                affiliateLink ? (
                  <div className="bg-muted rounded-xl px-4 py-3 border border-border flex items-center gap-2">
                    <code className="text-xs text-foreground font-mono truncate flex-1">{affiliateLink}</code>
                    <button onClick={() => { navigator.clipboard.writeText(affiliateLink); toast({ title: 'Copied!', description: 'Affiliate link copied.' }); }} className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors shrink-0">
                      <Copy size={14} className="text-primary" />
                    </button>
                  </div>
                ) : (
                  <ChoiceButton onClick={() => { const code = Math.random().toString(36).substring(2, 10).toUpperCase(); setAffiliateLink(`https://CHOICE.love/join?ref=${code}`); }} className="w-full">
                    <Share2 size={16} className="mr-2" /> Create Invite Link
                  </ChoiceButton>
                )
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground font-semibold mb-2">Reach 50+ points to unlock</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">{score}/50</span>
                    <div className="flex-1 bg-border rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min((score / 50) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CV POPUP DIALOG                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={cvPopupOpen} onOpenChange={setCvPopupOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={20} className="text-primary" /> Professional CHOICE CV
            </DialogTitle>
            <DialogDescription>Your aggregated proof of on-chain and off-chain reputation.</DialogDescription>
          </DialogHeader>

          {displayCV && (
            <div className="space-y-6 mt-4">
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

              {/* JD Optimizer */}
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

              {/* Cover Letter Output */}
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
      {/* JOB POPUP DIALOG — shows JD + CV tools                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={jobPopupOpen} onOpenChange={setJobPopupOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedJobForPopup && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Briefcase size={20} className="text-primary" /> {selectedJobForPopup.title}
                </DialogTitle>
                <DialogDescription>{selectedJobForPopup.company} · {selectedJobForPopup.type}</DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-5">
                {/* Match score */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                  selectedJobForPopup.matchResult.score >= 70 ? 'bg-emerald-100 text-emerald-700' :
                  selectedJobForPopup.matchResult.score >= 40 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-600'
                }`}>
                  <Target size={14} />
                  {selectedJobForPopup.matchResult.score}% Match
                </div>

                {/* Job Description */}
                <div className="bg-muted rounded-2xl p-5 border border-border">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Job Description</h4>
                  <p className="text-foreground text-sm leading-relaxed">{selectedJobForPopup.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedJobForPopup.requiredSkills.map((skill, i) => (
                      <span key={i} className="bg-foreground/10 text-foreground px-2 py-0.5 rounded-lg text-[10px] font-semibold">{skill}</span>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
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

                    {/* Send Application Button */}
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
