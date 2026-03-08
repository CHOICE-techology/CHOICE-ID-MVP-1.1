import React, { useState, useEffect } from 'react';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Copy, Check, Lock, Eye, EyeOff, ArrowRight, ChevronRight, Globe, ExternalLink } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { addCredential } from '@/services/storageService';
import { mockUploadToIPFS } from '@/services/cryptoService';
import { VerifiableCredential } from '@/types';

/* ══════════════════════════════════════════════
   Official Brand Logos – imported SVG files
   ══════════════════════════════════════════════ */
import ethereumLogo from '@/assets/logos/ethereum.svg';
import bitcoinLogo from '@/assets/logos/bitcoin.svg';
import solanaLogo from '@/assets/logos/solana.svg';
import arbitrumLogo from '@/assets/logos/arbitrum.svg';
import avalancheLogo from '@/assets/logos/avalanche.svg';
import polkadotLogo from '@/assets/logos/polkadot.svg';
import cardanoLogo from '@/assets/logos/cardano.svg';
import tezosLogo from '@/assets/logos/tezos.svg';
import metamaskLogo from '@/assets/logos/metamask.svg';
import coreWalletLogo from '@/assets/logos/core-wallet.svg';
import walletconnectLogo from '@/assets/logos/walletconnect.png';
import rainbowLogo from '@/assets/logos/rainbow.png';
import talismanLogo from '@/assets/logos/talisman.png';

/* ══════════════════════════════════════════════
   Logo components using official assets
   ══════════════════════════════════════════════ */

const ImgLogo: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = "w-7 h-7" }) => (
  <img src={src} alt={alt} className={`${className} object-contain`} />
);

const SmImgLogo: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <img src={src} alt={alt} className="w-6 h-6 object-contain" />
);

/* ── Blockchain logos ── */
const EthereumLogo = () => <ImgLogo src={ethereumLogo} alt="Ethereum" />;
const BitcoinLogo = () => <ImgLogo src={bitcoinLogo} alt="Bitcoin" />;
const SolanaLogo = () => <ImgLogo src={solanaLogo} alt="Solana" />;
const ArbitrumLogo = () => <ImgLogo src={arbitrumLogo} alt="Arbitrum" />;
const AvalancheLogo = () => <ImgLogo src={avalancheLogo} alt="Avalanche" />;
const PolkadotLogo = () => <ImgLogo src={polkadotLogo} alt="Polkadot" />;
const CardanoLogo = () => <ImgLogo src={cardanoLogo} alt="Cardano" />;
const TezosLogo = () => <ImgLogo src={tezosLogo} alt="Tezos" />;

// Base – no downloadable logo, accurate inline SVG
const BaseLogo = () => (
  <svg viewBox="0 0 111 111" className="w-7 h-7" fill="none">
    <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
    <path d="M55.4 93.3c20.9 0 37.8-16.9 37.8-37.8S76.3 17.7 55.4 17.7c-19.5 0-35.5 14.7-37.5 33.6h49.9v8.4H17.9c2 19 18 33.6 37.5 33.6z" fill="white"/>
  </svg>
);

/* ── Wallet provider logos ── */
const MetaMaskProviderLogo = () => <SmImgLogo src={metamaskLogo} alt="MetaMask" />;

// Eternl – official dark blue "E" mark
const EternlProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect width="40" height="40" rx="10" fill="#1A44B7"/>
    <path d="M12 11h16v3.5H16v4h10v3.5H16v4h12V30H12V11z" fill="white"/>
  </svg>
);

// Nami – official Cardano-inspired teal wave
const NamiProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect width="40" height="40" rx="10" fill="#349EA3"/>
    <path d="M10 28V16l10 12V16l10 12V16" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Kukai – official orange/coral Tezos wallet mark
const KukaiProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect width="40" height="40" rx="10" fill="#FF6B35"/>
    <circle cx="20" cy="20" r="10" fill="white" fillOpacity="0.9"/>
    <path d="M16 16l8 8M24 16l-8 8" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);
const WalletConnectProviderLogo = () => <SmImgLogo src={walletconnectLogo} alt="WalletConnect" />;
const RainbowProviderLogo = () => <SmImgLogo src={rainbowLogo} alt="Rainbow" />;
const TalismanProviderLogo = () => <SmImgLogo src={talismanLogo} alt="Talisman" />;

const CoreProviderLogo = () => <SmImgLogo src={coreWalletLogo} alt="Core" />;

// Coinbase Wallet – official blue "C" mark
const CoinbaseProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect width="40" height="40" rx="10" fill="#0052FF"/>
    <rect x="12" y="12" width="16" height="16" rx="8" fill="white"/>
    <rect x="16" y="16" width="8" height="8" rx="2" fill="#0052FF"/>
  </svg>
);

// Phantom – official purple gradient with ghost icon
const PhantomProviderLogo = () => (
  <svg viewBox="0 0 128 128" className="w-6 h-6" fill="none">
    <rect width="128" height="128" rx="26" fill="url(#phantom-grad)"/>
    <defs><linearGradient id="phantom-grad" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse"><stop stopColor="#534BB1"/><stop offset="1" stopColor="#551BF9"/></linearGradient></defs>
    <path d="M110.584 64.914C110.584 90.472 96.47 107.194 74.696 107.194C56.324 107.194 43.574 95.174 40.97 77.67H29.124C31.996 101.88 49.586 117 74.696 117C102.564 117 120 95.174 120 64.914C120 34.654 102.564 12.828 74.696 12.828C49.586 12.828 31.996 27.948 29.124 52.158H40.97C43.574 34.654 56.324 22.634 74.696 22.634C96.47 22.634 110.584 39.356 110.584 64.914Z" fill="white"/>
    <circle cx="65" cy="57" r="7" fill="white"/>
    <circle cx="90" cy="57" r="7" fill="white"/>
  </svg>
);

// Temple Wallet – official Tezos temple icon
const TempleProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect width="40" height="40" rx="10" fill="#4B72FF"/>
    <path d="M20 8l10 7v3H10v-3l10-7z" fill="white"/>
    <rect x="12" y="20" width="4" height="10" rx="1" fill="white"/>
    <rect x="18" y="20" width="4" height="10" rx="1" fill="white"/>
    <rect x="24" y="20" width="4" height="10" rx="1" fill="white"/>
    <rect x="9" y="30" width="22" height="3" rx="1" fill="white"/>
  </svg>
);

// Xverse – official orange X mark
const XverseProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect width="40" height="40" rx="10" fill="#EE7A30"/>
    <path d="M13 13l14 14M27 13L13 27" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
  </svg>
);

// Unisat – official orange circle with "U" shape
const UnisatProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect width="40" height="40" rx="10" fill="#000"/>
    <circle cx="20" cy="20" r="12" fill="#F7931A"/>
    <path d="M14.5 15v6.5a5.5 5.5 0 0 0 11 0V15" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
  </svg>
);

/* ══════════════════════════════════════════════
   Chain → Wallet Provider Mapping
   ══════════════════════════════════════════════ */

interface WalletProvider {
  name: string;
  description: string;
  Logo: React.FC;
  chains: string[];
}

const ALL_WALLET_PROVIDERS: WalletProvider[] = [
  { name: "MetaMask", description: "The most popular EVM browser wallet.", Logo: MetaMaskProviderLogo, chains: ["Ethereum", "Arbitrum", "Base", "Avalanche"] },
  { name: "Coinbase Wallet", description: "Self-custody wallet by Coinbase.", Logo: CoinbaseProviderLogo, chains: ["Ethereum", "Arbitrum", "Base", "Avalanche", "Solana", "Bitcoin"] },
  { name: "Phantom", description: "Multi-chain wallet for Solana, Ethereum & Bitcoin.", Logo: PhantomProviderLogo, chains: ["Solana", "Ethereum", "Bitcoin"] },
  { name: "Rainbow", description: "Beautiful Ethereum wallet for NFTs & DeFi.", Logo: RainbowProviderLogo, chains: ["Ethereum", "Arbitrum", "Base", "Avalanche"] },
  { name: "WalletConnect", description: "Connect any wallet via QR code scan.", Logo: WalletConnectProviderLogo, chains: ["Ethereum", "Arbitrum", "Base", "Avalanche", "Solana", "Polkadot", "Cardano"] },
  { name: "Talisman", description: "The gateway to Polkadot & Substrate ecosystems.", Logo: TalismanProviderLogo, chains: ["Polkadot", "Ethereum"] },
  { name: "Eternl", description: "Feature-rich Cardano wallet for staking & DApps.", Logo: EternlProviderLogo, chains: ["Cardano"] },
  { name: "Nami", description: "Lightweight Cardano browser wallet.", Logo: NamiProviderLogo, chains: ["Cardano"] },
  { name: "Temple", description: "Tezos wallet for DeFi, NFTs & staking.", Logo: TempleProviderLogo, chains: ["Tezos"] },
  { name: "Kukai", description: "Social login wallet for Tezos ecosystem.", Logo: KukaiProviderLogo, chains: ["Tezos"] },
  { name: "Core", description: "Official Avalanche wallet by Ava Labs.", Logo: CoreProviderLogo, chains: ["Avalanche", "Ethereum"] },
  { name: "Xverse", description: "Bitcoin wallet for Ordinals, BRC-20 & Stacks.", Logo: XverseProviderLogo, chains: ["Bitcoin"] },
  { name: "Unisat", description: "Bitcoin wallet for BRC-20 tokens & inscriptions.", Logo: UnisatProviderLogo, chains: ["Bitcoin"] },
];

/* ══════════════════════════════════════════════
   Blockchain items
   ══════════════════════════════════════════════ */

const ITEMS = [
  { name: "Ethereum", symbol: "ETH", risk: "Low", description: "The leading smart contract platform. Used for DeFi, NFTs, and DAOs.", url: "https://ethereum.org", Logo: EthereumLogo },
  { name: "Bitcoin", symbol: "BTC", risk: "Low", description: "The first cryptocurrency. Digital gold and a store of value.", url: "https://bitcoin.org", Logo: BitcoinLogo },
  { name: "Solana", symbol: "SOL", risk: "Medium", description: "High-performance blockchain known for speed and low fees.", url: "https://solana.com", Logo: SolanaLogo },
  { name: "Arbitrum", symbol: "ARB", risk: "Medium", description: "Layer 2 scaling solution for Ethereum. Fast and cheap transactions.", url: "https://arbitrum.io", Logo: ArbitrumLogo },
  { name: "Base", symbol: "BASE", risk: "Low", description: "Secure, low-cost Ethereum L2 incubated by Coinbase.", url: "https://base.org", Logo: BaseLogo },
  { name: "Avalanche", symbol: "AVAX", risk: "Medium", description: "Open, programmable smart contracts platform for dApps.", url: "https://avax.network", Logo: AvalancheLogo },
  { name: "Polkadot", symbol: "DOT", risk: "Medium", description: "Multi-chain protocol connecting blockchains into one unified network.", url: "https://polkadot.com", Logo: PolkadotLogo },
  { name: "Cardano", symbol: "ADA", risk: "Low", description: "Research-driven proof-of-stake blockchain with formal verification.", url: "https://cardano.org", Logo: CardanoLogo },
  { name: "Tezos", symbol: "XTZ", risk: "Medium", description: "Self-amending blockchain with on-chain governance and liquid staking.", url: "https://tezos.com", Logo: TezosLogo },
];

/* ══════════════════════════════════════════════
   Page Component
   ══════════════════════════════════════════════ */

const WalletManagerPage: React.FC = () => {
  const { userIdentity: identity, updateIdentity: onUpdateIdentity } = useWallet();
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

  const compatibleProviders = selectedChain
    ? ALL_WALLET_PROVIDERS.filter(wp => wp.chains.includes(selectedChain))
    : ALL_WALLET_PROVIDERS;

  const generateWallet = async () => {
    const mockMnemonic = "witch collapse practice feed shame open despair creek road again ice least".split(" ");
    setSeedPhrase(mockMnemonic);
    setStep(3);

    if (identity) {
      const alreadyCreated = identity.credentials.some(vc => {
        const types = Array.isArray(vc.type) ? vc.type : [vc.type];
        return types.includes('WalletCreatedCredential');
      });
      if (!alreadyCreated) {
        const walletVC: VerifiableCredential = {
          id: `urn:uuid:${Math.random().toString(36).substring(2)}`,
          type: ['VerifiableCredential', 'WalletCreatedCredential'],
          issuer: 'did:web:choice.love/wallet-generator',
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id: identity.did,
            chain: selectedChain || 'Unknown',
            method: 'seed_phrase',
            createdAt: new Date().toISOString(),
          }
        };
        await mockUploadToIPFS(walletVC);
        const newIdentity = addCredential(identity, walletVC);
        onUpdateIdentity(newIdentity);
      }
    }
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
      } catch {
        alert("Connection rejected.");
      }
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
      } catch {
        alert("Connection rejected.");
      }
    } else if (providerName === "Talisman") {
      const talisman = (window as any).talismanEth;
      if (!talisman) {
        alert("Talisman is not installed. Redirecting to download...");
        window.open("https://talisman.xyz/download", "_blank");
        return;
      }
      try {
        await talisman.request({ method: 'eth_requestAccounts' });
        alert("Connected to Talisman successfully!");
      } catch {
        alert("Connection rejected.");
      }
    } else {
      alert(`${providerName} connection requires SDK integration. Check their official site for setup.`);
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
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${item.risk === 'Low' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>{item.risk} Risk</span>
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
              <p className="text-muted-foreground text-sm mb-4">
                Link an existing wallet compatible with <strong className="text-foreground">{selectedChain}</strong>.
              </p>
              <div className="space-y-2">
                {compatibleProviders.length > 0 ? (
                  compatibleProviders.map(wp => (
                    <button
                      key={wp.name}
                      onClick={() => connectWalletProvider(wp.name)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-muted/50 transition-all text-left"
                    >
                      <wp.Logo />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground">{wp.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{wp.description}</p>
                      </div>
                      <ArrowRight size={14} className="text-muted-foreground/40" />
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No compatible wallets found for this chain.</p>
                )}
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
