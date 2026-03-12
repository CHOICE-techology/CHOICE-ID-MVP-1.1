import React from 'react';
import { Shield, Sparkles, ArrowRight } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useChoiceStore } from '@/store/useChoiceStore';
import { useNavigate } from 'react-router-dom';

const Index: React.FC = () => {
  const { isConnected } = useWallet();
  const { setWalletModalOpen } = useChoiceStore();
  const navigate = useNavigate();

  // If already connected, nudge to Identity
  if (isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative bg-primary/10 border border-primary/20 p-8 rounded-full">
            <Shield size={48} className="text-primary" />
          </div>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
          Welcome back to CHOICE<span className="text-primary">iD</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
          Your decentralised identity is active. View your trust score, credentials, and job matches.
        </p>
        <button
          onClick={() => navigate('/identity')}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-black py-3.5 px-8 rounded-2xl shadow-glow-primary hover:brightness-110 transition-all transform active:scale-95 uppercase text-xs tracking-widest"
        >
          Go to My Identity <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-fade-in">
      {/* Decorative glow */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/15 rounded-full blur-[80px] scale-150 animate-pulse" />
        <div className="relative bg-primary/10 border border-primary/20 p-10 rounded-full">
          <Shield size={56} className="text-primary" />
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
          Connect your CHOICE<span className="text-primary">iD</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg leading-relaxed mx-auto">
          Your sovereign digital identity — own your credentials, prove your reputation, and unlock Web3 opportunities. All privacy-first.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => setWalletModalOpen(true)}
          className="inline-flex items-center gap-2.5 bg-primary text-primary-foreground font-black py-4 px-10 rounded-2xl shadow-glow-primary hover:brightness-110 transition-all transform active:scale-95 uppercase text-xs tracking-widest"
        >
          <Sparkles size={18} /> Connect CHOICE ID
        </button>
        <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">
          Wallet · Social · Email
        </span>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-3 pt-4 max-w-md">
        {['Trust Score', 'Verified Credentials', 'Job Matching', 'Education Rewards'].map((f) => (
          <span
            key={f}
            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/60 border border-border px-4 py-2 rounded-full"
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Index;
