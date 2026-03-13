import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import xLogo from '@/assets/logos/x-twitter.png';
import linkedinLogo from '@/assets/logos/linkedin.png';
import facebookLogo from '@/assets/logos/facebook.png';
import telegramLogo from '@/assets/logos/telegram.png';

interface ShareBadgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseName: string;
  courseLevel: string;
  points: number;
}

const CHOICE_URL = 'https://www.CHOICE.love/choice-id';

export const ShareBadgeDialog: React.FC<ShareBadgeDialogProps> = ({
  open, onOpenChange, courseName, courseLevel, points,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareText = `🏆 I just earned the "${courseName}" badge (${courseLevel}) on CHOICE ID!\n\n+${points} Reputation Points earned.\n\nBuild your decentralized identity → ${CHOICE_URL}`;

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(CHOICE_URL);

  const platforms = [
    { name: 'X (Twitter)', logo: xLogo, url: `https://twitter.com/intent/tweet?text=${encodedText}` },
    { name: 'LinkedIn', logo: linkedinLogo, url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}` },
    { name: 'Facebook', logo: facebookLogo, url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}` },
    { name: 'Telegram', logo: telegramLogo, url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
  ];

  const copyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Share text copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            🏆 Share Your Badge
          </DialogTitle>
          <DialogDescription>
            Share your "{courseName}" badge with the world!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {platforms.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/50 hover:bg-muted transition-colors group"
            >
              <img src={p.logo} alt={p.name} className="w-6 h-6 rounded object-cover" />
              <span className="text-sm font-bold text-foreground flex-1">{p.name}</span>
              <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          ))}

          <button
            onClick={copyText}
            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/50 hover:bg-muted transition-colors w-full"
          >
            {copied ? <CheckCircle size={20} className="text-emerald-500" /> : <Copy size={20} className="text-muted-foreground" />}
            <span className="text-sm font-bold text-foreground flex-1 text-left">
              {copied ? 'Copied!' : 'Copy Text'}
            </span>
          </button>
        </div>

        <div className="bg-muted rounded-xl p-3 mt-2 border border-border">
          <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{shareText}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
