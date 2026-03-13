import React, { useState, useEffect } from 'react';
import { Heart, Globe, CheckCircle, Users, Shield, TrendingUp, Clock, Gift, Copy, Share2, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChoiceButton } from '@/components/ChoiceButton';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';

interface Referral {
  id: string;
  referral_code: string;
  referred_wallet: string | null;
  referred_name: string | null;
  joined_at: string | null;
  created_at: string;
}

const AboutPage: React.FC = () => {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [affiliateLink, setAffiliateLink] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [linksGenerated, setLinksGenerated] = useState(0);
  const { toast } = useToast();
  const { userIdentity: identity, isConnected } = useWallet();

  // Load referrals for this user
  useEffect(() => {
    if (!identity?.address) return;
    const loadReferrals = async () => {
      const { data } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_wallet', identity.address)
        .order('created_at', { ascending: false });
      if (data) {
        setReferrals(data);
        setLinksGenerated(data.length);
        // Set latest link
        if (data.length > 0) {
          setAffiliateLink(`https://CHOICE.love/join?ref=${data[0].referral_code}`);
        }
      }
    };
    loadReferrals();
  }, [identity?.address]);

  const generateAffiliateLink = async () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const link = `https://CHOICE.love/join?ref=${code}`;
    setAffiliateLink(link);
    setInviteOpen(true);

    if (identity?.address) {
      await supabase.from('referrals').insert({
        referrer_wallet: identity.address,
        referral_code: code,
      });
      setLinksGenerated(prev => prev + 1);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    toast({ title: 'Link Copied!', description: 'Your affiliate link has been copied to clipboard.' });
  };

  const joinedCount = referrals.filter(r => r.joined_at).length;
  const choiceEarned = joinedCount * 25;

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <header className="text-center space-y-4 max-w-2xl mx-auto pt-10">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
          <Heart className="text-primary fill-primary" size={32} />
        </div>
        <h1 className="text-5xl font-extrabold text-foreground tracking-tight">About CHOICE.love</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          We are building the trust layer for the decentralized internet. Our mission is to empower individuals with self-sovereign identity tools through <strong className="text-foreground">CHOICE ID</strong>.
        </p>
      </header>

      {/* Core Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-card p-8 rounded-3xl border border-border shadow-xl">
          <CheckCircle className="text-secondary mb-4" size={40} />
          <h3 className="text-xl font-bold text-foreground mb-2">Privacy First</h3>
          <p className="text-muted-foreground">Your data belongs to you. We use Zero-Knowledge proofs to verify facts without revealing sensitive information.</p>
        </div>
        <div className="bg-card p-8 rounded-3xl border border-border shadow-xl">
          <Globe className="text-accent mb-4" size={40} />
          <h3 className="text-xl font-bold text-foreground mb-2">Universal Access</h3>
          <p className="text-muted-foreground">CHOICE ID works across borders and blockchains, providing a unified reputation score for the global web.</p>
        </div>
        <div className="bg-card p-8 rounded-3xl border border-border shadow-xl">
          <Users className="text-primary mb-4" size={40} />
          <h3 className="text-xl font-bold text-foreground mb-2">Community Driven</h3>
          <p className="text-muted-foreground">We believe in open-source collaboration. Our tools are built to help communities thrive securely.</p>
        </div>
      </div>

      {/* Trust & Scoring Disclaimer */}
      <div className="bg-card border border-border rounded-3xl p-8 md:p-10 shadow-xl space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <Shield size={24} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">CHOICE ID Trust Score — How It Works</h2>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          The <strong className="text-foreground">CHOICE ID Trust Score</strong> is a transparent, verifiable metric designed to represent your digital and real-world reputation. We believe in fairness, openness, and rewarding genuine participation. Here's what you should know:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-muted rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-secondary" />
              <h4 className="font-bold text-foreground text-sm">Dynamic Evaluation</h4>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Scores may adjust over time as new evaluation criteria are introduced. This ensures the system remains fair, relevant, and aligned with the evolving decentralized ecosystem.
            </p>
          </div>

          <div className="bg-muted rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className="text-primary" />
              <h4 className="font-bold text-foreground text-sm">Equal 100-Point Distribution</h4>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The maximum score of 100 points is distributed equally and transparently across all evaluation categories — Social, Education, Real World, and Finance — ensuring no single factor dominates.
            </p>
          </div>

          <div className="bg-muted rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={18} className="text-accent" />
              <h4 className="font-bold text-foreground text-sm">Early Adopter Recognition</h4>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Early users who verify their identity and anchor their score on-chain will be recognized as pioneers. <strong className="text-foreground">Anchored Scores remain immutable</strong> — once verified on-chain, your anchored score is permanently preserved regardless of future criteria changes.
            </p>
          </div>

          <div className="bg-muted rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-emerald-500" />
              <h4 className="font-bold text-foreground text-sm">Grow Your Score</h4>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your CHOICE ID Score is never static. You can always increase it by completing additional actions — linking social accounts, finishing courses, uploading credentials, or building wallet history.
            </p>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
          <p className="text-sm text-foreground leading-relaxed">
            <strong>Our Commitment:</strong> CHOICE.love is designed to be a fair, transparent, and community-first platform. We will always communicate scoring changes in advance and ensure that early supporters are rewarded for their trust and participation.
          </p>
        </div>
      </div>

      {/* Invite Friends — Enhanced */}
      <div className="bg-card border border-border rounded-3xl p-8 md:p-10 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="bg-primary/10 p-4 rounded-2xl shrink-0">
            <Gift size={40} className="text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-foreground mb-2">Invite Friends to CHOICE.love</h2>
            <p className="text-muted-foreground leading-relaxed">
              Share CHOICE ID with your network. Each friend who joins earns you <strong className="text-primary">+25 CHOICE</strong>.
            </p>
          </div>
          <ChoiceButton onClick={generateAffiliateLink} className="shrink-0">
            <Share2 size={16} className="mr-2" /> Generate Invite Link
          </ChoiceButton>
        </div>

        {/* Always-visible referral link */}
        {affiliateLink && (
          <div className="bg-muted rounded-xl p-4 border border-border flex items-center gap-3">
            <code className="text-sm text-foreground font-mono flex-1 break-all">{affiliateLink}</code>
            <button onClick={copyLink} className="shrink-0 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
              <Copy size={16} className="text-primary" />
            </button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/60 border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-foreground">{linksGenerated}</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Links Generated</p>
          </div>
          <div className="bg-muted/60 border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-primary">{joinedCount}</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Friends Joined</p>
          </div>
          <div className="bg-muted/60 border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-emerald-400">◈ {choiceEarned}</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">CHOICE Earned</p>
          </div>
        </div>

        {/* Invited users list */}
        {referrals.length > 0 && (
          <div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3">Invited Users</p>
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {referrals.map((ref) => {
                const joined = !!ref.joined_at;
                return (
                  <div key={ref.id} className="flex items-center gap-3 bg-muted/40 border border-border rounded-xl p-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${joined ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                      <UserPlus size={14} className={joined ? 'text-emerald-400' : 'text-muted-foreground'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-foreground truncate">
                        {ref.referred_wallet || ref.referral_code}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {ref.created_at ? new Date(ref.created_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
                      joined
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {joined ? 'Joined ✓' : 'Pending'}
                    </span>
                    {joined && (
                      <span className="text-[10px] font-bold text-primary">+25 ◈</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-dark rounded-3xl p-10 text-center">
        <h2 className="text-3xl font-bold mb-4 text-white">Join the Movement</h2>
        <p className="text-slate-300 max-w-xl mx-auto mb-8">
          Be part of the future of digital identity. Secure your wallet, connect your social, and build your CHOICE ID Trust Score today.
        </p>
        <div className="flex justify-center gap-4">
          <a href="https://www.CHOICE.love" target="_blank" rel="noreferrer"
            className="px-6 py-3 bg-white text-foreground font-bold rounded-xl hover:bg-muted transition-colors">
            Visit CHOICE.love
          </a>
          <a href="https://www.CHOICE.love/choice-id" target="_blank" rel="noreferrer"
            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 transition-all">
            CHOICE ID Details
          </a>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift size={20} className="text-primary" /> Your CHOICE.love Invite Link
            </DialogTitle>
            <DialogDescription>Share this link with friends to invite them to CHOICE ID.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="bg-muted rounded-xl p-4 border border-border flex items-center gap-3">
              <code className="text-sm text-foreground font-mono flex-1 break-all">{affiliateLink}</code>
              <button onClick={copyLink} className="shrink-0 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <Copy size={16} className="text-primary" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Anyone who joins through your link will be linked to your CHOICE ID profile.
            </p>
            <ChoiceButton className="w-full" variant="outline" onClick={copyLink}>
              <Copy size={14} className="mr-2" /> Copy Link
            </ChoiceButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AboutPage;
