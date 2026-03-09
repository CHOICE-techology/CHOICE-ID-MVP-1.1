import React, { useState } from 'react';
import { Mail, Check, Loader2 } from 'lucide-react';

interface EmailSignInProps {
  connecting: string | null;
  onConnect: (email: string) => Promise<boolean>;
}

export const EmailSignIn: React.FC<EmailSignInProps> = ({ connecting, onConnect }) => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    const sent = await onConnect(email);
    setEmailSent(sent);
  };

  return (
    <div className="mb-5">
      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
        Or continue with email
      </span>
      {emailSent ? (
        <div className="mt-2.5 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center">
          <Check size={24} className="mx-auto mb-2 text-emerald-500" />
          <p className="text-sm font-bold text-foreground">Check your email</p>
          <p className="text-xs text-muted-foreground mt-1">
            We sent a magic link to <strong>{email}</strong>
          </p>
        </div>
      ) : (
        <div className="flex gap-2 mt-2.5">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-muted/30">
            <Mail size={16} className="text-muted-foreground shrink-0" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!email || !!connecting}
            className="px-5 py-3 rounded-xl bg-foreground text-background text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50"
          >
            {connecting === 'email' ? <Loader2 size={14} className="animate-spin" /> : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
};
