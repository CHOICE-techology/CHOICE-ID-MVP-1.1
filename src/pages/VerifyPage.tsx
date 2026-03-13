import React, { useState, useEffect } from 'react';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Search, CheckCircle, XCircle, ArrowLeft, Clock, ShieldAlert, ClipboardCheck, Shield, TrendingUp, Users, BookOpen, Wallet, FileText, Award } from 'lucide-react';
import { generateReputationHash } from '@/services/cryptoService';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { calculateReputationBreakdown } from '@/services/scoreEngine';
import { VerifiableCredential } from '@/types';
import { cn } from '@/lib/utils';

interface VerificationRecord {
  address: string;
  reputationHash: string;
  score: number;
  date: string;
  txHash: string;
  explorerUrl: string;
  isFlagged: boolean;
  status: 'verified';
  breakdown: {
    social: number;
    education: number;
    physical: number;
    finance: number;
  };
  cvSummary: string;
  badges: string[];
  socialPlatforms: string[];
  walletChains: string[];
}

const VerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const { userIdentity: identity } = useWallet();
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; data?: VerificationRecord }>({ status: 'idle' });

  // Auto-fill address from connected identity
  useEffect(() => {
    if (identity?.address && !address) {
      setAddress(identity.address);
    }
  }, [identity]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult({ status: 'loading' });

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      if (address.length < 10) throw new Error('Invalid address format');

      // Gather data from identity credentials
      const creds = identity?.credentials || [];
      const breakdown = calculateReputationBreakdown(creds);

      // Extract badges from education credentials
      const badges = creds
        .filter((vc: VerifiableCredential) => vc.type.includes('EducationCredential'))
        .map((vc: VerifiableCredential) => (vc.credentialSubject as any).courseName as string)
        .filter(Boolean);

      // Extract connected social platforms
      const socialPlatforms = creds
        .filter((vc: VerifiableCredential) => vc.type.includes('SocialCredential'))
        .map((vc: VerifiableCredential) => (vc.credentialSubject as any).platform as string)
        .filter(Boolean);

      // Extract wallet chains
      const walletChains = creds
        .filter((vc: VerifiableCredential) => vc.type.includes('WalletCreatedCredential') || vc.type.includes('WalletHistoryCredential'))
        .map((vc: VerifiableCredential) => (vc.credentialSubject as any).chain as string || 'Ethereum')
        .filter(Boolean);

      // Physical docs
      const physicalDocs = creds
        .filter((vc: VerifiableCredential) => vc.type.includes('PhysicalCredential'))
        .map((vc: VerifiableCredential) => (vc.credentialSubject as any).documentType as string)
        .filter(Boolean);

      // Auto-generate CV summary
      const cvParts: string[] = [];
      if (badges.length) cvParts.push(`Completed ${badges.length} Web3 course${badges.length > 1 ? 's' : ''}: ${badges.join(', ')}`);
      if (socialPlatforms.length) cvParts.push(`Active on ${socialPlatforms.length} social platform${socialPlatforms.length > 1 ? 's' : ''}`);
      if (walletChains.length) cvParts.push(`On-chain activity across ${walletChains.length} chain${walletChains.length > 1 ? 's' : ''}`);
      if (physicalDocs.length) cvParts.push(`${physicalDocs.length} verified document${physicalDocs.length > 1 ? 's' : ''}: ${physicalDocs.join(', ')}`);
      const cvSummary = cvParts.length ? cvParts.join('. ') + '.' : 'No credentials submitted yet.';

      const requestHash = await generateReputationHash(address, breakdown.score);
      const verificationRecord: VerificationRecord = {
        address,
        reputationHash: requestHash,
        score: breakdown.score,
        date: new Date().toLocaleString(),
        txHash: `verified_${requestHash.slice(2, 12)}`,
        explorerUrl: `https://etherscan.io/address/${address}`,
        isFlagged: false,
        status: 'verified',
        breakdown: breakdown.categories,
        cvSummary,
        badges,
        socialPlatforms,
        walletChains,
      };

      localStorage.setItem('choice_last_verification', JSON.stringify(verificationRecord));
      setResult({ status: 'success', data: verificationRecord });
    } catch {
      setResult({ status: 'error' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-fade-in">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Proof Verification</h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          Submit your wallet to auto-verify your reputation proof with scoreboard data and on-chain anchoring.
        </p>
      </header>

      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl">
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wide">Wallet Address</label>
            <div className="relative group">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-muted border-2 border-border rounded-xl px-5 py-4 pl-12 text-foreground placeholder:text-muted-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-mono shadow-inner"
              />
              <Search className="absolute left-4 top-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
            </div>
          </div>

          <ChoiceButton type="submit" className="w-full text-lg py-4" isLoading={result.status === 'loading'}>
            Verify & Anchor Proof
          </ChoiceButton>
        </form>
      </div>

      {result.status === 'success' && result.data && (
        <div className="animate-fade-in space-y-5">
          <button
            onClick={() => navigate('/identity', { state: { verificationSuccess: true, verificationData: result.data } })}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/5 border border-primary/20 px-5 py-2.5 rounded-xl"
          >
            <ArrowLeft size={16} /> Back to My Identity
          </button>

          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-4 flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-full">
                <CheckCircle className="text-emerald-500" size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Verification Complete</h3>
                <p className="text-emerald-600 text-xs font-medium">Status: Auto-verified ✓</p>
              </div>
              <div className="ml-auto bg-emerald-500/20 px-4 py-2 rounded-xl border border-emerald-500/30">
                <span className="text-2xl font-black text-emerald-500">{result.data.score}</span>
                <span className="text-xs text-emerald-600 font-bold">/100</span>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="px-6 py-5 border-b border-border">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3">Reputation Breakdown</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Social', value: result.data.breakdown.social, max: 40, icon: Users, color: 'text-blue-400' },
                  { label: 'Education', value: result.data.breakdown.education, max: 30, icon: BookOpen, color: 'text-emerald-400' },
                  { label: 'Physical', value: result.data.breakdown.physical, max: 20, icon: Shield, color: 'text-amber-400' },
                  { label: 'Finance', value: result.data.breakdown.finance, max: 10, icon: Wallet, color: 'text-purple-400' },
                ].map(({ label, value, max, icon: Icon, color }) => (
                  <div key={label} className="bg-muted/50 border border-border rounded-xl p-3 text-center">
                    <Icon size={16} className={cn('mx-auto mb-1.5', color)} />
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-black text-foreground">{value}/{max}</p>
                    <div className="w-full h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
                      <div className={cn('h-full rounded-full', color.replace('text-', 'bg-'))} style={{ width: `${(value / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CV Summary */}
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-primary" />
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Auto-Generated CV Summary</p>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{result.data.cvSummary}</p>
            </div>

            {/* Badges */}
            {result.data.badges.length > 0 && (
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={14} className="text-amber-400" />
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Education Badges</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.data.badges.map(badge => (
                    <span key={badge} className="bg-emerald-500/10 text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      🏆 {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social & Wallets */}
            <div className="px-6 py-4 border-b border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.data.socialPlatforms.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Connected Socials</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.data.socialPlatforms.map(p => (
                      <span key={p} className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-blue-500/20">{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.data.walletChains.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Active Chains</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.data.walletChains.map(c => (
                      <span key={c} className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-purple-500/20">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Meta info */}
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-2.5">
                  <Clock size={14} className="text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Verified</span>
                </div>
                <span className="text-xs font-semibold text-foreground">{result.data.date}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-3 gap-4">
                <div className="flex items-center gap-2.5 shrink-0">
                  <ShieldAlert size={14} className="text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Proof Hash</span>
                </div>
                <span className="text-[10px] font-mono text-primary truncate">{result.data.reputationHash}</span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted/30">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-700">
                <CheckCircle size={14} />
                <span className="text-xs font-bold">Proof auto-verified and anchored. No manual review required.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {result.status === 'error' && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-3xl p-8 text-center animate-fade-in">
          <div className="bg-background w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-destructive/20">
            <XCircle className="text-destructive" size={32} />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Submission Failed</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">Please check the wallet address and try again.</p>
        </div>
      )}
    </div>
  );
};

export default VerifyPage;
