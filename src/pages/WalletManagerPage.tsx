import React, { useState, useEffect } from 'react';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Copy, Check, Download, Lock, Eye, EyeOff, Coins, ArrowRight, ChevronRight, BookOpen, Globe } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const WALLET_DATA = [
  { name: "Exodus", symbol: "EXODUS", color: "text-purple-500", bg: "bg-purple-50", risk: "Low", description: "Beautiful, easy-to-use multi-chain wallet with built-in exchange and portfolio tracking.", url: "https://www.exodus.com/" },
  { name: "Trust Wallet", symbol: "TRUST", color: "text-blue-500", bg: "bg-blue-50", risk: "Low", description: "The most trusted & secure crypto wallet. Multi-chain support with staking and DApp browser.", url: "https://trustwallet.com/" },
  { name: "Zengo", symbol: "ZENGO", color: "text-indigo-500", bg: "bg-indigo-50", risk: "Low", description: "Keyless crypto wallet using MPC technology. No seed phrase needed for maximum security.", url: "https://zengo.com/" },
  { name: "Coinbase Wallet", symbol: "CB", color: "text-blue-600", bg: "bg-blue-100", risk: "Low", description: "Self-custody wallet by Coinbase. Access DeFi, NFTs, and thousands of tokens.", url: "https://www.coinbase.com/wallet" },
  { name: "OKX Web3 Wallet", symbol: "OKX", color: "text-foreground", bg: "bg-muted", risk: "Medium", description: "All-in-one Web3 gateway with DEX, NFT marketplace, and multi-chain support.", url: "https://www.okx.com/web3" },
  { name: "Atomic Wallet", symbol: "ATOMIC", color: "text-emerald-500", bg: "bg-emerald-50", risk: "Low", description: "Decentralized wallet supporting 500+ assets with built-in atomic swaps and staking.", url: "https://atomicwallet.io/" },
  { name: "Bitget Wallet", symbol: "BITGET", color: "text-cyan-500", bg: "bg-cyan-50", risk: "Medium", description: "Smart wallet with multi-chain DApp browser, swap aggregator, and launchpad access.", url: "https://web3.bitget.com/" },
  { name: "Binance Web3 Wallet", symbol: "BNB", color: "text-yellow-500", bg: "bg-yellow-50", risk: "Low", description: "Self-custody wallet within Binance app. Seamless BNB Chain integration and yield tools.", url: "https://www.binance.com/en/web3wallet" },
];

const WalletManagerPage: React.FC = () => {
  const [seedPhrase, setSeedPhrase] = useState<string[] | null>(null);
  const [showSeed, setShowSeed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state as { preSelectedCoin?: string } | null;
    if (state?.preSelectedCoin) {
      setSelectedChain(state.preSelectedCoin);
      setStep(2);
    }
  }, [location.state]);

  const generateWallet = () => {
    const mockMnemonic = "witch collapse practice feed shame open despair creek road again ice least".split(" ");
    setSeedPhrase(mockMnemonic);
    setStep(3);
  };

  const copyToClipboard = () => {
    if (seedPhrase) {
      navigator.clipboard.writeText(seedPhrase.join(" "));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadKeyStore = (currency: string) => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify({ currency, address: "0xMock...", privateKey: "encrypted" })], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${currency.toLowerCase()}_keystore_utc.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const navigateToCreate = (coinName: string) => {
    navigate('/wallet/create', { state: { preSelectedCoin: coinName } });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">Create New Wallet</h1>
        <p className="text-muted-foreground text-lg">Follow the steps to generate a secure wallet for your chosen chain.</p>
      </header>

      <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground mb-8">
        <span className={step >= 1 ? 'text-primary' : ''}>1. Select Chain</span>
        <ChevronRight size={16} />
        <span className={step >= 2 ? 'text-primary' : ''}>2. Select Provider</span>
        <ChevronRight size={16} />
        <span className={step >= 3 ? 'text-primary' : ''}>3. Secure</span>
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WALLET_DATA.map(wallet => (
            <button key={wallet.name} onClick={() => { setSelectedChain(wallet.name); setStep(2); }}
              className="bg-card p-6 rounded-2xl border border-border hover:border-primary hover:shadow-lg transition-all text-left group">
              <div className="flex items-center justify-between mb-2">
                <div className={`${wallet.bg} p-2 rounded-lg ${wallet.color}`}><Coins size={24} /></div>
                <ArrowRight size={20} className="text-muted-foreground/30 group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-lg text-foreground">{wallet.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${wallet.risk === 'Low' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{wallet.risk} Risk</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{wallet.description}</p>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-muted p-4 rounded-xl border border-border flex items-center gap-3">
            <div className="bg-card p-2 rounded-lg shadow-sm"><Coins size={20} className="text-primary" /></div>
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase">Selected Chain</span>
              <p className="font-bold text-foreground">{selectedChain}</p>
            </div>
            <ChoiceButton variant="ghost" onClick={() => setStep(1)} className="ml-auto text-xs">Change</ChoiceButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div onClick={generateWallet} className="bg-card border-2 border-border hover:border-primary p-6 rounded-2xl cursor-pointer transition-all group relative overflow-hidden">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-primary"><Lock size={24} /></div>
              <h3 className="text-xl font-bold text-foreground mb-2">Generate Seed Phrase</h3>
              <p className="text-muted-foreground text-sm mb-4">Create a self-custodial wallet locally. You control the keys.</p>
              <span className="text-primary font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">Create Now <ArrowRight size={16} /></span>
            </div>
            <div onClick={() => alert("Redirecting to external provider...")} className="bg-card border-2 border-border hover:border-secondary p-6 rounded-2xl cursor-pointer transition-all group">
              <div className="bg-secondary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-secondary"><Globe size={24} /></div>
              <h3 className="text-xl font-bold text-foreground mb-2">Connect Provider</h3>
              <p className="text-muted-foreground text-sm mb-4">Link an existing wallet like MetaMask, Coinbase Wallet, or Phantom.</p>
              <span className="text-secondary font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">Connect <ArrowRight size={16} /></span>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl animate-fade-in">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-foreground">Your Secret Recovery Phrase</h3>
                <p className="text-sm text-muted-foreground">For {selectedChain} Network</p>
              </div>
              <button onClick={() => setShowSeed(!showSeed)} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                {showSeed ? <><EyeOff size={16} /> Hide</> : <><Eye size={16} /> Show</>}
              </button>
            </div>
            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-6 rounded-2xl border ${showSeed ? 'bg-muted border-border' : 'bg-dark border-dark'}`}>
              {seedPhrase?.map((word, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-muted-foreground select-none text-xs">{idx + 1}</span>
                  <span className={`font-mono font-bold ${showSeed ? 'text-foreground' : 'blur-md text-white select-none'}`}>{word}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <ChoiceButton onClick={copyToClipboard} variant="outline" className="flex-1">
                {copied ? <><Check size={18} className="mr-2" /> Copied</> : <><Copy size={18} className="mr-2" /> Copy to Clipboard</>}
              </ChoiceButton>
              <ChoiceButton className="flex-1" onClick={() => { setSeedPhrase(null); setStep(1); }}>I Saved It</ChoiceButton>
            </div>
            <p className="text-destructive text-sm font-medium text-center bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              Warning: Never share this phrase with anyone. Store it securely offline.
            </p>
          </div>
        </div>
      )}

      {/* Coins overview always visible at the bottom */}
      <div className="border-t border-border pt-8 mt-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">Multi-Currency Wallets</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {WALLET_DATA.map(wallet => (
            <div key={wallet.symbol} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all group flex flex-col relative overflow-hidden">
              <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-xl ${wallet.risk === 'Low' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{wallet.risk} Risk</div>
              <div className="flex justify-between items-start mb-4">
                <div className={`${wallet.bg} p-3 rounded-xl ${wallet.color}`}><Coins size={24} /></div>
                <span className="text-xs font-bold bg-muted text-muted-foreground px-2 py-1 rounded mr-12">{wallet.symbol}</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{wallet.name}</h3>
              <div className="flex items-start gap-2 mb-4 bg-muted p-3 rounded-lg min-h-[80px]">
                <BookOpen size={16} className="text-muted-foreground mt-1 shrink-0" />
                <p className="text-sm text-muted-foreground leading-snug">{wallet.description}</p>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-3">
                <ChoiceButton variant="secondary" className="w-full text-xs" onClick={() => window.open(wallet.url, '_blank')}>
                  <Globe size={14} className="mr-2" /> Visit
                </ChoiceButton>
                <ChoiceButton variant="primary" className="w-full text-xs" onClick={() => navigateToCreate(wallet.name)}>
                  Create
                </ChoiceButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletManagerPage;
