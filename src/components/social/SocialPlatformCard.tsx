import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, TrendingUp, Users, Activity, Star, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SocialMetricBar } from './SocialMetricBar';
import { VerifiableCredential } from '@/types';
import { getPlatformMeta } from './platformLogos';

interface SocialPlatformCardProps {
  vc: VerifiableCredential;
  isNew?: boolean;
  index?: number;
}

const getPlatformScore = (vc: VerifiableCredential): number => {
  const sub = vc.credentialSubject as any;
  if (typeof sub.platformScore === 'number') return sub.platformScore;
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
  const influence    = typeof sub.influence    === 'number' ? sub.influence    : Math.min(100, Math.round((Math.log10(Math.max(Number(sub.followers) || 1, 1)) / 6) * 100));
  const engagement   = typeof sub.engagement   === 'number' ? sub.engagement   : Math.min(100, Math.round((parseFloat(sub.engagementRate) || 0) * 10));
  const consistency  = typeof sub.consistency  === 'number' ? sub.consistency  : Math.min(100, Math.round((Number(sub.posts) || 0) / 50 * 100));
  const authenticity = typeof sub.authenticity === 'number' ? sub.authenticity : Math.max(0, 100 - Math.round((parseFloat(sub.botProbability) || 30) * 2));
  const community    = typeof sub.community    === 'number' ? sub.community    : Math.min(100, Math.round((Number(sub.comments) || 0) / 100 * 100));
  return { influence, engagement, consistency, authenticity, community };
};

export const SocialPlatformCard: React.FC<SocialPlatformCardProps> = ({ vc, isNew, index = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const sub = vc.credentialSubject as any;
  const platform = sub.platform as string;
  const handle = (sub.handle as string)?.split('/').pop() || '';
  const score = getPlatformScore(vc);
  const metrics = getMetricScores(vc);
  const meta = getPlatformMeta(platform);
  const neonColor = meta?.color ?? 'hsl(var(--primary))';

  const behaviorScore = sub.behaviorScore as string || '';
  const isOrganic = behaviorScore.toLowerCase().includes('organic');

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden border shadow-sm transition-all duration-500 group bg-card',
        'border-border hover:border-primary/30 hover:shadow-md',
        isNew ? 'animate-flip-in' : 'opacity-100',
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Accent top bar */}
      <div
        className="h-[2px] w-full"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${neonColor} 50%, transparent 100%)` }}
      />

      <div className="p-4 pb-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden', meta?.bgClass ?? 'bg-muted')}
            >
              {meta ? (
                <img src={meta.logo} alt={platform} className="w-6 h-6 object-contain" />
              ) : (
                <Globe size={15} className="text-muted-foreground" />
              )}
            </div>
            <div>
              <h4 className="font-black text-foreground text-sm tracking-tight leading-tight">{platform}</h4>
              <span className="text-muted-foreground text-[10px] font-bold">@{handle}</span>
            </div>
          </div>

          {/* Score badge */}
          <div className="text-right">
            <div
              className="text-2xl font-black leading-none text-primary"
            >
              {score}
            </div>
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">score</div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {[
            { label: 'Followers', value: Number(sub.followers || 0).toLocaleString(), color: 'text-foreground' },
            { label: 'Engage',    value: sub.engagementRate || '—',                   color: 'text-primary' },
            {
              label: 'Bot Risk',
              value: sub.botProbability || '—',
              color: parseFloat(sub.botProbability) < 10
                ? 'text-emerald-500'
                : parseFloat(sub.botProbability) < 25
                ? 'text-amber-500'
                : 'text-destructive',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-muted/60 border border-border rounded-xl p-2 text-center">
              <span className="text-muted-foreground block text-[8px] font-black uppercase tracking-widest mb-0.5">{label}</span>
              <span className={cn('font-black text-xs', color)}>{value}</span>
            </div>
          ))}
        </div>

        {/* Bottom row: behavior badge + expand */}
        <div className="flex items-center justify-between">
          <div className={cn(
            'text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border',
            isOrganic
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : 'bg-amber-500/10  text-amber-600  border-amber-500/20',
          )}>
            {behaviorScore || 'Organic'}
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-bold"
          >
            {expanded ? 'Less' : 'Details'}
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* Expandable panel */}
      {expanded && (
        <div
          className="border-t border-border p-4 pt-3 space-y-2.5 animate-fade-in bg-muted/30"
        >
          {sub.sector && (
            <div className="flex items-center gap-2 mb-3">
              <Star size={11} className="text-primary flex-shrink-0" />
              <span className="text-muted-foreground text-[9px] font-black uppercase tracking-widest">Sector</span>
              <span className="text-foreground text-[10px] font-bold ml-auto">{sub.sector as string}</span>
            </div>
          )}
          {sub.mission && (
            <p className="text-muted-foreground text-[10px] font-medium leading-relaxed italic mb-3">"{sub.mission as string}"</p>
          )}
          <SocialMetricBar label="Influence"    value={metrics.influence}    color="bg-primary"      icon={<TrendingUp size={10} />} delay={0}   />
          <SocialMetricBar label="Engagement"   value={metrics.engagement}   color="bg-secondary"    icon={<Activity   size={10} />} delay={80}  />
          <SocialMetricBar label="Consistency"  value={metrics.consistency}  color="bg-purple-500"   icon={<Star       size={10} />} delay={160} />
          <SocialMetricBar label="Authenticity" value={metrics.authenticity} color="bg-emerald-500"  icon={<Shield     size={10} />} delay={240} />
          <SocialMetricBar label="Community"    value={metrics.community}    color="bg-amber-500"    icon={<Users      size={10} />} delay={320} />
        </div>
      )}
    </div>
  );
};
