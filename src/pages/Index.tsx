import React from 'react';
import { Shield } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useChoiceStore } from '@/store/useChoiceStore';
import { useNavigate } from 'react-router-dom';

const Index: React.FC = () => {
  const { isConnected } = useWallet();
  const { setWalletModalOpen } = useChoiceStore();
  const navigate = useNavigate();

  if (isConnected) {
    navigate('/identity');
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-7 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-[80px] animate-pulse" />
        <div className="relative bg-card/80 border border-primary/20 backdrop-blur-md p-10 rounded-full animate-scale-in">
          <Shield size={54} className="text-primary" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
          Connect your CHOICE<span className="text-primary">iD</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-md leading-relaxed mx-auto">
          Secure your identity and unlock verified opportunities.
        </p>
      </div>

      <button
        onClick={() => setWalletModalOpen(true)}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-black py-4 px-10 rounded-2xl shadow-glow-primary hover:brightness-110 transition-all active:scale-95 uppercase text-xs tracking-widest"
      >
        Connect CHOICE ID
      </button>
    </div>
  );
};

export default Index;
