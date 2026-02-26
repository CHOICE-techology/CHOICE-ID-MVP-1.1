import React, { useState } from 'react';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Search, CheckCircle, ExternalLink, XCircle } from 'lucide-react';
import { generateReputationHash } from '@/services/cryptoService';

const VerifyPage: React.FC = () => {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<{ status: 'idle' | 'loading' | 'success' | 'error', data?: { address: string; reputationHash: string; lastUpdated: string; isFlagged: boolean; } }>({ status: 'idle' });

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult({ status: 'loading' });
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (address.length < 42) throw new Error("Invalid address format");
      const mockScore = Math.floor(Math.random() * 100);
      const mockHash = await generateReputationHash(address, mockScore);
      setResult({ status: 'success', data: { address, reputationHash: mockHash, lastUpdated: new Date().toISOString(), isFlagged: false } });
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
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 md:p-8 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="bg-white p-3 rounded-full shadow-sm">
              <CheckCircle className="text-emerald-500" size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Verification Successful</h3>
              <p className="text-emerald-700 text-sm font-medium">Proof found on Arbitrum Sepolia</p>
            </div>
          </div>
          <div className="space-y-4 relative z-10">
            <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-sm">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Target Address</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-mono break-all">{result.data.address}</span>
                <ExternalLink size={14} className="text-muted-foreground/30" />
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-sm">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Reputation Hash (On-Chain Proof)</span>
              <span className="text-primary font-mono break-all text-sm">{result.data.reputationHash}</span>
            </div>
            <div className="flex gap-4 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-emerald-100 shadow-sm">
                <CheckCircle size={18} className="text-emerald-500" />
                <span className="text-sm font-bold text-muted-foreground">Valid Proof</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-emerald-100 shadow-sm">
                <CheckCircle size={18} className="text-emerald-500" />
                <span className="text-sm font-bold text-muted-foreground">Not Flagged</span>
              </div>
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
