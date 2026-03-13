import React, { useState } from 'react';
import { X, Share2, ExternalLink, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPlatformMeta } from '@/components/social/platformLogos';
import { VerifiableCredential } from '@/types';

import xLogo from '@/assets/logos/x-twitter.png';
import linkedinLogo from '@/assets/logos/linkedin.png';
import facebookLogo from '@/assets/logos/facebook.png';
import telegramLogo from '@/assets/logos/telegram.png';
import discordLogo from '@/assets/logos/discord.png';

interface ShareBadgeDialogProps {
  open: boolean;
  onClose: () => void;
  courseTitle: string;
  courseLevel: string;
  coursePoints: number;
  badgeColor: string;
  connectedPlatforms: string[]; // platform IDs from social credentials
}

const SHARE_TARGETS = [
  { id: 'X', name: 'X / Twitter', logo: xLogo, bg: 'bg-slate-900', shareUrl: (text: string, url: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
  { id: 'Linkedin', name: 'LinkedIn', logo: linkedinLogo, bg: 'bg-blue-800', shareUrl: (text: string, url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  { id: 'Facebook', name: 'Facebook', logo: facebookLogo, bg: 'bg-blue-700', shareUrl: (text: string, url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}` },
  { id: 'Telegram', name: 'Telegram', logo: telegramLogo, bg: 'bg-sky-600', shareUrl: (text: string, url: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
  { id: 'Discord', name: 'Discord', logo: discordLogo, bg: 'bg-indigo-700', shareUrl: (_text: string, _url: string) => '' }, // Discord doesn't have a share URL, copy instead
];

const SITE_URL = 'https://choice.love';

export const ShareBadgeDialog: React.FC<ShareBadgeDialogProps> = ({
  open, onClose, courseTitle, courseLevel, coursePoints, badgeColor, connectedPlatforms,
}) => {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const shareText = `🏆 I just completed "${courseTitle}" (${courseLevel}) on CHOICE ID and earned +${coursePoints} reputation points! Building my decentralized identity one badge at a time. #Web3 #ChoiceID #DecentralizedIdentity`;
  const shareUrl = `${SITE_URL}/education`;

  const handleShare = (target: typeof SHARE_TARGETS[0]) => {
    const url = target.shareUrl(shareText, shareUrl);
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sort: connected platforms first
  const sortedTargets = [...SHARE_TARGETS].sort((a, b) => {
    const aConnected = connectedPlatforms.includes(a.id);
    const bConnected = connectedPlatforms.includes(b.id);
    if (aConnected && !bConnected) return -1;
    if (!aConnected && bConnected) return 1;
    return 0;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${badgeColor} flex items-center justify-center text-lg`}>
              🏆
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">Share Your Badge</h3>
              <p className="text-xs text-muted-foreground">Let the world know about your achievement</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Preview card */}
        <div className="bg-muted/50 border border-border rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${badgeColor} flex items-center justify-center text-xl shadow-lg`}>
              🏆
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{courseTitle}</p>
              <p className="text-xs text-muted-foreground">{courseLevel} · +{coursePoints} pts</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{shareText}</p>
        </div>

        {/* Share buttons */}
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3">
          Share to {connectedPlatforms.length > 0 ? '(connected platforms highlighted)' : 'social media'}
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {sortedTargets.map(target => {
            const isConnected = connectedPlatforms.includes(target.id);
            const hasShareUrl = target.id !== 'Discord';
            return (
              <button
                key={target.id}
                onClick={() => hasShareUrl ? handleShare(target) : handleCopy()}
                className={cn(
                  'flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left',
                  isConnected
                    ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                    : 'border-border bg-muted/30 hover:bg-muted/60',
                )}
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden', target.bg)}>
                  <img src={target.logo} alt={target.name} className="w-5 h-5 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-foreground block">{target.name}</span>
                  {isConnected && (
                    <span className="text-[8px] text-primary font-bold">Connected</span>
                  )}
                </div>
                <ExternalLink size={12} className="text-muted-foreground" />
              </button>
            );
          })}
        </div>

        {/* Copy link */}
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-muted/30 text-sm font-bold text-foreground hover:bg-muted/60 transition-all"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          {copied ? 'Copied to clipboard!' : 'Copy share text'}
        </button>
      </div>
    </div>
  );
};
