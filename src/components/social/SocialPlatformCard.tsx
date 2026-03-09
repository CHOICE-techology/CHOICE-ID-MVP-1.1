import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, TrendingUp, Users, Activity, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SocialMetricBar } from './SocialMetricBar';
import { VerifiableCredential } from '@/types';

interface SocialPlatformCardProps {
  vc: VerifiableCredential;
  isNew?: boolean;
  index?: number;
}

const getPlatformScore = (vc: VerifiableCredential): number => {
  const sub = vc.credentialSubject as any;
  if (typeof sub.platformScore === 'number') return sub.platformScore;
  // Compute a score from available metrics
  const engagement = parseFloat(sub.engagementRate) || 0;
  const botPct = parseFloat(sub.botProbability) || 50;
  const followers = Number(sub.followers) || 0;
  const followerScore = Math.min(30, Math.log10(Math.max(followers, 1)) * 6);
  const engScore = Math.min(40, engagement * 5);
  const authScore = Math.max(0, 30 - botPct * 0.6);
  return Math.round(followerScore + engScore + authScore);
};

const getMetricScores = (vc: VerifiableCredential) => {
  const sub = vc.credentialSubject as any;
  const influence = typeof sub.influence === 'number' ? sub.influence : Math.min(100, Math.round((Math.log10(Math.max(Number(sub.followers) || 1, 1)) / 6) * 100));
  const engagement = typeof sub.engagement === 'number' ? sub.engagement : Math.min(100, Math.round((parseFloat(sub.engagementRate) || 0) * 10));
  const consistency = typeof sub.consistency === 'number' ? sub.consistency : Math.min(100, Math.round((Number(sub.posts) || 0) / 50 * 100));
  const authenticity = typeof sub.authenticity === 'number' ? sub.authenticity : Math.max(0, 100 - Math.round((parseFloat(sub.botProbability) || 30) * 2));
  const community = typeof sub.community === 'number' ? sub.community : Math.min(100, Math.round((Number(sub.comments) || 0) / 100 * 100));
  return { influence, engagement, consistency, authenticity, community };
};

const PLATFORM_COLORS: Record<string, string> = {
  X: 'bg-slate-900',
  Twitter: 'bg-sky-500',
  LinkedIn: 'bg-blue-700',
  Linkedin: 'bg-blue-700',
  Instagram: 'bg-pink-600',
  GitHub: 'bg-slate-700',
  Github: 'bg-slate-700',
  TikTok: 'bg-slate-900',
  YouTube: 'bg-red-600',
  Youtube: 'bg-red-600',
  Telegram: 'bg-sky-500',
  Discord: 'bg-indigo-600',
  Farcaster: 'bg-purple-600',
  Facebook: 'bg-blue-600',
};

export const SocialPlatformCard: React.FC<SocialPlatformCardProps> = ({ vc, isNew, index = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const sub = vc.credentialSubject as any;
  const platform = sub.platform as string;
  const handle = (sub.handle as string)?.split('/').pop() || '';
  const score = getPlatformScore(vc);
  const metrics = getMetricScores(vc);
  const gradientColor = PLATFORM_COLORS[platform] || 'bg-slate-800';

  const behaviorScore = sub.behaviorScore as string || '';
  const isOrganic = behaviorScore.toLowerCase().includes('organic');

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden border border-white/10 shadow-lg transition-all duration-500',
        isNew ? 'animate-flip-in' : 'opacity-100',
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Card Header — dark glassmorphism */}
      <div className="bg-[hsl(var(--dark))] relative overflow-hidden">
        {/* Accent strip */}
        <div className={cn('absolute top-0 left-0 right-0 h-0.5', gradientColor)} />

        <div className="p-4 pb-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', gradientColor)}>
                <span className="text-white text-[10px] font-black">{platform.slice(0, 2).toUpperCase()}</span>
              </div>
              <div>
                <h4 className="font-black text-white text-sm tracking-tight leading-tight">{platform}</h4>
                <span className="text-white/40 text-[10px] font-bold">@{handle}</span>
              </div>
            </div>
            {/* Score badge */}
            <div className="text-right">
              <div className="text-2xl font-black text-white leading-none">{score}</div>
              <div className="text-[9px] font-black text-white/40 uppercase tracking-widest">score</div>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            <div className="bg-white/[0.05] rounded-lg p-2 text-center">
              <span className="text-white/40 block text-[8px] font-black uppercase tracking-widest">Followers</span>
              <span className="font-black text-white text-xs">{Number(sub.followers || 0).toLocaleString()}</span>
            </div>
            <div className="bg-white/[0.05] rounded-lg p-2 text-center">
              <span className="text-white/40 block text-[8px] font-black uppercase tracking-widest">Engage</span>
              <span className="font-black text-primary text-xs">{sub.engagementRate || '—'}</span>
            </div>
            <div className="bg-white/[0.05] rounded-lg p-2 text-center">
              <span className="text-white/40 block text-[8px] font-black uppercase tracking-widest">Bot Risk</span>
              <span className={cn('font-black text-xs', parseFloat(sub.botProbability) < 10 ? 'text-emerald-400' : parseFloat(sub.botProbability) < 25 ? 'text-amber-400' : 'text-red-400')}>
                {sub.botProbability || '—'}
              </span>
            </div>
          </div>

          {/* Behavior badge */}
          <div className="flex items-center justify-between">
            <div className={cn(
              'text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border',
              isOrganic ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            )}>
              {behaviorScore || 'Organic'}
            </div>
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors text-[10px] font-bold"
            >
              {expanded ? 'Less' : 'Details'}
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          </div>
        </div>

        {/* Expandable detail panel */}
        {expanded && (
          <div className="border-t border-white/8 p-4 pt-3 space-y-2.5 animate-fade-in">
            {sub.sector && (
              <div className="flex items-center gap-2 mb-3">
                <Star size={11} className="text-primary flex-shrink-0" />
                <span className="text-white/50 text-[9px] font-black uppercase tracking-widest">Sector</span>
                <span className="text-white text-[10px] font-bold ml-auto">{sub.sector as string}</span>
              </div>
            )}
            {sub.mission && (
              <p className="text-white/40 text-[10px] font-medium leading-relaxed italic mb-3">"{sub.mission as string}"</p>
            )}
            <SocialMetricBar label="Influence" value={metrics.influence} color="bg-primary" icon={<TrendingUp size={10} />} delay={0} />
            <SocialMetricBar label="Engagement" value={metrics.engagement} color="bg-secondary" icon={<Activity size={10} />} delay={80} />
            <SocialMetricBar label="Consistency" value={metrics.consistency} color="bg-purple-500" icon={<Star size={10} />} delay={160} />
            <SocialMetricBar label="Authenticity" value={metrics.authenticity} color="bg-emerald-500" icon={<Shield size={10} />} delay={240} />
            <SocialMetricBar label="Community" value={metrics.community} color="bg-amber-500" icon={<Users size={10} />} delay={320} />
          </div>
        )}
      </div>
    </div>
  );
};
