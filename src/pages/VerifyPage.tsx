import React, { useState } from 'react';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Search, CheckCircle, ExternalLink, XCircle, ArrowLeft, Clock, Award, Hash, Shield } from 'lucide-react';
import { generateReputationHash } from '@/services/cryptoService';
import { Link, useNavigate } from 'react-router-dom';

interface VerificationRecord {
  address: string;
  reputationHash: string;
  score: number;
  date: string;
  txHash: string;
  explorerUrl: string;
  isFlagged: boolean;
}

const VerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; data?: VerificationRecord }>({ status: 'idle' });

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult({ status: 'loading' });
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (address.length < 42) throw new Error("Invalid address format");
      const mockScore = Math.floor(Math.random() * 100);
      const mockHash = await generateReputationHash(address, mockScore);
      const txHash = `0x${mockHash.slice(2, 66)}`;
      const verificationRecord = {
          address,
          reputationHash: mockHash,
          score: mockScore,
          date: new Date().toLocaleString(),
          txHash,
          explorerUrl: `https://sepolia.arbiscan.io/tx/${txHash}`,
          isFlagged: false,
        };
      // Persist latest verification
      localStorage.setItem('choice_last_verification', JSON.stringify(verificationRecord));
      setResult({ status: 'success', data: verificationRecord });
    } catch {
      setResult({ status: 'error' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-fade-in">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Verify Reputation</h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">Check the on-chain reputation proof of any address using our zero-knowledge lookup.</p>
      </header>

      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl">
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wide">Wallet Address</label>
            <div className="relative group">
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x..."
                className="w-full bg-muted border-2 border-border rounded-xl px-5 py-4 pl-12 text-foreground placeholder:text-muted-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-mono shadow-inner" />
              <Search className="absolute left-4 top-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
            </div>
          </div>
          <ChoiceButton type="submit" className="w-full text-lg py-4" isLoading={result.status === 'loading'}>
            Verify On-Chain
          </ChoiceButton>
        </form>
      </div>

      {result.status === 'success' && result.data && (
        <div className="animate-fade-in space-y-5">
          {/* Back to Identity button */}
          <button
            onClick={() => navigate('/', { state: { verificationSuccess: true, verificationData: result.data } })}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/5 border border-primary/20 px-5 py-2.5 rounded-xl"
          >
            <ArrowLeft size={16} /> Back to My Identity
          </button>

          {/* Transaction Record Card */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4 flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-full">
                <CheckCircle className="text-emerald-600" size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Verification Successful</h3>
                <p className="text-emerald-700 text-xs font-medium">Proof confirmed on Arbitrum Sepolia</p>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className="text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">Verification Date</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{result.data.date}</span>
              </div>

              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <Award size={16} className="text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">Score</span>
                </div>
                <span className="text-sm font-bold text-foreground">
                  {result.data.score}<span className="text-muted-foreground font-normal">/100</span>
                </span>
              </div>

              <div className="flex items-center justify-between px-6 py-4 gap-4">
                <div className="flex items-center gap-2.5 shrink-0">
                  <Hash size={16} className="text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">TX Hash</span>
                </div>
                <span className="text-xs font-mono text-primary truncate">{result.data.txHash}</span>
              </div>

              <div className="flex items-center justify-between px-6 py-4 gap-4">
                <div className="flex items-center gap-2.5 shrink-0">
                  <Shield size={16} className="text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">Reputation Hash</span>
                </div>
                <span className="text-xs font-mono text-foreground/70 truncate">{result.data.reputationHash}</span>
              </div>
            </div>

            {/* Status badges */}
            <div className="px-6 py-4 border-t border-border flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                <CheckCircle size={14} className="text-emerald-500" />
                <span className="text-xs font-bold text-emerald-700">Valid Proof</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                <CheckCircle size={14} className="text-emerald-500" />
                <span className="text-xs font-bold text-emerald-700">Not Flagged</span>
              </div>
            </div>

            {/* Explorer Link */}
            <div className="px-6 py-4 border-t border-border bg-muted/30">
              <a
                href={result.data.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm font-bold text-secondary hover:text-primary transition-colors bg-secondary/10 hover:bg-secondary/15 px-4 py-3 rounded-xl w-full"
              >
                View on Arbiscan <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {result.status === 'error' && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center animate-fade-in">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-red-50">
            <XCircle className="text-red-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Verification Failed</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">Could not find a reputation record for this address or the format is invalid.</p>
        </div>
      )}
    </div>
  );
};

export default VerifyPage;
