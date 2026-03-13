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
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const { toast } = useToast();
  const { userIdentity } = useWallet();

  const walletAddress = userIdentity?.address || 'guest';

  // Load existing referrals for this user
  const loadReferrals = async () => {
    setLoadingReferrals(true);
    try {
      const { data } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_wallet', walletAddress)
        .order('created_at', { ascending: false });
      if (data) setReferrals(data);
    } catch (e) {
      console.error('Failed to load referrals', e);
    } finally {
      setLoadingReferrals(false);
    }
  };

  useEffect(() => {
    if (walletAddress !== 'guest') loadReferrals();
  }, [walletAddress]);

  const generateAffiliateLink = async () => {
    // Check if user already has a referral code
    const existing = referrals.find(r => !r.referred_wallet);
    if (existing) {
      const link = `${window.location.origin}/join?ref=${existing.referral_code}`;
      setAffiliateLink(link);
      setReferralCode(existing.referral_code);
      setInviteOpen(true);
      return;
    }

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const link = `${window.location.origin}/join?ref=${code}`;

    // Save to database
    try {
      await supabase.from('referrals').insert({
        referrer_wallet: walletAddress,
        referral_code: code,
      });
      await loadReferrals();
    } catch (e) {
      console.error('Failed to save referral', e);
    }

    setAffiliateLink(link);
    setReferralCode(code);
    setInviteOpen(true);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    toast({ title: 'Link Copied!', description: 'Your affiliate link has been copied to clipboard.' });
  };

  const joinedReferrals = referrals.filter(r => r.referred_wallet);

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

      {/* ══════════════════════════════════════════════════════════ */}
      {/* INVITE FRIENDS — with referral tracking                    */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="bg-primary/10 p-4 rounded-2xl shrink-0">
            <Gift size={36} className="text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-foreground mb-2">Invite Friends to CHOICE.love</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Share CHOICE ID with your network. Generate your personal affiliate link and track everyone who joins.
            </p>
          </div>
          <ChoiceButton onClick={generateAffiliateLink} className="shrink-0">
            <Share2 size={16} className="mr-2" /> Generate Invite Link
          </ChoiceButton>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-foreground">{referrals.length}</p>
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Links Generated</p>
          </div>
          <div className="bg-muted/50 border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-primary">{joinedReferrals.length}</p>
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Friends Joined</p>
          </div>
          <div className="bg-muted/50 border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-emerald-500">{joinedReferrals.length * 25}</p>
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">CHOICE Earned</p>
          </div>
        </div>

        {/* Invited friends list */}
        {joinedReferrals.length > 0 && (
          <div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3">Friends Who Joined</p>
            <div className="space-y-2">
              {joinedReferrals.map((r) => (
                <div key={r.id} className="bg-muted/30 border border-border rounded-xl p-3 flex items-center gap-3">
                  <div className="bg-emerald-500/10 p-2 rounded-lg">
                    <UserPlus size={14} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {r.referred_name || `${r.referred_wallet?.slice(0, 6)}...${r.referred_wallet?.slice(-4)}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Joined {r.joined_at ? new Date(r.joined_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-500">+25 ◈</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {joinedReferrals.length === 0 && referrals.length > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No friends have joined yet. Share your link to get started!</p>
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
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Your Referral Code</p>
              <p className="text-lg font-black text-primary tracking-widest">{referralCode}</p>
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
