import React, { useState, useEffect, useMemo } from 'react';
import { Job, JobMatchResult } from '@/types';
import { calculateJobMatch } from '@/services/jobMatchingService';
import { ChoiceButton } from '@/components/ChoiceButton';
import { JobApplicationDialog } from '@/components/JobApplicationDialog';
import { DollarSign, Zap, Star, MapPin, Search, CheckCircle, AlertTriangle, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { ALL_JOBS } from '@/data/jobsData';

const ITEMS_PER_PAGE = 15;

type JobWithMatch = Job & { matchResult?: JobMatchResult };

const JobsPage: React.FC = () => {
  const { userIdentity: identity, updateIdentity } = useWallet();
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMatching, setIsMatching] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobWithMatch | null>(null);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);

  useEffect(() => {
    setIsMatching(true);
    const t = setTimeout(() => setIsMatching(false), 800);
    return () => clearTimeout(t);
  }, [identity, filterType]);

  const jobs = useMemo((): JobWithMatch[] => {
    let filtered = ALL_JOBS.filter(job => filterType === 'All' || job.type === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.description.toLowerCase().includes(q));
    }
    return filtered.map(job => {
      const matchResult = identity ? calculateJobMatch(job, identity) : undefined;
      return { ...job, matchScore: matchResult?.score || 0, matchReason: matchResult?.reason || '', matchResult };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [identity, filterType, searchQuery]);

  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE); }, [filterType, searchQuery]);

  const handleApply = (job: JobWithMatch) => {
    if (!identity) return;
    const matchResult = job.matchResult || { score: job.matchScore || 0, reason: job.matchReason || '', matchingSkills: [], missingSkills: [], recommendations: [] };
    setSelectedJob({ ...job, matchResult });
    setJobDialogOpen(true);
  };

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: ALL_JOBS.length };
    ALL_JOBS.forEach(j => { counts[j.type] = (counts[j.type] || 0) + 1; });
    return counts;
  }, []);

  const getMatchColor = (score: number) => {
    if (score >= 85) return { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (score >= 70) return { border: 'border-sky-500', text: 'text-sky-600', bg: 'bg-sky-50' };
    if (score >= 50) return { border: 'border-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' };
    return { border: 'border-border', text: 'text-muted-foreground', bg: 'bg-muted' };
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">Jobs, Gigs & Collabs</h1>
          <p className="text-muted-foreground text-lg">AI-matched opportunities based on your Verified CHOICE ID. <strong className="text-foreground">{ALL_JOBS.length} roles</strong> available.</p>
        </div>
      </header>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Search jobs by title, company, or description..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="flex flex-wrap gap-2">
        {['All', 'Full-time', 'Contract', 'DAO', 'Collaboration', 'Gig'].map(type => (
          <button key={type} onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterType === type ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-card border border-border text-muted-foreground hover:bg-muted'}`}>
            {type} <span className="text-xs opacity-70 ml-1">({typeCounts[type] || 0})</span>
          </button>
        ))}
      </div>

      {!identity && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-800">
          <Zap size={20} />
          <span className="text-sm font-medium">Connect your CHOICE ID to see your AI Match Score for these roles.</span>
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
              return (
                <div key={job.id} className={`bg-card border ${idx === 0 && identity ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-border'} rounded-2xl shadow-sm hover:shadow-lg transition-all relative overflow-hidden`}>
                  {idx === 0 && identity && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-xl">Top AI Pick</div>
                  )}
                  <div className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">
                    {identity && (
                      <div className="flex flex-col items-center justify-center min-w-[64px]">
                        <div className={`relative w-14 h-14 flex items-center justify-center rounded-full border-4 ${mc.border} ${mc.text}`}>
                          <span className="font-bold text-base">{job.matchScore}%</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Match</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm mt-1 mb-2">
                        <span className="font-semibold text-primary">{job.company}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${job.type === 'Collaboration' ? 'bg-purple-100 text-purple-700' : job.type === 'Gig' ? 'bg-emerald-100 text-emerald-700' : job.type === 'DAO' ? 'bg-indigo-100 text-indigo-700' : 'bg-muted text-muted-foreground'}`}>{job.type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{job.description}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1"><DollarSign size={14} /> {job.salary}</div>
                        <div className="flex items-center gap-1"><MapPin size={14} /> Remote</div>
                        <div className="flex items-center gap-1"><Star size={14} className="text-amber-400" /> Min Score: {job.minScore}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 w-full md:w-auto shrink-0">
                      <ChoiceButton className="w-full md:w-auto" onClick={() => handleApply(job)} disabled={!identity}>
                        {!identity ? 'Connect' : job.type === 'Collaboration' ? 'Join Team' : 'Auto-Apply'}
                      </ChoiceButton>
                      {identity && mr && (
                        <button onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                          className="text-xs text-primary flex items-center gap-1 hover:underline">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? 'Hide' : 'View'} Match Details
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded match details */}
                  {identity && mr && isExpanded && (
                    <div className="border-t border-border px-5 py-4 bg-muted/30 space-y-3">
                      {/* AI Insight */}
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Zap size={12} className="text-amber-500 mt-0.5 shrink-0" />
                        <span><strong className="text-foreground">AI Insight:</strong> {mr.reason}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Matching Skills */}
                        {mr.matchingSkills.length > 0 && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-2">
                              <CheckCircle size={12} /> Skills That Match
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {mr.matchingSkills.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[11px] font-medium">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Missing Skills */}
                        {mr.missingSkills.length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-2">
                              <AlertTriangle size={12} /> Skill Gaps
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {mr.missingSkills.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[11px] font-medium">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
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

                      {/* Required Skills Overview */}
                      {job.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">Required:</span>
                          {job.requiredSkills.map((s, i) => {
                            const matched = mr.matchingSkills.includes(s);
                            return (
                              <span key={i} className={`px-2 py-0.5 rounded text-[11px] font-medium ${matched ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{s}</span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {visibleCount < jobs.length && (
              <div className="text-center pt-4">
                <ChoiceButton variant="outline" onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}>
                  Load More ({jobs.length - visibleCount} remaining)
                </ChoiceButton>
              </div>
            )}
          </>
        )}
      </div>
      {identity && selectedJob && (
        <JobApplicationDialog
          open={jobDialogOpen}
          onOpenChange={setJobDialogOpen}
          job={{ ...selectedJob, matchResult: selectedJob.matchResult || { score: selectedJob.matchScore || 0, reason: selectedJob.matchReason || '', matchingSkills: [], missingSkills: [], recommendations: [] } }}
          identity={identity}
          onUpdateIdentity={updateIdentity}
        />
      )}
    </div>
  );
};

export default JobsPage;
