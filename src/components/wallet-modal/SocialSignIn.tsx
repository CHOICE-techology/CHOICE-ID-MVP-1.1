import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import googleLogo from '@/assets/logos/google.png';
import appleLogo from '@/assets/logos/apple.png';
import githubLogo from '@/assets/logos/github.png';
import telegramLogo from '@/assets/logos/telegram.png';
import discordLogo from '@/assets/logos/discord.svg';
import xLogo from '@/assets/logos/x-twitter.png';

const socialProviders = [
  { id: 'google', name: 'Google', logo: googleLogo },
  { id: 'x', name: 'X (Twitter)', logo: xLogo },
  { id: 'apple', name: 'Apple', logo: appleLogo },
  { id: 'discord', name: 'Discord', logo: discordLogo },
  { id: 'telegram', name: 'Telegram', logo: telegramLogo },
  { id: 'github', name: 'GitHub', logo: githubLogo },
];

interface SocialSignInProps {
  connecting: string | null;
  successSet: Set<string>;
  onConnect: (providerId: string) => void;
}

export const SocialSignIn: React.FC<SocialSignInProps> = ({ connecting, successSet, onConnect }) => (
  <div className="mb-5">
    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
      Sign in with
    </span>
    <div className="grid grid-cols-2 gap-2 mt-2.5">
      {socialProviders.map((provider) => (
        <button
          key={provider.id}
          onClick={() => onConnect(provider.id)}
          disabled={!!connecting || successSet.has(provider.id)}
          className={cn(
            "flex items-center justify-center gap-2.5 p-3 rounded-xl border border-border",
            "hover:border-primary/30 hover:bg-muted/50 transition-all text-sm font-bold text-foreground disabled:opacity-60",
            connecting === provider.id && "border-primary/30 bg-muted/50",
            successSet.has(provider.id) && "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20"
          )}
        >
          {connecting === provider.id ? (
            <Loader2 size={16} className="animate-spin text-primary" />
          ) : successSet.has(provider.id) ? (
            <Check size={16} className="text-emerald-500" />
          ) : (
            <img src={provider.logo} alt={provider.name} className="w-5 h-5 object-contain shrink-0" />
          )}
          {provider.name}
        </button>
      ))}
    </div>
  </div>
);
