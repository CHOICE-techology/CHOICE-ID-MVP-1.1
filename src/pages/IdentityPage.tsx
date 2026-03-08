import React, { useState } from 'react';
import { UserIdentity, GeneratedCV } from '@/types';
import { mockGenerateCV, mockGenerateBio } from '@/services/cryptoService';
import { calculateReputation } from '@/services/reputationEngine';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Link } from 'react-router-dom';
import { Download, Edit2, Sparkles, FileText, Camera, CheckCircle, Info, TrendingUp, Lock } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { useWallet } from '@/contexts/WalletContext';

const IdentityPage: React.FC = () => {
  const { userIdentity: identity, updateIdentity: onUpdateIdentity } = useWallet();
  const [cv, setCv] = useState<GeneratedCV | null>(null);
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');

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

  const reputation = calculateReputation(identity.credentials);
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

  const handleGenerateCV = async () => {
    setIsGeneratingCV(true);
    try {
      const generated = await mockGenerateCV(identity);
      setCv(generated);
      if (!identity.bio) {
        const newBio = await mockGenerateBio(identity);
        onUpdateIdentity({ ...identity, bio: newBio });
      }
    } catch (e) { console.error(e); }
    finally { setIsGeneratingCV(false); }
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

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* HERO: TRUST SCORE */}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-muted to-transparent"></div>
            <div className="relative group mb-6 z-10">
              <div className="w-36 h-36 rounded-full overflow-hidden border-[6px] border-background shadow-xl bg-muted flex items-center justify-center relative">
                {identity.avatar ? (
                  <img src={identity.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-bold text-muted-foreground/30">{identity.displayName?.charAt(0) || '?'}</span>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-dark/50 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]">
                  <Camera size={28} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            <div className="w-full mb-6 relative z-10">
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-muted-foreground font-mono text-[10px] truncate max-w-[150px]">{identity.did}</p>
              </div>
            </div>

            <div className="bg-muted p-5 rounded-2xl text-muted-foreground text-sm border border-border w-full relative">
              <span className="absolute -top-2 left-6 bg-card px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bio</span>
              {identity.bio ? <p className="leading-relaxed">{identity.bio}</p> : <p className="italic text-muted-foreground/50">No professional bio generated yet. Create a CV to generate one.</p>}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
            <h3 className="font-bold text-foreground mb-6 flex items-center gap-2 text-lg">
              <Sparkles className="text-primary" size={20} /> Recommendations
            </h3>
            <div className="space-y-4">
              {physical === 0 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl text-xs text-red-600 border border-red-100">
                  <Lock size={16} className="shrink-0 mt-0.5" />
                  <span>Add a Diploma or ID to unlock 20+ points and "Real World" badge.</span>
                </div>
              )}
              {social < 30 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl text-xs text-blue-600 border border-blue-100">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <span>Link more social accounts (GitHub, X) to max out Social Score.</span>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl text-xs text-purple-600 border border-purple-100">
                <TrendingUp size={16} className="shrink-0 mt-0.5" />
                <span>Complete "Web3 Basics" course to earn +5 Education points.</span>
              </div>
            </div>
          </div>
        </div>

        {/* CV Section */}
        <div className="lg:col-span-8 space-y-8 flex flex-col">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-xl flex-1 relative overflow-hidden flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 gap-4">
              <div>
                <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">Professional CHOICE CV</h3>
                <p className="text-muted-foreground text-sm mt-1">Aggregated proof of your on-chain and off-chain reputation.</p>
              </div>
              {!cv ? (
                <ChoiceButton onClick={handleGenerateCV} isLoading={isGeneratingCV} className="shrink-0">
                  <Sparkles size={16} className="mr-2" /> Generate CV
                </ChoiceButton>
              ) : (
                <div className="flex gap-2">
                  <ChoiceButton variant="outline" onClick={() => setCv(null)} size="sm">Regenerate</ChoiceButton>
                  <ChoiceButton variant="secondary" onClick={() => alert("Downloading PDF...")} size="sm">
                    <Download size={16} className="mr-2" /> PDF
                  </ChoiceButton>
                </div>
              )}
            </div>

            {!cv ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="bg-card p-4 rounded-full shadow-sm mb-4">
                  <FileText size={40} className="text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground font-medium max-w-sm mb-4 leading-relaxed">
                  Generate a verifiable CV that combines your Wallet History, Education Badges, and Real-World documents.
                </p>
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in relative z-10 bg-muted p-8 rounded-2xl border border-border shadow-inner">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 border-b border-border pb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div> Summary
                  </h4>
                  <p className="text-foreground leading-relaxed text-lg font-medium">{cv.summary}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 border-b border-border pb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-secondary rounded-full"></div> Experience
                  </h4>
                  <div className="space-y-4">
                    {cv.experience.map((exp, i) => (
                      <div key={i} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-4 rounded-xl shadow-sm border border-border">
                        <div>
                          <div className="font-bold text-foreground text-lg">{exp.role}</div>
                          <div className="text-sm text-primary font-semibold">{exp.company}</div>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1 rounded border border-border mt-2 md:mt-0">{exp.duration}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 border-b border-border pb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full"></div> Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {cv.skills.map((skill, i) => (
                      <span key={i} className="bg-dark text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md hover:scale-105 transition-transform cursor-default">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Verify CTA */}
          <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-glow-primary">
            <div className="text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">Verify Proofs On-Chain</h3>
              <p className="text-muted-foreground text-base md:text-lg">Anchor your reputation hash to Arbitrum for public verification.</p>
            </div>
            <Link to="/verify" className="shrink-0">
              <ChoiceButton size="lg" className="px-10 py-4 text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                VERIFY NOW <CheckCircle className="ml-3" />
              </ChoiceButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityPage;
