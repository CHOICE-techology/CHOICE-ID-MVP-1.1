import React, { useState, useEffect, useMemo } from 'react';
import { Job, JobMatchResult, GeneratedCV } from '@/types';
import { calculateJobMatch } from '@/services/jobMatchingService';
import { mockGenerateCV } from '@/services/cryptoService';
import { ChoiceButton } from '@/components/ChoiceButton';
import {
  Zap,
  Star,
  MapPin,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Lock,
  Send,
  FileText,
  Target,
  Sparkles,
  PenTool,
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useChoiceStore } from '@/store/useChoiceStore';
import { ALL_JOBS } from '@/data/jobsData';
import { calculateIdentityScore } from '@/services/scoreEngine';
import { getChoiceBalance } from '@/services/rewardService';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 15;
const JOB_APPLICATIONS_STORAGE_KEY = 'choice_job_applications_v1';

type JobWithMatch = Job & { matchResult?: JobMatchResult };
type ApplyStep = 'description' | 'cv' | 'optimize' | 'cover' | 'preview' | 'sent';

const APPLY_STEPS: Exclude<ApplyStep, 'sent'>[] = ['description', 'cv', 'optimize', 'cover', 'preview'];

const STEP_LABELS: Record<ApplyStep, string> = {
  description: 'Description',
  cv: 'Generate CV',
  optimize: 'Optimize',
  cover: 'Cover Letter',
  preview: 'Full CV Preview',
  sent: 'Sent',
};

const readAppliedJobIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(JOB_APPLICATIONS_STORAGE_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((id) => typeof id === 'string')) : new Set<string>();
  } catch {
    return new Set<string>();
  }
};

const persistAppliedJobIds = (ids: Set<string>) => {
  localStorage.setItem(JOB_APPLICATIONS_STORAGE_KEY, JSON.stringify([...ids]));
};

const JobsPage: React.FC = () => {
  const { userIdentity: identity, isConnected } = useWallet();
  const { setWalletModalOpen } = useChoiceStore();
  const { toast } = useToast();

  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMatching, setIsMatching] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const [selectedJob, setSelectedJob] = useState<JobWithMatch | null>(null);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [applyStep, setApplyStep] = useState<ApplyStep>('description');

  const [choiceBalance, setChoiceBalance] = useState(0);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(() => readAppliedJobIds());

  const [generatedCV, setGeneratedCV] = useState<GeneratedCV | null>(null);
  const [optimizedCV, setOptimizedCV] = useState<GeneratedCV | null>(null);
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [jobDescriptionInput, setJobDescriptionInput] = useState('');

  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [isOptimizingCV, setIsOptimizingCV] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isSendingApp, setIsSendingApp] = useState(false);

  const score = identity ? calculateIdentityScore(identity.credentials) : 0;

  useEffect(() => {
    if (!identity?.address) {
      setChoiceBalance(0);
      return;
    }

    const refresh = () => {
      getChoiceBalance(identity.address).then((b) => setChoiceBalance(b));
    };

    refresh();
    window.addEventListener('choice-rewards-updated', refresh);
    return () => window.removeEventListener('choice-rewards-updated', refresh);
  }, [identity?.address]);

  useEffect(() => {
    setIsMatching(true);
    const t = setTimeout(() => setIsMatching(false), 800);
    return () => clearTimeout(t);
  }, [identity, filterType]);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filterType, searchQuery]);

  const jobs = useMemo((): JobWithMatch[] => {
    let filtered = ALL_JOBS.filter((job) => filterType === 'All' || job.type === filterType);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q)
      );
    }

    return filtered
      .map((job) => {
        const matchResult = identity ? calculateJobMatch(job, identity) : undefined;
        return {
          ...job,
          matchScore: matchResult?.score || 0,
          matchReason: matchResult?.reason || '',
          matchResult,
        };
      })
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [identity, filterType, searchQuery]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: ALL_JOBS.length };
    ALL_JOBS.forEach((j) => {
      counts[j.type] = (counts[j.type] || 0) + 1;
    });
    return counts;
  }, []);

  const displayedCV = optimizedCV || generatedCV;

  const resetApplyFlow = () => {
    setApplyStep('description');
    setGeneratedCV(null);
    setOptimizedCV(null);
    setCoverLetter('');
    setJobDescriptionInput('');
    setIsGeneratingCV(false);
    setIsOptimizingCV(false);
    setIsGeneratingCover(false);
    setIsSendingApp(false);
  };

  const handleDialogChange = (open: boolean) => {
    setJobDialogOpen(open);
    if (!open) {
      setSelectedJob(null);
      resetApplyFlow();
    }
  };

  const handleApply = (job: JobWithMatch) => {
    if (!isConnected) {
      setWalletModalOpen(true);
      return;
    }

    if (!identity) return;

    if (appliedJobIds.has(job.id)) {
      toast({ title: 'Already Applied', description: 'You already submitted this application.' });
      return;
    }

    const matchResult = job.matchResult || {
      score: job.matchScore || 0,
      reason: job.matchReason || '',
      matchingSkills: [],
      missingSkills: [],
      recommendations: [],
    };

    setSelectedJob({ ...job, matchResult });
    setApplyStep('description');
    setJobDescriptionInput(job.description);
    setGeneratedCV(null);
    setOptimizedCV(null);
    setCoverLetter('');
    setJobDialogOpen(true);
  };

  const handleGenerateCV = async () => {
    if (!identity) return;

    setIsGeneratingCV(true);
    try {
      const cv = await mockGenerateCV(identity);
      setGeneratedCV(cv);
    } catch {
      toast({ title: 'Error', description: 'Failed to generate CV.', variant: 'destructive' });
    } finally {
      setIsGeneratingCV(false);
    }
  };

  const handleOptimizeCV = async () => {
    if (!generatedCV || !jobDescriptionInput.trim() || !selectedJob) return;

    setIsOptimizingCV(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const jdLower = jobDescriptionInput.toLowerCase();
      const prioritizedSkills = [...generatedCV.skills].sort((a, b) => {
        const aMatch = jdLower.includes(a.toLowerCase()) ? -1 : 1;
        const bMatch = jdLower.includes(b.toLowerCase()) ? -1 : 1;
        return aMatch - bMatch;
      });

      setOptimizedCV({
        ...generatedCV,
        summary: `Tailored for ${selectedJob.title} at ${selectedJob.company}. ${generatedCV.summary}`,
        skills: prioritizedSkills,
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to optimize CV.', variant: 'destructive' });
    } finally {
      setIsOptimizingCV(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!selectedJob || !identity || !displayedCV) return;

    setIsGeneratingCover(true);
    try {
      await new Promise((r) => setTimeout(r, 1400));
      const topSkills = displayedCV.skills.slice(0, 5).join(', ');

      setCoverLetter(`Dear Hiring Team at ${selectedJob.company},\n\nI am excited to apply for the ${selectedJob.title} role. Based on my verified CHOICE ID profile, I bring proven strengths in ${topSkills}.\n\nMy credentials and reputation score (${score}/100) reflect consistent contribution across education, social reputation, and on-chain activity. I am confident I can add impact quickly in this position.\n\nThank you for your consideration.\n\nBest regards,\n${identity.displayName || 'CHOICE ID Candidate'}`);
    } catch {
      toast({ title: 'Error', description: 'Failed to generate cover letter.', variant: 'destructive' });
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleSendApplication = async () => {
    if (!selectedJob || !identity) return;

    setIsSendingApp(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const updated = new Set(appliedJobIds);
      updated.add(selectedJob.id);
      setAppliedJobIds(updated);
      persistAppliedJobIds(updated);
      setApplyStep('sent');

      toast({
        title: 'Application Sent!',
        description: `Your CHOICE ID profile was sent to ${selectedJob.company}.`,
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to send application.', variant: 'destructive' });
    } finally {
      setIsSendingApp(false);
    }
  };

  const getMatchColor = (matchScore: number) => {
    if (matchScore >= 85) return { border: 'border-emerald-500', text: 'text-emerald-600' };
    if (matchScore >= 70) return { border: 'border-sky-500', text: 'text-sky-600' };
    if (matchScore >= 50) return { border: 'border-amber-500', text: 'text-amber-600' };
    return { border: 'border-border', text: 'text-muted-foreground' };
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">Jobs, Gigs & Collabs</h1>
          <p className="text-muted-foreground text-lg">
            AI-matched opportunities based on your Verified CHOICE ID.{' '}
            <strong className="text-foreground">{ALL_JOBS.length} roles</strong> available.
          </p>
        </div>
      </header>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search jobs by title, company, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl glass border-white/10 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {['All', 'Full-time', 'Contract', 'DAO', 'Collaboration', 'Gig'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filterType === type
                ? 'bg-primary text-primary-foreground shadow-glow-primary'
                : 'glass border-white/10 text-muted-foreground hover:bg-white/5'
            }`}
          >
            {type} <span className="text-xs opacity-70 ml-1">({typeCounts[type] || 0})</span>
          </button>
        ))}
      </div>

      {!isConnected && (
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center gap-3 text-foreground">
          <Zap size={20} className="text-primary" />
          <span className="text-sm font-medium">
            Connect your CHOICE ID to see your AI Match Score and apply to roles.
          </span>
          <button
            onClick={() => setWalletModalOpen(true)}
            className="ml-auto bg-primary text-primary-foreground font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-widest hover:brightness-110 transition-all shrink-0"
          >
            Connect
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {isMatching ? (
          <div className="text-center py-20">
            <div className="animate-spin bg-primary/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 border-t-4 border-primary"></div>
            <p className="text-muted-foreground font-medium animate-pulse">AI Engine Analyzing Credential Fit...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">No jobs match your search.</p>
          </div>
        ) : (
          <>
            {jobs.slice(0, visibleCount).map((job, idx) => {
              const mc = getMatchColor(job.matchScore || 0);
              const isExpanded = expandedJob === job.id;
              const mr = job.matchResult;
              const requiredScore = job.minScore;
              const requiredBalance = job.minScore >= 70 ? 50 : 0;
              const isJobLocked =
                identity && (score < requiredScore || (requiredBalance > 0 && choiceBalance < requiredBalance));
              const isApplied = appliedJobIds.has(job.id);

              return (
                <div
                  key={job.id}
                  className={`glass ${
                    isJobLocked
                      ? 'border-white/5 opacity-50'
                      : idx === 0 && identity
                      ? 'border-emerald-500/50 shadow-glow-primary/20 bg-white/5'
                      : 'border-white/10'
                  } rounded-3xl shadow-xl hover:shadow-2xl hover:bg-white/5 transition-all duration-300 relative overflow-hidden group`}
                >
                  {idx === 0 && identity && !isJobLocked && !isApplied && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-glow-primary">
                      Top AI Pick
                    </div>
                  )}

                  {isApplied && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-glow-primary z-10">
                      Applied
                    </div>
                  )}

                  {isJobLocked && !isApplied && (
                    <div className="absolute top-0 right-0 bg-muted text-muted-foreground text-[10px] font-bold uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1 z-10">
                      <Lock size={10} /> Locked
                    </div>
                  )}

                  <div className={`p-5 flex flex-col md:flex-row gap-4 items-start md:items-center ${isJobLocked ? 'blur-[1px]' : ''}`}>
                    {identity && (
                      <div className="flex flex-col items-center justify-center min-w-[64px]">
                        <div
                          className={`relative w-14 h-14 flex items-center justify-center rounded-full border-[3px] shadow-inner ${mc.border} ${mc.text}`}
                        >
                          <span className="font-black text-base">{job.matchScore}%</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Match</span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm mt-1 mb-2">
                        <span className="font-semibold text-primary">{job.company}</span>
                        <span>•</span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                            job.type === 'Collaboration'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : job.type === 'Gig'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : job.type === 'DAO'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : 'bg-white/5 text-muted-foreground border border-white/10'
                          }`}
                        >
                          {job.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{job.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-muted-foreground/60" /> Remote
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Star size={14} className="text-amber-400" />
                          <span className="font-semibold text-foreground">Min Score: {job.minScore}</span>
                        </div>
                        {requiredBalance > 0 && (
                          <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                            <span className="font-black">◈</span>
                            <span className="font-black">{requiredBalance}+ CHOICE</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 w-full md:w-auto shrink-0">
                      {isJobLocked && !isApplied ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-bold flex items-center gap-2 cursor-not-allowed">
                              <Lock size={14} /> Locked
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              Unlock at score {requiredScore}+
                              {requiredBalance > 0 ? ` and ◈ ${requiredBalance} CHOICE` : ''}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <ChoiceButton
                          className="w-full md:w-auto"
                          onClick={() => handleApply(job)}
                          disabled={isApplied}
                          variant={isApplied ? 'outline' : 'primary'}
                        >
                          {isApplied
                            ? 'Applied'
                            : !isConnected
                            ? 'Connect to Apply'
                            : job.type === 'Collaboration'
                            ? 'Join Team'
                            : 'Apply'}
                        </ChoiceButton>
                      )}

                      {identity && mr && (
                        <button
                          onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                          className="text-xs text-primary flex items-center gap-1 hover:underline"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? 'Hide' : 'View'} Match Details
                        </button>
                      )}
                    </div>
                  </div>

                  {identity && mr && isExpanded && (
                    <div className="border-t border-white/10 px-5 py-6 bg-white/5 backdrop-blur-sm space-y-4">
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Zap size={12} className="text-amber-500 mt-0.5 shrink-0" />
                        <span>
                          <strong className="text-foreground">AI Insight:</strong> {mr.reason}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {mr.matchingSkills.length > 0 && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-2">
                              <CheckCircle size={12} /> Skills That Match
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {mr.matchingSkills.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[11px] font-medium">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {mr.missingSkills.length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-2">
                              <AlertTriangle size={12} /> Skill Gaps
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {mr.missingSkills.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[11px] font-medium">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {mr.recommendations.length > 0 && (
                          <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 mb-2">
                              <ArrowUpRight size={12} /> How to Improve
                            </div>
                            <ul className="space-y-1">
                              {mr.recommendations.map((r, i) => (
                                <li key={i} className="text-[11px] text-sky-700 flex items-start gap-1">
                                  <span className="mt-1 shrink-0">•</span>
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {visibleCount < jobs.length && (
              <div className="text-center pt-4">
                <ChoiceButton variant="outline" onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}>
                  Load More ({jobs.length - visibleCount} remaining)
                </ChoiceButton>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={jobDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {selectedJob ? `Apply: ${selectedJob.title}` : 'Apply'}
            </DialogTitle>
            <DialogDescription>
              {selectedJob
                ? `Complete the CHOICE flow for ${selectedJob.company}.`
                : 'Job application flow'}
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-5 pt-1">
              {applyStep !== 'sent' && (
                <div className="flex flex-wrap gap-2">
                  {APPLY_STEPS.map((step, index) => {
                    const activeIndex = APPLY_STEPS.indexOf(applyStep as Exclude<ApplyStep, 'sent'>);
                    const isDone = index < activeIndex;
                    const isCurrent = step === applyStep;

                    return (
                      <div
                        key={step}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                          isCurrent
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : isDone
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {STEP_LABELS[step]}
                      </div>
                    );
                  })}
                </div>
              )}

              {applyStep === 'description' && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-4 border border-border space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Match Score</span>
                      <span className="font-bold text-foreground">{selectedJob.matchScore}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Your Trust Score</span>
                      <span className="font-bold text-foreground">{score}/100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Company</span>
                      <span className="font-bold text-primary">{selectedJob.company}</span>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                    <p className="text-sm text-foreground leading-relaxed">{selectedJob.description}</p>
                  </div>

                  <ChoiceButton className="w-full" onClick={() => setApplyStep('cv')}>
                    <FileText size={14} className="mr-2" /> Next: Generate CV
                  </ChoiceButton>
                </div>
              )}

              {applyStep === 'cv' && (
                <div className="space-y-4">
                  {!generatedCV ? (
                    <div className="text-center py-6 border border-border rounded-xl bg-muted/30">
                      <Sparkles size={28} className="mx-auto text-primary mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">Generate your CV from verified identity data.</p>
                      <ChoiceButton onClick={handleGenerateCV} isLoading={isGeneratingCV}>
                        <FileText size={14} className="mr-2" /> Generate CV
                      </ChoiceButton>
                    </div>
                  ) : (
                    <>
                      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                        <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Generated Summary</p>
                        <p className="text-sm text-foreground leading-relaxed">{generatedCV.summary}</p>
                      </div>
                      <ChoiceButton className="w-full" onClick={() => setApplyStep('optimize')}>
                        Next: Optimize for Job
                      </ChoiceButton>
                    </>
                  )}
                </div>
              )}

              {applyStep === 'optimize' && (
                <div className="space-y-4">
                  <textarea
                    value={jobDescriptionInput}
                    onChange={(e) => setJobDescriptionInput(e.target.value)}
                    className="w-full h-32 bg-card border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Paste or edit job description..."
                  />

                  <ChoiceButton
                    className="w-full"
                    onClick={handleOptimizeCV}
                    isLoading={isOptimizingCV}
                    disabled={!generatedCV || !jobDescriptionInput.trim()}
                  >
                    <Target size={14} className="mr-2" /> Optimize CV
                  </ChoiceButton>

                  {optimizedCV && (
                    <>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs font-semibold text-emerald-700">
                        CV optimized for this role.
                      </div>
                      <ChoiceButton className="w-full" onClick={() => setApplyStep('cover')}>
                        Next: Cover Letter
                      </ChoiceButton>
                    </>
                  )}
                </div>
              )}

              {applyStep === 'cover' && (
                <div className="space-y-4">
                  <ChoiceButton
                    className="w-full"
                    onClick={handleGenerateCoverLetter}
                    isLoading={isGeneratingCover}
                    disabled={!displayedCV}
                  >
                    <PenTool size={14} className="mr-2" /> Generate Cover Letter
                  </ChoiceButton>

                  {coverLetter && (
                    <>
                      <pre className="text-foreground text-xs leading-relaxed whitespace-pre-wrap font-sans bg-muted p-4 rounded-xl border border-border max-h-56 overflow-y-auto">
                        {coverLetter}
                      </pre>
                      <ChoiceButton className="w-full" onClick={() => setApplyStep('preview')}>
                        Next: Full CV Preview
                      </ChoiceButton>
                    </>
                  )}
                </div>
              )}

              {applyStep === 'preview' && displayedCV && (
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">CV Summary</p>
                    <p className="text-sm text-foreground leading-relaxed">{displayedCV.summary}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {displayedCV.skills.slice(0, 8).map((skill, index) => (
                        <span key={index} className="px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-foreground border border-border">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {coverLetter && (
                    <div className="bg-card border border-border rounded-xl p-4">
                      <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Cover Letter</p>
                      <pre className="text-foreground text-xs leading-relaxed whitespace-pre-wrap font-sans bg-muted p-3 rounded-xl border border-border max-h-48 overflow-y-auto">
                        {coverLetter}
                      </pre>
                    </div>
                  )}

                  <ChoiceButton className="w-full" onClick={handleSendApplication} isLoading={isSendingApp}>
                    <Send size={14} className="mr-2" /> Send Application
                  </ChoiceButton>
                </div>
              )}

              {applyStep === 'sent' && (
                <div className="text-center py-4 space-y-3">
                  <CheckCircle size={48} className="text-emerald-500 mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Your application has been sent to {selectedJob.company}. This role is now marked as applied.
                  </p>
                  <ChoiceButton variant="outline" className="w-full" onClick={() => handleDialogChange(false)}>
                    Close
                  </ChoiceButton>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobsPage;
