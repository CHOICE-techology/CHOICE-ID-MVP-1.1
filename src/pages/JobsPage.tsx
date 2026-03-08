import React, { useState, useEffect, useMemo } from 'react';
import { Job } from '@/types';
import { calculateReputationScore, calculateJobMatch } from '@/services/cryptoService';
import { ChoiceButton } from '@/components/ChoiceButton';
import { DollarSign, Zap, Star, MapPin, Search } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { ALL_JOBS } from '@/data/jobsData';

const ITEMS_PER_PAGE = 15;

const JobsPage: React.FC = () => {
  const { userIdentity: identity } = useWallet();
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [applying, setApplying] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    setIsMatching(true);
    const t = setTimeout(() => setIsMatching(false), 800);
    return () => clearTimeout(t);
  }, [identity, filterType]);

  const jobs = useMemo(() => {
    const score = identity ? calculateReputationScore(identity.credentials) : 0;
    let filtered = ALL_JOBS.filter(job => filterType === 'All' || job.type === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q));
    }
    return filtered.map(job => {
      const match = identity ? calculateJobMatch(job, score, identity.credentials) : { score: 0, reason: '' };
      return { ...job, matchScore: match.score, matchReason: match.reason };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [identity, filterType, searchQuery]);

  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE); }, [filterType, searchQuery]);

  const handleApply = (id: string) => {
    if (!identity) return;
    setApplying(id);
    setTimeout(() => { setApplying(null); alert("Application Sent! Your CHOICE CV and Trust Score have been securely shared."); }, 1500);
  };

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: ALL_JOBS.length };
    ALL_JOBS.forEach(j => { counts[j.type] = (counts[j.type] || 0) + 1; });
    return counts;
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">Jobs, Gigs & Collabs</h1>
          <p className="text-muted-foreground text-lg">AI-matched opportunities based on your Verified CHOICE ID. <strong className="text-foreground">{ALL_JOBS.length} roles</strong> available.</p>
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search jobs by title or company..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Filters */}
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
          <span className="text-sm font-medium">Connect your wallet to see your AI Match Score for these roles.</span>
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
            {jobs.slice(0, visibleCount).map((job, idx) => (
              <div key={job.id} className={`bg-card border ${idx === 0 && identity ? 'border-emerald-400 ring-4 ring-emerald-50' : 'border-border'} rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row gap-4 items-start md:items-center relative overflow-hidden`}>
                {idx === 0 && identity && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-xl">Top AI Pick</div>
                )}
                {identity && (
                  <div className="flex flex-col items-center justify-center min-w-[64px]">
                    <div className={`relative w-14 h-14 flex items-center justify-center rounded-full border-4 ${job.matchScore! > 80 ? 'border-emerald-500 text-emerald-600' : job.matchScore! > 50 ? 'border-amber-500 text-amber-600' : 'border-border text-muted-foreground'}`}>
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
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1"><DollarSign size={14} /> {job.salary}</div>
                    <div className="flex items-center gap-1"><MapPin size={14} /> Remote</div>
                    <div className="flex items-center gap-1"><Star size={14} className="text-amber-400" /> Min Score: {job.minScore}</div>
                  </div>
                  {identity && job.matchReason && (
                    <div className="bg-muted border border-border rounded-lg p-2 text-xs text-muted-foreground flex items-start gap-2">
                      <Zap size={12} className="text-amber-500 mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">AI Insight:</strong> {job.matchReason}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 w-full md:w-auto shrink-0">
                  <ChoiceButton className="w-full md:w-auto" onClick={() => handleApply(job.id)} isLoading={applying === job.id} disabled={!!applying || !identity}>
                    {!identity ? 'Connect' : job.type === 'Collaboration' ? 'Join Team' : 'Auto-Apply'}
                  </ChoiceButton>
                </div>
              </div>
            ))}
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
    </div>
  );
};

export default JobsPage;
