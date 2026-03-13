import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

import xLogo from '@/assets/logos/x-twitter.png';
import linkedinLogo from '@/assets/logos/linkedin.png';
import facebookLogo from '@/assets/logos/facebook.png';
import telegramLogo from '@/assets/logos/telegram.png';

interface ShareBadgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseName: string;
  level: string;
  points: number;
}

const CHOICE_URL = 'https://www.CHOICE.love/choice-id';

const buildShareText = (courseName: string, level: string, points: number) =>
  `🏆 I just earned the "${courseName}" badge (${level}) on CHOICE ID!\n\n+${points} Reputation Points earned.\n\nBuild your decentralized identity → ${CHOICE_URL}`;

const platforms = [
  {
    id: 'x',
    name: 'X (Twitter)',
    logo: xLogo,
    getUrl: (text: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    tint: '222 47% 11%',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    logo: linkedinLogo,
    getUrl: (_text: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(CHOICE_URL)}`,
    tint: '210 80% 40%',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    logo: facebookLogo,
    getUrl: (text: string) =>
      `https://www.facebook.com/sharer.php?u=${encodeURIComponent(CHOICE_URL)}&quote=${encodeURIComponent(text)}`,
    tint: '220 46% 48%',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    logo: telegramLogo,
    getUrl: (text: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(CHOICE_URL)}&text=${encodeURIComponent(text)}`,
    tint: '199 89% 48%',
  },
];

export const ShareBadgeDialog: React.FC<ShareBadgeDialogProps> = ({
  open,
  onOpenChange,
  courseName,
  level,
  points,
}) => {
  const [copied, setCopied] = useState(false);
  const shareText = buildShareText(courseName, level, points);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🏆 Share Your Badge
          </DialogTitle>
          <DialogDescription>
            Share your "{courseName}" badge with the world!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 mt-2">
          {platforms.map((p) => (
            <a
              key={p.id}
              href={p.getUrl(shareText)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-border hover:border-primary/40 transition-all hover:bg-muted/50 w-full"
            >
              <img src={p.logo} alt={p.name} className="w-6 h-6 object-contain" />
              <span className="font-semibold text-sm text-foreground flex-1">{p.name}</span>
              <ExternalLink size={14} className="text-muted-foreground" />
            </a>
          ))}

          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-3 p-3.5 rounded-xl border w-full transition-all',
              copied
                ? 'border-emerald-400 bg-emerald-50/50 text-emerald-700'
                : 'border-primary bg-primary/5 hover:bg-primary/10 text-foreground'
            )}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            <span className="font-semibold text-sm flex-1 text-left">
              {copied ? 'Copied!' : 'Copy Text'}
            </span>
          </button>
        </div>

        {/* Preview */}
        <div className="mt-3 p-4 rounded-xl bg-muted border border-border text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
          {shareText}
        </div>
      </DialogContent>
    </Dialog>
  );
};
