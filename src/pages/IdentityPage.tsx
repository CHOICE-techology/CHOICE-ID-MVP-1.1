import React, { useState, useMemo } from 'react';
import { UserIdentity, GeneratedCV, Job } from '@/types';
import { mockGenerateCV, mockGenerateBio, generateReputationHash } from '@/services/cryptoService';
import { calculateReputation } from '@/services/reputationEngine';
import { calculateJobMatch } from '@/services/jobMatchingService';
import { ALL_JOBS } from '@/data/jobsData';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Link } from 'react-router-dom';
import {
  Download, Edit2, Sparkles, FileText, Camera, CheckCircle, Info,
  TrendingUp, Lock, ExternalLink, Shield, Briefcase, Bell, FileCheck,
  PenTool, Target, ArrowRight, Clock, Hash, Award, Zap
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { useWallet } from '@/contexts/WalletContext';

const IdentityPage: React.FC = () => {
  const { userIdentity: identity, updateIdentity: onUpdateIdentity } = useWallet();
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

  const reputation = identity ? calculateReputation(identity.credentials) : null;
  const score = reputation.score;
  const { physical, social, finance, education } = reputation.breakdown.categories;

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

  // Top job matches for recommendations
  const topJobMatches = useMemo(() => {
    if (!identity) return [];
    const matched = ALL_JOBS.map(job => ({
      ...job,
      matchResult: calculateJobMatch(job, identity),
    }));
    return matched
      .sort((a, b) => b.matchResult.score - a.matchResult.score)
      .slice(0, 3);
  }, [identity]);

  // Score improvement alerts
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
    return alerts;
  }, [score, social, education, finance]);

  // On-chain verification state
  const verificationData = useMemo(() => {
    if (!identity.lastAnchorHash) return null;
    const mockTxHash = `0x${identity.lastAnchorHash?.slice(2, 66) || 'a1b2c3d4e5f6'.repeat(5)}`;
    return {
      date: identity.lastAnchorTimestamp ? new Date(identity.lastAnchorTimestamp).toLocaleString() : null,
      score: identity.reputationScore,
      txHash: mockTxHash,
      explorerUrl: `https://sepolia.arbiscan.io/tx/${mockTxHash}`,
    };
  }, [identity.lastAnchorHash, identity.lastAnchorTimestamp, identity.reputationScore]);

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
      // Simulate JD-optimized CV by reordering skills based on JD keywords
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

  const displayCV = optimizedCV || cv;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HERO: TRUST SCORE — SCOREBOARD (UNCHANGED)                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="bg-[#020617] p-6 md:p-12 relative">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <CheckCircle size={400} className="text-white" />
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="text-center md:text-left space-y-6">
              <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 rounded-full px-4 py-1.5 backdrop-blur-md">
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-300">CHOICE Trust ID</span>
              </div>
              <div>
                <div className="flex items-baseline gap-3 justify-center md:justify-start">
                  <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter drop-shadow-xl">{score}</h1>
                  <span className="text-lg text-slate-500 font-bold mb-2">/100</span>
                </div>
                <h2 className={`text-xl md:text-3xl font-bold ${tier.color} tracking-tight`}>{tier.label}</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto md:mx-0">
                Your score is a cryptographic aggregate of your digital and physical footprint. It proves your humanity and reputation without revealing sensitive data.
              </p>
              <div className="flex flex-col gap-2 max-w-xs mx-auto md:mx-0">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Next Tier Goal</span>
                  <span>{Math.min(score + 20, 100)} pts</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-primary to-secondary h-1.5 rounded-full shadow-glow-primary" style={{ width: `${score}%` }}></div>
                </div>
              </div>
            </div>

            <div className="h-[240px] md:h-[280px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="value" stroke="#00E5FF" strokeWidth={3} fill="#00E5FF" fillOpacity={0.2} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC', borderRadius: '12px' }}
                    itemStyle={{ color: '#00E5FF' }}
                    formatter={(value: number) => [`${Math.round(value)}%`, 'Capacity']}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 right-0 md:-right-4 text-[10px] text-primary font-mono bg-primary/10 border border-primary/20 px-2 py-1 rounded backdrop-blur-sm">
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

      {/* ── VERIFY PROOFS ON-CHAIN ── */}
      <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-6 md:p-8 border-b border-border">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl">
                <Shield size={22} className="text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Verify Proofs On-Chain</h3>
                <p className="text-muted-foreground text-sm">Anchor your reputation hash to Arbitrum for public verification.</p>
              </div>
            </div>
            <Link to="/verify" className="shrink-0">
              <ChoiceButton className="px-6 shadow-lg hover:shadow-xl transition-all">
                VERIFY NOW <CheckCircle className="ml-2" size={16} />
              </ChoiceButton>
            </Link>
          </div>
        </div>

        {verificationData ? (
          <div className="p-6 md:p-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-muted rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} className="text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Verification Date</span>
                </div>
                <p className="text-foreground font-semibold text-sm">{verificationData.date}</p>
              </div>
              <div className="bg-muted rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={14} className="text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Anchored Score</span>
                </div>
                <p className="text-foreground font-bold text-lg">{verificationData.score}<span className="text-muted-foreground text-sm font-medium">/100</span></p>
              </div>
              <div className="bg-muted rounded-2xl p-4 border border-border sm:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Hash size={14} className="text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Transaction Hash</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-primary font-mono text-xs truncate flex-1">{verificationData.txHash}</p>
                  <a
                    href={verificationData.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary transition-colors bg-secondary/10 px-3 py-1.5 rounded-lg"
                  >
                    Arbiscan <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
              <CheckCircle size={14} />
              <span className="font-semibold">Proof anchored on Arbitrum Sepolia — independently verifiable by anyone.</span>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8 text-center">
            <div className="bg-muted rounded-2xl p-8 border-2 border-dashed border-border">
              <Shield size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">
                No on-chain verification yet. Anchor your reputation to create an immutable, publicly verifiable proof.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN GRID: Profile + Recommendations | CV ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN: Profile + Dynamic Recommendations */}
        <div className="lg:col-span-4 space-y-6">

          {/* Profile Card */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-muted to-transparent"></div>
            <div className="relative group mb-5 z-10">
              <div className="w-32 h-32 rounded-full overflow-hidden border-[5px] border-background shadow-xl bg-muted flex items-center justify-center relative">
                {identity.avatar ? (
                  <img src={identity.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-muted-foreground/30">{identity.displayName?.charAt(0) || '?'}</span>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-dark/50 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]">
                  <Camera size={24} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            <div className="w-full mb-4 relative z-10">
              {isEditing ? (
                <div className="flex gap-2 justify-center mb-2 items-center">
                  <input type="text" className="border-2 border-primary/20 focus:border-primary rounded-lg px-3 py-1 text-lg font-bold text-foreground w-full text-center outline-none bg-muted" defaultValue={identity.displayName} onChange={(e) => setNewName(e.target.value)} placeholder="Display Name" autoFocus />
                  <ChoiceButton size="sm" onClick={handleSaveProfile} className="shrink-0"><CheckCircle size={16} /></ChoiceButton>
                </div>
              ) : (
                <h2 className="text-xl font-bold text-foreground mb-1 flex items-center justify-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
                  {identity.displayName || "Anonymous User"}
                  <Edit2 size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </h2>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-muted-foreground font-mono text-[10px] truncate max-w-[150px]">{identity.did}</p>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-2xl text-muted-foreground text-sm border border-border w-full relative">
              <span className="absolute -top-2 left-5 bg-card px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bio</span>
              {identity.bio ? <p className="leading-relaxed text-xs">{identity.bio}</p> : <p className="italic text-muted-foreground/50 text-xs">No bio yet. Generate a CV to create one.</p>}
            </div>
          </div>

          {/* Dynamic Recommendations */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xl">
            <h3 className="font-bold text-foreground mb-5 flex items-center gap-2 text-base">
              <Sparkles className="text-primary" size={18} /> Smart Recommendations
            </h3>

            <div className="space-y-3">
              {/* Score alerts */}
              {scoreAlerts.map((alert, i) => (
                <div key={`alert-${i}`} className={`flex items-start gap-2.5 p-3 rounded-xl text-xs border ${
                  alert.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  alert.type === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                  <span className="shrink-0 mt-0.5">{alert.icon}</span>
                  <span className="leading-relaxed">{alert.text}</span>
                </div>
              ))}

              {/* Category-specific recommendations */}
              {physical === 0 && (
                <div className="flex items-start gap-2.5 p-3 bg-red-50 rounded-xl text-xs text-red-600 border border-red-100">
                  <Lock size={14} className="shrink-0 mt-0.5" />
                  <span>Add a Diploma or ID to unlock 20+ points and "Real World" badge.</span>
                </div>
              )}
              {social < 30 && (
                <div className="flex items-start gap-2.5 p-3 bg-blue-50 rounded-xl text-xs text-blue-600 border border-blue-100">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <span>Link more social accounts (GitHub, X) to max out Social Score.</span>
                </div>
              )}
              {education === 0 && (
                <div className="flex items-start gap-2.5 p-3 bg-purple-50 rounded-xl text-xs text-purple-600 border border-purple-100">
                  <TrendingUp size={14} className="shrink-0 mt-0.5" />
                  <span>Complete "Web3 Basics" course to earn +5 Education points.</span>
                </div>
              )}
            </div>

            {/* Job Match Suggestions */}
            {topJobMatches.length > 0 && (
              <div className="mt-5 pt-5 border-t border-border">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase size={12} /> Top Job Matches
                </h4>
                <div className="space-y-2.5">
                  {topJobMatches.map((job) => (
                    <Link
                      key={job.id}
                      to="/jobs"
                      className="flex items-center gap-3 p-3 bg-muted rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-semibold text-xs truncate group-hover:text-primary transition-colors">{job.title}</p>
                        <p className="text-muted-foreground text-[10px] truncate">{job.company}</p>
                      </div>
                      <div className={`shrink-0 text-xs font-bold px-2 py-1 rounded-lg ${
                        job.matchResult.score >= 70 ? 'bg-emerald-100 text-emerald-700' :
                        job.matchResult.score >= 40 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {job.matchResult.score}%
                      </div>
                      <ArrowRight size={12} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
                <Link to="/jobs" className="block mt-3 text-center">
                  <span className="text-xs font-bold text-primary hover:underline">View all 500+ positions →</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Professional CHOICE CV */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl flex-1 relative overflow-hidden flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 relative z-10 gap-4">
              <div>
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <FileText size={20} className="text-primary" /> Professional CHOICE CV
                </h3>
                <p className="text-muted-foreground text-xs mt-1">Aggregated proof of your on-chain and off-chain reputation.</p>
              </div>
              {!cv ? (
                <ChoiceButton onClick={handleGenerateCV} isLoading={isGeneratingCV} className="shrink-0">
                  <Sparkles size={16} className="mr-2" /> Generate CV
                </ChoiceButton>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <ChoiceButton variant="outline" onClick={() => { setCv(null); setOptimizedCV(null); setCoverLetter(null); }} size="sm">Regenerate</ChoiceButton>
                  <ChoiceButton variant="secondary" onClick={() => alert("Downloading PDF...")} size="sm">
                    <Download size={14} className="mr-1" /> PDF
                  </ChoiceButton>
                </div>
              )}
            </div>

            {!cv ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-border rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="bg-card p-4 rounded-full shadow-sm mb-4">
                  <FileText size={36} className="text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground font-medium max-w-sm mb-4 leading-relaxed text-sm">
                  Generate a verifiable CV that combines your Wallet History, Education Badges, and Real-World documents.
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in relative z-10">
                {/* CV Content */}
                <div className="bg-muted p-6 rounded-2xl border border-border shadow-inner space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 border-b border-border pb-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div> Summary
                      {optimizedCV && <span className="text-primary text-[9px] bg-primary/10 px-1.5 py-0.5 rounded ml-auto">JD-Optimized</span>}
                    </h4>
                    <p className="text-foreground leading-relaxed text-sm">{displayCV?.summary}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 border-b border-border pb-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div> Experience
                    </h4>
                    <div className="space-y-3">
                      {displayCV?.experience.map((exp, i) => (
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
                      {displayCV?.skills.map((skill, i) => (
                        <span key={i} className="bg-dark text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── JD Optimizer ── */}
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
                      <ChoiceButton
                        size="sm"
                        onClick={handleOptimizeForJD}
                        isLoading={isOptimizing}
                        disabled={!jobDescInput.trim()}
                        className="text-xs"
                      >
                        <FileCheck size={14} className="mr-1" /> Optimize
                      </ChoiceButton>
                      <ChoiceButton
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateCoverLetter()}
                        isLoading={isGeneratingCover && !selectedJobForCover}
                        className="text-xs"
                      >
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

                {/* ── Quick Cover Letter from Job Matches ── */}
                {topJobMatches.length > 0 && !coverLetter && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quick cover letter for:</span>
                    {topJobMatches.slice(0, 2).map(job => (
                      <button
                        key={job.id}
                        onClick={() => handleGenerateCoverLetter(job)}
                        className="text-[10px] font-semibold text-secondary bg-secondary/10 px-3 py-1.5 rounded-lg border border-secondary/20 hover:bg-secondary/20 transition-colors"
                      >
                        {job.title} @ {job.company}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Cover Letter Output ── */}
                {coverLetter && (
                  <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <PenTool size={14} className="text-accent" /> Generated Cover Letter
                        {selectedJobForCover && (
                          <span className="text-[10px] text-muted-foreground font-normal">
                            for {selectedJobForCover.title}
                          </span>
                        )}
                      </h4>
                      <div className="flex gap-2">
                        <button onClick={() => navigator.clipboard.writeText(coverLetter)} className="text-[10px] font-bold text-primary hover:underline">Copy</button>
                        <button onClick={() => setCoverLetter(null)} className="text-[10px] font-bold text-muted-foreground hover:text-destructive">Dismiss</button>
                      </div>
                    </div>
                    <pre className="text-foreground text-xs leading-relaxed whitespace-pre-wrap font-sans bg-muted p-4 rounded-xl border border-border max-h-64 overflow-y-auto">
                      {coverLetter}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityPage;
