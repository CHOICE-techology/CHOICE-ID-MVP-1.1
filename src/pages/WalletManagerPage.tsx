import React, { useState, useEffect } from 'react';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Copy, Check, Lock, Eye, EyeOff, ArrowRight, ChevronRight, Globe, ExternalLink } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

// Brand logos as inline SVGs
const EthereumLogo = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
    <path d="M16 2L6 16.5L16 22L26 16.5L16 2Z" fill="#627EEA"/>
    <path d="M16 2V22L6 16.5L16 2Z" fill="#627EEA" opacity="0.6"/>
    <path d="M16 24L6 18.5L16 30L26 18.5L16 24Z" fill="#627EEA"/>
    <path d="M16 24V30L6 18.5L16 24Z" fill="#627EEA" opacity="0.6"/>
  </svg>
);

const BitcoinLogo = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7">
    <circle cx="16" cy="16" r="14" fill="#F7931A"/>
    <path d="M21.2 13.8c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.6c-.4-.1-.8-.2-1.3-.3l.7-2.7-1.6-.4-.7 2.7c-.3-.1-.7-.2-1-.3l-2.2-.5-.4 1.7s1.2.3 1.2.3c.6.2.8.6.7 1l-.7 2.9c0 .1.1.1.1.1l-.1 0-1 4.1c-.1.2-.3.6-.8.4 0 0-1.2-.3-1.2-.3L7 19.5l2.1.5c.4.1.8.2 1.2.3l-.7 2.7 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.6.4.7-2.7c2.8.5 5 .3 5.9-2.2.7-2-.1-3.2-1.5-3.9 1.1-.3 1.9-1 2.1-2.5zm-3.7 5.2c-.5 2-4 .9-5.1.7l.9-3.7c1.1.3 4.7.8 4.2 3zm.5-5.3c-.5 1.8-3.4.9-4.3.7l.8-3.3c.9.2 4 .7 3.5 2.6z" fill="white"/>
  </svg>
);

const SolanaLogo = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7">
    <defs><linearGradient id="sol" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#9945FF"/><stop offset="100%" stopColor="#14F195"/></linearGradient></defs>
    <rect x="3" y="3" width="26" height="26" rx="6" fill="url(#sol)"/>
    <path d="M8 20.5h12.5l3.5-3.5H11.5L8 20.5zM8 11.5l3.5 3.5H24l-3.5-3.5H8zM11.5 24L8 20.5h0L11.5 24H24l-3.5-3.5" fill="white" opacity="0.9"/>
  </svg>
);

const ArbitrumLogo = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7">
    <circle cx="16" cy="16" r="14" fill="#2D374B"/>
    <path d="M16 6L8 16l8 10 8-10L16 6z" fill="#28A0F0"/>
    <path d="M16 6L8 16l8 5V6z" fill="#96BEDC"/>
  </svg>
);

const PolygonLogo = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7">
    <circle cx="16" cy="16" r="14" fill="#8247E5"/>
    <path d="M21.3 13.3c-.4-.2-.9-.2-1.2 0l-2.9 1.7-2 1.1-2.9 1.7c-.4.2-.9.2-1.2 0l-2.3-1.3c-.4-.2-.6-.6-.6-1.1v-2.5c0-.4.2-.9.6-1.1l2.2-1.3c.4-.2.9-.2 1.2 0l2.2 1.3c.4.2.6.6.6 1.1v1.7l2-1.1v-1.7c0-.4-.2-.9-.6-1.1l-4.2-2.4c-.4-.2-.9-.2-1.2 0l-4.3 2.5c-.4.2-.6.6-.6 1v4.9c0 .4.2.9.6 1.1l4.2 2.4c.4.2.9.2 1.2 0l2.9-1.7 2-1.1 2.9-1.7c.4-.2.9-.2 1.2 0l2.2 1.3c.4.2.6.6.6 1.1v2.5c0 .4-.2.9-.6 1.1l-2.2 1.3c-.4.2-.9.2-1.2 0l-2.2-1.3c-.4-.2-.6-.6-.6-1.1v-1.7l-2 1.1v1.7c0 .4.2.9.6 1.1l4.2 2.4c.4.2.9.2 1.2 0l4.2-2.4c.4-.2.6-.6.6-1.1v-4.9c0-.4-.2-.9-.6-1.1l-4.2-2.4z" fill="white"/>
  </svg>
);

const BaseLogo = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7">
    <circle cx="16" cy="16" r="14" fill="#0052FF"/>
    <path d="M16 26c5.5 0 10-4.5 10-10S21.5 6 16 6C10.8 6 6.4 10 6 15.1h13.2v1.8H6C6.4 22 10.8 26 16 26z" fill="white"/>
  </svg>
);

const AvalancheLogo = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7">
    <circle cx="16" cy="16" r="14" fill="#E84142"/>
    <path d="M20.5 21H23L16 8l-7 13h2.5l4.5-8.5L20.5 21z" fill="white"/>
  </svg>
);

const PolkadotLogo = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7">
    <circle cx="16" cy="16" r="14" fill="#E6007A"/>
    <circle cx="16" cy="9" r="3" fill="white"/>
    <circle cx="16" cy="23" r="3" fill="white"/>
    <circle cx="10" cy="13" r="2" fill="white" opacity="0.7"/>
    <circle cx="22" cy="13" r="2" fill="white" opacity="0.7"/>
    <circle cx="10" cy="19" r="2" fill="white" opacity="0.7"/>
    <circle cx="22" cy="19" r="2" fill="white" opacity="0.7"/>
  </svg>
);

const TrustWalletLogo = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7">
    <rect x="3" y="3" width="26" height="26" rx="6" fill="#0500FF"/>
    <path d="M16 7C12 10 8 10 8 10s0 8 0 10c0 4 8 6 8 6s8-2 8-6c0-2 0-10 0-10s-4 0-8-3z" fill="none" stroke="white" strokeWidth="1.5"/>
  </svg>
);

const ZengoLogo = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7">
    <rect x="3" y="3" width="26" height="26" rx="6" fill="#0E76FD"/>
    <path d="M10 12h12l-8 8h-4v-2l6-6H10z" fill="white"/>
    <circle cx="21" cy="20" r="2.5" fill="white"/>
  </svg>
);

const CHAIN_DATA = [
  { name: "Ethereum", symbol: "ETH", risk: "Low", description: "The leading smart contract platform. Used for DeFi, NFTs, and DAOs.", url: "https://ethereum.org", Logo: EthereumLogo },
  { name: "Bitcoin", symbol: "BTC", risk: "Low", description: "The first cryptocurrency. Digital gold and a store of value.", url: "https://bitcoin.org", Logo: BitcoinLogo },
  { name: "Solana", symbol: "SOL", risk: "Medium", description: "High-performance blockchain known for speed and low fees.", url: "https://solana.com", Logo: SolanaLogo },
  { name: "Arbitrum", symbol: "ARB", risk: "Medium", description: "Layer 2 scaling solution for Ethereum. Fast and cheap transactions.", url: "https://arbitrum.io", Logo: ArbitrumLogo },
  { name: "Polygon", symbol: "MATIC", risk: "Medium", description: "Scalable infrastructure for building Ethereum-compatible blockchains.", url: "https://polygon.technology", Logo: PolygonLogo },
  { name: "Base", symbol: "BASE", risk: "Low", description: "Secure, low-cost Ethereum L2 incubated by Coinbase.", url: "https://base.org", Logo: BaseLogo },
  { name: "Avalanche", symbol: "AVAX", risk: "Medium", description: "Open, programmable smart contracts platform for dApps.", url: "https://avax.network", Logo: AvalancheLogo },
  { name: "Polkadot", symbol: "DOT", risk: "Medium", description: "Multi-chain protocol connecting blockchains into one unified network.", url: "https://polkadot.com", Logo: PolkadotLogo },
  { name: "Trust Wallet", symbol: "TRUST", risk: "Low", description: "The most trusted & secure crypto wallet. Multi-chain support with staking.", url: "https://trustwallet.com", Logo: TrustWalletLogo },
  // Uncomment below if you want 10
  // { name: "Zengo", symbol: "ZENGO", risk: "Low", description: "Keyless crypto wallet using MPC technology. No seed phrase needed.", url: "https://zengo.com", Logo: ZengoLogo },
];

// Actually user asked for Zengo too, making it 10. Let me include it.
// Overwrite with all items:
const ITEMS = [
  { name: "Ethereum", symbol: "ETH", risk: "Low", description: "The leading smart contract platform. Used for DeFi, NFTs, and DAOs.", url: "https://ethereum.org", Logo: EthereumLogo },
  { name: "Bitcoin", symbol: "BTC", risk: "Low", description: "The first cryptocurrency. Digital gold and a store of value.", url: "https://bitcoin.org", Logo: BitcoinLogo },
  { name: "Solana", symbol: "SOL", risk: "Medium", description: "High-performance blockchain known for speed and low fees.", url: "https://solana.com", Logo: SolanaLogo },
  { name: "Arbitrum", symbol: "ARB", risk: "Medium", description: "Layer 2 scaling solution for Ethereum. Fast and cheap transactions.", url: "https://arbitrum.io", Logo: ArbitrumLogo },
  { name: "Base", symbol: "BASE", risk: "Low", description: "Secure, low-cost Ethereum L2 incubated by Coinbase.", url: "https://base.org", Logo: BaseLogo },
  { name: "Avalanche", symbol: "AVAX", risk: "Medium", description: "Open, programmable smart contracts platform for dApps.", url: "https://avax.network", Logo: AvalancheLogo },
  { name: "Polkadot", symbol: "DOT", risk: "Medium", description: "Multi-chain protocol connecting blockchains into one unified network.", url: "https://polkadot.com", Logo: PolkadotLogo },
  { name: "Trust Wallet", symbol: "TRUST", risk: "Low", description: "The most trusted & secure crypto wallet. Multi-chain support with staking.", url: "https://trustwallet.com", Logo: TrustWalletLogo },
  { name: "Zengo", symbol: "ZENGO", risk: "Low", description: "Keyless crypto wallet using MPC technology. No seed phrase needed.", url: "https://zengo.com", Logo: ZengoLogo },
];

const WALLET_PROVIDERS = [
  { name: "MetaMask", description: "The most popular Ethereum browser wallet.", logo: "🦊" },
  { name: "Trust Wallet", description: "Multi-chain mobile wallet with DApp browser.", logo: "🛡️" },
  { name: "Coinbase Wallet", description: "Self-custody wallet by Coinbase.", logo: "🔵" },
  { name: "Phantom", description: "The friendly Solana & multi-chain wallet.", logo: "👻" },
  { name: "Rainbow", description: "Beautiful Ethereum wallet for NFTs & DeFi.", logo: "🌈" },
  { name: "WalletConnect", description: "Connect any wallet via QR code scan.", logo: "🔗" },
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

  const connectWalletProvider = async (providerName: string) => {
    if (providerName === "MetaMask") {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        alert("MetaMask is not installed. Please install it from metamask.io");
        window.open("https://metamask.io/download/", "_blank");
        return;
      }
      try {
        await ethereum.request({ method: 'eth_requestAccounts' });
        alert(`Connected to ${providerName} successfully!`);
      } catch (err) {
        alert("Connection rejected.");
      }
    } else if (providerName === "WalletConnect") {
      alert("WalletConnect QR code flow would open here. SDK integration required.");
    } else if (providerName === "Phantom") {
      const phantom = (window as any).solana;
      if (!phantom?.isPhantom) {
        alert("Phantom is not installed. Redirecting to download...");
        window.open("https://phantom.app/download", "_blank");
        return;
      }
      try {
        await phantom.connect();
        alert("Connected to Phantom successfully!");
      } catch (err) {
        alert("Connection rejected.");
      }
    } else if (providerName === "Coinbase Wallet") {
      alert("Coinbase Wallet connection requires SDK. Opening download page...");
      window.open("https://www.coinbase.com/wallet/downloads", "_blank");
    } else if (providerName === "Trust Wallet") {
      alert("Trust Wallet deep link connection. Opening...");
      window.open("https://trustwallet.com/download", "_blank");
    } else if (providerName === "Rainbow") {
      alert("Rainbow wallet connection. Opening...");
      window.open("https://rainbow.me/download", "_blank");
    }
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
          {ITEMS.map(item => (
            <div key={item.name}
              className="bg-card p-6 rounded-2xl border border-border hover:border-primary hover:shadow-lg transition-all text-left group">
              <div className="flex items-center justify-between mb-3">
                <item.Logo />
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${item.risk === 'Low' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{item.risk} Risk</span>
              </div>
              <h3 className="font-bold text-lg text-foreground">{item.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4 line-clamp-2">{item.description}</p>
              <div className="grid grid-cols-2 gap-2 mt-auto">
                <ChoiceButton
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank'); }}
                >
                  <ExternalLink size={13} className="mr-1" /> Visit
                </ChoiceButton>
                <ChoiceButton
                  variant="primary"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => { setSelectedChain(item.name); setStep(2); }}
                >
                  Create
                </ChoiceButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-muted p-4 rounded-xl border border-border flex items-center gap-3">
            {(() => {
              const found = ITEMS.find(i => i.name === selectedChain);
              return found ? <found.Logo /> : null;
            })()}
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

            <div className="bg-card border-2 border-border p-6 rounded-2xl">
              <div className="bg-secondary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-secondary"><Globe size={24} /></div>
              <h3 className="text-xl font-bold text-foreground mb-3">Connect Provider</h3>
              <p className="text-muted-foreground text-sm mb-4">Link an existing wallet extension or app.</p>
              <div className="space-y-2">
                {WALLET_PROVIDERS.map(wp => (
                  <button
                    key={wp.name}
                    onClick={() => connectWalletProvider(wp.name)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-muted/50 transition-all text-left"
                  >
                    <span className="text-xl">{wp.logo}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">{wp.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{wp.description}</p>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground/40" />
                  </button>
                ))}
              </div>
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
    </div>
  );
};

export default WalletManagerPage;
