import React, { useState, useEffect } from 'react';
import {
  Shield, Zap, TrendingUp, Users, Activity, Star,
  Twitter, Linkedin, Github, Instagram, Youtube, Music, Send,
  MessageSquare, Facebook, Globe, PlusCircle, Check, X, AlertCircle,
  CheckCircle, Info, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerifiableCredential } from '@/types';
import { SocialScoreRing } from './SocialScoreRing';
import { SocialPlatformCard } from './SocialPlatformCard';
import { ChoiceButton } from '@/components/ChoiceButton';

import { addCredential } from '@/services/storageService';
import { mockUploadToIPFS } from '@/services/cryptoService';
import { grantSocialConnectReward } from '@/services/rewardService';

import { getPlatformMeta } from './platformLogos';

const HANDLE_PLATFORMS = new Set(['Telegram', 'Discord', 'Farcaster']);

const PLATFORM_URL_PATTERNS: Record<string, { regex: RegExp; example: string }> = {
  X:         { regex: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/,                    example: 'https://x.com/username' },
  Facebook:  { regex: /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._]+\/?$/,                           example: 'https://facebook.com/username' },
  Linkedin:  { regex: /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/,                       example: 'https://linkedin.com/in/username' },
  Instagram: { regex: /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/,                          example: 'https://instagram.com/username' },
  Github:    { regex: /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/,                             example: 'https://github.com/username' },
  TikTok:    { regex: /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+\/?$/,                            example: 'https://tiktok.com/@username' },
  Youtube:   { regex: /^https?:\/\/(www\.)?youtube\.com\/(@[a-zA-Z0-9_-]+|channel\/[a-zA-Z0-9_-]+)\/?$/, example: 'https://youtube.com/@username' },
  Meta:      { regex: /^https?:\/\/(www\.)?(facebook\.com|meta\.com)\/[a-zA-Z0-9._]+\/?$/,               example: 'https://facebook.com/username' },
};

const HANDLE_PATTERNS: Record<string, { regex: RegExp; example: string }> = {
  Telegram:  { regex: /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/,      example: '@username' },
  Discord:   { regex: /^@?[a-zA-Z0-9_.]{2,32}$/,              example: '@username#0000 or @username' },
  Farcaster: { regex: /^@?[a-zA-Z0-9_.-]{1,20}$/,             example: '@username' },
};

interface PlatformDef {
  name: string;
  id: string;
  fallbackIcon: React.ElementType;
}

const SOCIAL_PLATFORMS: PlatformDef[] = [
  { name: 'X / Twitter', id: 'X',        fallbackIcon: Twitter },
  { name: 'LinkedIn',    id: 'Linkedin',  fallbackIcon: Linkedin },
  { name: 'Instagram',   id: 'Instagram', fallbackIcon: Instagram },
  { name: 'GitHub',      id: 'Github',    fallbackIcon: Github },
  { name: 'YouTube',     id: 'Youtube',   fallbackIcon: Youtube },
  { name: 'TikTok',      id: 'TikTok',    fallbackIcon: Music },
  { name: 'Telegram',    id: 'Telegram',  fallbackIcon: Send },
  { name: 'Discord',     id: 'Discord',   fallbackIcon: MessageSquare },
  { name: 'Facebook',    id: 'Facebook',  fallbackIcon: Facebook },
  { name: 'Farcaster',   id: 'Farcaster', fallbackIcon: Zap },
  { name: 'Meta',        id: 'Meta',      fallbackIcon: Globe },
  { name: 'Other',       id: 'Custom',    fallbackIcon: PlusCircle },
];

interface SocialReputationHubProps {
  identity: any;
  onUpdateIdentity: (identity: any) => void;
}

const computeOverallSocialScore = (creds: VerifiableCredential[]): number => {
  if (!creds.length) return 0;
  const scores = creds.map(vc => {
    const sub = vc.credentialSubject as any;
    if (typeof sub.platformScore === 'number') return sub.platformScore;
    const engagement = parseFloat(sub.engagementRate) || 0;
    const botPct = parseFloat(sub.botProbability) || 50;
    const followers = Number(sub.followers) || 0;
    return Math.min(100, Math.round(
      Math.min(30, Math.log10(Math.max(followers, 1)) * 6) +
      Math.min(40, engagement * 5) +
      Math.max(0, 30 - botPct * 0.6)
    ));
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
};

const getAggregateMetrics = (creds: VerifiableCredential[]) => {
  if (!creds.length) return { influence: 0, engagement: 0, consistency: 0, authenticity: 0, community: 0 };
  const avg = (key: string, fallback: (sub: any) => number) => {
    const vals = creds.map(vc => {
      const sub = vc.credentialSubject as any;
      return typeof sub[key] === 'number' ? sub[key] : fallback(sub);
    });
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };
  return {
    influence:    avg('influence',    sub => Math.min(100, Math.round((Math.log10(Math.max(Number(sub.followers) || 1, 1)) / 6) * 100))),
    engagement:   avg('engagement',   sub => Math.min(100, Math.round((parseFloat(sub.engagementRate) || 0) * 10))),
    consistency:  avg('consistency',  sub => Math.min(100, Math.round((Number(sub.posts) || 0) / 50 * 100))),
    authenticity: avg('authenticity', sub => Math.max(0, 100 - Math.round((parseFloat(sub.botProbability) || 30) * 2))),
    community:    avg('community',    sub => Math.min(100, Math.round((Number(sub.comments) || 0) / 100 * 100))),
  };
};

const getInsights = (creds: VerifiableCredential[], metrics: ReturnType<typeof getAggregateMetrics>): string[] => {
  const insights: string[] = [];
  if (creds.length < 3) insights.push('Connect 3+ platforms to unlock full Social Score potential.');
  if (metrics.engagement < 40) insights.push('Low engagement detected — focus on interactive content to boost your score.');
  if (metrics.authenticity < 60) insights.push('High bot probability on some profiles — verify account age and activity.');
  if (!creds.some(vc => ['Linkedin', 'Github'].includes((vc.credentialSubject as any).platform)))
    insights.push('Add LinkedIn or GitHub to strengthen your professional authority.');
  if (metrics.consistency < 50) insights.push('Post more consistently to improve your content reliability score.');
  if (metrics.influence > 70 && creds.length >= 3) insights.push('Strong influence! You qualify for premium job opportunities.');
  return insights.slice(0, 3);
};

/* ─── Platform logo pill used in the Connect grid — full colored square, no white ─── */
const PlatformIcon: React.FC<{ platform: PlatformDef; connected: boolean }> = ({ platform, connected }) => {
  const meta = getPlatformMeta(platform.id);
  const FallbackIcon = platform.fallbackIcon;

  if (meta) {
    return (
      <div
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 overflow-hidden',
          meta.bgClass,
          !connected && 'opacity-50 group-hover:opacity-100',
        )}
        style={connected ? { boxShadow: `0 0 12px ${meta.color}55` } : undefined}
      >
        <img src={meta.logo} alt={platform.name} className="w-[22px] h-[22px] object-contain" />
      </div>
    );
  }

  return (
    <div className={cn(
      'w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-slate-800',
      connected ? 'opacity-100' : 'opacity-60 group-hover:opacity-100',
    )}>
      <FallbackIcon size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
    </div>
  );
};

export const SocialReputationHub: React.FC<SocialReputationHubProps> = ({ identity, onUpdateIdentity }) => {
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [customPlatformName, setCustomPlatformName] = useState('');
  const [handleInput, setHandleInput] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [recentlyConnected, setRecentlyConnected] = useState<string | null>(null);
  const [prevScore, setPrevScore] = useState(0);
  const [scoreAnimKey, setScoreAnimKey] = useState(0);

  const socialCreds = identity.credentials.filter((vc: VerifiableCredential) => vc.type.includes('SocialCredential'));
  const connectedPlatforms = new Set(socialCreds.map((vc: VerifiableCredential) => (vc.credentialSubject as any).platform));

  const overallScore = computeOverallSocialScore(socialCreds);
  const metrics = getAggregateMetrics(socialCreds);
  const insights = getInsights(socialCreds, metrics);

  useEffect(() => {
    if (overallScore !== prevScore) {
      setScoreAnimKey(k => k + 1);
      setPrevScore(overallScore);
    }
  }, [overallScore]);

  const isHandlePlatform = (p: string | null) => p ? HANDLE_PLATFORMS.has(p) : false;

  const validateInput = (value: string, platform: string): boolean => {
    if (platform === 'Custom') return value.startsWith('http');
    if (HANDLE_PLATFORMS.has(platform)) {
      const pattern = HANDLE_PATTERNS[platform];
      return pattern ? pattern.regex.test(value.replace(/^@/, '')) || pattern.regex.test(value) : value.length >= 2;
    }
    const pattern = PLATFORM_URL_PATTERNS[platform];
    if (!pattern) return value.startsWith('http');
    return pattern.regex.test(value);
  };

  const handleInputChange = (value: string) => {
    setHandleInput(value);
    if (value && activePlatform) {
      if (!validateInput(value, activePlatform)) {
        const isHandle = isHandlePlatform(activePlatform);
        const pattern = isHandle ? HANDLE_PATTERNS[activePlatform] : PLATFORM_URL_PATTERNS[activePlatform];
        setLinkError(`Invalid format. Expected: ${pattern?.example || (isHandle ? '@username' : 'https://...')}`);
      } else setLinkError(null);
    } else setLinkError(null);
  };

  const confirmConnect = async () => {
    const platformToUse = activePlatform === 'Custom' ? customPlatformName : activePlatform;
    if (!platformToUse || !handleInput) return;
    if (!validateInput(handleInput, activePlatform || '')) {
      setLinkError(isHandlePlatform(activePlatform) ? 'Please provide a valid handle.' : 'Please provide a valid profile URL.');
      return;
    }
    setIsVerifying(true);
    setLinkError(null);
    try {
      const profileUrl = isHandlePlatform(activePlatform)
        ? `https://${platformToUse.toLowerCase()}.com/${handleInput.replace(/^@/, '')}`
        : handleInput;

      // Mock analysis for now, will be replaced by scoreEngine/ollama later
      const data = {
        followers: 1000,
        engagementRate: 5.5,
        botProbability: 10,
        platform: platformToUse,
        platformScore: 85
      };


      const vc: VerifiableCredential = {
        id: `urn:uuid:${Math.random().toString(36).substring(2)}`,
        type: ['VerifiableCredential', 'SocialCredential'],
        issuer: `did:web:${platformToUse.toLowerCase().replace(/\s+/g, '')}.com`,
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: identity.did, ...data },
      };
      await mockUploadToIPFS(vc);
      const newIdentity = await addCredential(identity, vc);
      await onUpdateIdentity(newIdentity);
      await grantSocialConnectReward(identity.address, platformToUse);
      setRecentlyConnected(platformToUse);
      setTimeout(() => setRecentlyConnected(null), 4000);
      setActivePlatform(null);
      setHandleInput('');


    } catch (e: any) {
      setLinkError(e.message || 'Analysis failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const metricItems = [
    { key: 'influence',    label: 'Influence',    icon: TrendingUp, barColor: 'bg-primary',      textColor: 'text-primary',      glow: 'var(--primary)' },
    { key: 'engagement',   label: 'Engagement',   icon: Activity,   barColor: 'bg-secondary',    textColor: 'text-secondary',    glow: 'var(--secondary)' },
    { key: 'consistency',  label: 'Consistency',  icon: Star,       barColor: 'bg-purple-500',   textColor: 'text-purple-400',   glow: '267 90% 65%' },
    { key: 'authenticity', label: 'Authenticity', icon: Shield,     barColor: 'bg-emerald-500',  textColor: 'text-emerald-400',  glow: '160 80% 50%' },
    { key: 'community',    label: 'Community',    icon: Users,      barColor: 'bg-amber-500',    textColor: 'text-amber-400',    glow: '38 95% 55%' },
  ] as const;

  const activePlatformDef = SOCIAL_PLATFORMS.find(p => p.id === activePlatform);
  const activeMeta = activePlatform ? getPlatformMeta(activePlatform) : null;

  return (
    <section className="space-y-6">
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-secondary/10 p-2.5 rounded-xl border border-secondary/20">
            <Sparkles size={20} className="text-secondary" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black tracking-tight text-foreground leading-tight">Social Reputation</h2>
            <p className="text-muted-foreground text-xs font-medium mt-0.5">
              AI-powered analysis · {socialCreds.length} profile{socialCreds.length !== 1 ? 's' : ''} connected
            </p>
          </div>
        </div>
        <span className="bg-secondary/10 text-secondary text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-secondary/20 hidden sm:inline-flex">
          {socialCreds.length > 0 ? `${Math.min(40, 40)}/40 pts` : '+40 pts max'}
        </span>
      </div>

      {/* ── Score + Metrics dashboard ── */}
      {socialCreds.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden border border-border shadow-md bg-card"
        >
          {/* Accent top stripe */}
          <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--primary)))' }} />

          <div className="p-5 md:p-6 flex flex-col sm:flex-row items-center gap-6 border-b border-border">
            <div className="flex-shrink-0">
              <SocialScoreRing key={scoreAnimKey} score={overallScore} size={130} label="Social Score" animate />
            </div>

            <div className="flex-1 w-full space-y-2.5">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Reputation Breakdown</p>
              {metricItems.map(({ key, label, icon: Icon, barColor, textColor }, i) => (
                <div key={key} className="flex items-center gap-3">
                  <Icon size={12} className={cn('flex-shrink-0', textColor)} />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider w-[4.5rem] flex-shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700 ease-out', barColor)}
                      style={{ width: `${metrics[key]}%`, transitionDelay: `${i * 100}ms` }}
                    />
                  </div>
                  <span className={cn('text-xs font-black w-7 text-right flex-shrink-0', textColor)}>{metrics[key]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="p-5">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Actionable Insights</p>
              <div className="space-y-2">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-muted/50 border border-border rounded-xl px-3.5 py-2.5">
                    <Info size={13} className="text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-medium text-foreground leading-relaxed">{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Connect Profiles Grid ── */}
      <div>
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Connect Profiles</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {SOCIAL_PLATFORMS.map((social) => {
            const isConnected = connectedPlatforms.has(social.id);
            const justConnected = recentlyConnected === social.id;
            const meta = getPlatformMeta(social.id);
            return (
              <button
                key={social.id}
                onClick={() => !isConnected && setActivePlatform(social.id)}
                disabled={isConnected}
                className={cn(
                  'relative group rounded-xl p-3 flex flex-col items-center gap-1.5 text-center transition-all duration-200',
                  'border bg-card/60 backdrop-blur-sm',
                  isConnected
                    ? 'border-primary/30 bg-primary/5 cursor-default'
                    : 'border-border hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 active:scale-95',
                  justConnected && 'animate-scale-in',
                )}
                style={isConnected && meta ? { boxShadow: `0 0 14px ${meta.color}33` } : undefined}
              >
                <PlatformIcon platform={social} connected={isConnected} />
                <span className="text-[10px] font-bold text-foreground leading-tight">{social.name}</span>
                {isConnected ? (
                  <Check size={9} className="text-emerald-400" />
                ) : (
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">
                    +{(() => {
                      const futureCount = connectedPlatforms.size + 1;
                      return Math.floor(40 / futureCount);
                    })()} pts
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Platform Analysis Cards ── */}
      {socialCreds.length > 0 && (
        <div>
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Platform Analysis</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {socialCreds.map((vc: VerifiableCredential, idx: number) => (
              <SocialPlatformCard
                key={vc.id}
                vc={vc}
                isNew={recentlyConnected === (vc.credentialSubject as any).platform}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {socialCreds.length === 0 && (
        <div
          className="rounded-2xl p-8 text-center border border-dashed border-border"
          style={{ background: 'hsl(var(--card))' }}
        >
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-4"
            style={{ boxShadow: '0 0 24px hsl(var(--secondary)/0.3)' }}>
            <Sparkles size={24} className="text-secondary" />
          </div>
          <h3 className="font-black text-foreground text-base tracking-tight mb-1.5">Build Your Social Reputation</h3>
          <p className="text-muted-foreground text-sm font-medium max-w-xs mx-auto leading-relaxed">
            Connect your social profiles for AI-powered reputation analysis and earn CHOICE coins.
          </p>
          <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />+100 CHOICE per profile
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />Unlock job opportunities
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />AI bot & fraud detection
            </div>
          </div>
        </div>
      )}

      {/* ── Connect Modal ── */}
      {activePlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div
              className="rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-border animate-scale-in bg-card"
            >
            {/* Neon top bar */}
            {activeMeta && (
              <div className="h-[2px] rounded-t-2xl -mt-6 -mx-6 md:-mx-8 mb-6"
                style={{ background: `linear-gradient(90deg, transparent, ${activeMeta.color}, transparent)` }} />
            )}

            {/* Modal header */}
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                {activeMeta ? (
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden', activeMeta.bgClass)}
                    style={{ boxShadow: `0 0 16px ${activeMeta.color}55` }}>
                    <img src={activeMeta.logo} alt={activePlatform} className="w-6 h-6 object-contain" />
                  </div>
                ) : (
                  <div className="p-2 bg-secondary/10 border border-secondary/20 rounded-xl">
                    <Sparkles size={18} className="text-secondary" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-black text-foreground tracking-tight">
                    Link {activePlatform === 'Custom' ? 'Profile' : activePlatform}
                  </h3>
                  <p className="text-muted-foreground text-xs font-medium">AI reputation analysis</p>
                </div>
              </div>
              <button
                onClick={() => { setActivePlatform(null); setHandleInput(''); setLinkError(null); }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/[0.06]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { icon: Shield,    label: 'Bot Detection',  color: 'text-emerald-400' },
                { icon: TrendingUp,label: 'Influence Score', color: 'text-primary' },
                { icon: Activity,  label: 'Engagement',     color: 'text-secondary' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="bg-muted/60 border border-border rounded-xl p-2.5 text-center">
                  <Icon size={14} className={cn('mx-auto mb-1', color)} />
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wide">{label}</span>
                </div>
              ))}
            </div>

            {/* Custom platform name */}
            {activePlatform === 'Custom' && (
              <div className="mb-4">
                <label className="block text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Platform Name</label>
                <input
                  type="text"
                  value={customPlatformName}
                  onChange={(e) => setCustomPlatformName(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 font-medium text-foreground text-sm transition-all placeholder:text-muted-foreground"
                  placeholder="e.g. Threads, Mastodon"
                />
              </div>
            )}

            {/* Handle / URL input */}
            <div className="mb-3">
              <label className="block text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                {isHandlePlatform(activePlatform) ? 'Username / Handle' : 'Profile URL'}
              </label>
              <input
                type={isHandlePlatform(activePlatform) ? 'text' : 'url'}
                value={handleInput}
                onChange={(e) => handleInputChange(e.target.value)}
                className={cn(
                  'w-full bg-muted border rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all font-medium text-foreground text-sm placeholder:text-muted-foreground',
                  linkError ? 'border-destructive focus:ring-destructive/20' : 'border-border focus:ring-primary/30',
                )}
                placeholder={
                  isHandlePlatform(activePlatform)
                    ? HANDLE_PATTERNS[activePlatform!]?.example || '@username'
                    : PLATFORM_URL_PATTERNS[activePlatform!]?.example || 'https://...'
                }
                autoFocus={activePlatform !== 'Custom'}
                onKeyDown={(e) => e.key === 'Enter' && confirmConnect()}
              />
            </div>

            {linkError && (
              <div className="flex items-center gap-2 text-destructive text-xs font-medium mb-4 bg-destructive/10 border border-destructive/20 px-3 py-2.5 rounded-xl">
                <AlertCircle size={13} className="flex-shrink-0" />
                <span>{linkError}</span>
              </div>
            )}
            {!linkError && <div className="mb-4" />}

            {/* Reward hint */}
            <div className="flex items-center gap-2 bg-primary/[0.08] border border-primary/20 rounded-xl px-3.5 py-2.5 mb-4">
              <Sparkles size={13} className="text-primary flex-shrink-0" />
              <span className="text-xs font-bold text-foreground">
                Earn <strong className="text-primary">+100 CHOICE</strong> for connecting this profile
              </span>
            </div>

            <ChoiceButton
              onClick={confirmConnect}
              isLoading={isVerifying}
              disabled={!handleInput || !!linkError || (activePlatform === 'Custom' && !customPlatformName)}
              className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-glow-primary"
            >
              Analyze & Connect
            </ChoiceButton>
          </div>
        </div>
      )}
    </section>
  );
};
