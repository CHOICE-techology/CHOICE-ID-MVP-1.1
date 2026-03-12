import React, { useState } from 'react';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Search, CheckCircle, XCircle, ArrowLeft, Clock, ShieldAlert, ClipboardCheck } from 'lucide-react';
import { generateReputationHash } from '@/services/cryptoService';
import { useNavigate } from 'react-router-dom';

interface VerificationRecord {
  address: string;
  reputationHash: string;
  score: number;
  date: string;
  txHash: string;
  explorerUrl: string;
  isFlagged: boolean;
  status: 'pending_manual_review';
}

const VerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; data?: VerificationRecord }>({ status: 'idle' });

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult({ status: 'loading' });

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      if (address.length < 42) throw new Error('Invalid address format');

      const requestHash = await generateReputationHash(address, 0);
      const verificationRecord: VerificationRecord = {
        address,
        reputationHash: requestHash,
        score: 0,
        date: new Date().toLocaleString(),
        txHash: `pending_${requestHash.slice(2, 12)}`,
        explorerUrl: '',
        isFlagged: false,
        status: 'pending_manual_review',
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
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Manual Proof Verification</h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          Submit a wallet for manual review. After approval, your reputation proof is anchored on-chain.
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
            Submit for Manual Verification
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
            <div className="bg-primary/10 border-b border-primary/20 px-6 py-4 flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-full">
                <ClipboardCheck className="text-primary" size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Verification Request Submitted</h3>
                <p className="text-primary text-xs font-medium">Status: Pending manual review</p>
              </div>
            </div>

            <div className="divide-y divide-border">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className="text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">Submitted</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{result.data.date}</span>
              </div>

              <div className="flex items-center justify-between px-6 py-4 gap-4">
                <div className="flex items-center gap-2.5 shrink-0">
                  <ShieldAlert size={16} className="text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">Request ID</span>
                </div>
                <span className="text-xs font-mono text-primary truncate">{result.data.txHash}</span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted/30">
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-700">
                <CheckCircle size={14} />
                <span className="text-xs font-bold">Manual review in progress. On-chain hash appears after approval.</span>
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
