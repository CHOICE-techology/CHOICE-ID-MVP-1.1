import React, { useState, useEffect } from 'react';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Copy, Check, Lock, Eye, EyeOff, ArrowRight, ChevronRight, Globe, ExternalLink } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { addCredential } from '@/services/storageService';
import { mockUploadToIPFS } from '@/services/cryptoService';
import { VerifiableCredential } from '@/types';

/* ══════════════════════════════════════════════
   Official Brand Logos – Blockchain Networks
   ══════════════════════════════════════════════ */

const EthereumLogo = () => (
  <svg viewBox="0 0 256 417" className="w-7 h-7" fill="none">
    <path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" fill="#343434"/>
    <path d="M127.962 0L0 212.32l127.962 75.639V154.158z" fill="#8C8C8C"/>
    <path d="M127.962 312.187l-1.575 1.92V414.45l1.575 4.6L256 236.587z" fill="#3C3C3B"/>
    <path d="M127.962 419.05V312.188L0 236.585z" fill="#8C8C8C"/>
    <path d="M127.962 287.958l127.961-75.637-127.961-58.162z" fill="#141414"/>
    <path d="M0 212.32l127.96 75.64V154.159z" fill="#393939"/>
  </svg>
);

const BitcoinLogo = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7">
    <circle cx="16" cy="16" r="14" fill="#F7931A"/>
    <path d="M21.2 13.8c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.6c-.4-.1-.8-.2-1.3-.3l.7-2.7-1.6-.4-.7 2.7c-.3-.1-.7-.2-1-.3l-2.2-.5-.4 1.7s1.2.3 1.2.3c.6.2.8.6.7 1l-.7 2.9c0 .1.1.1.1.1l-.1 0-1 4.1c-.1.2-.3.6-.8.4 0 0-1.2-.3-1.2-.3L7 19.5l2.1.5c.4.1.8.2 1.2.3l-.7 2.7 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.6.4.7-2.7c2.8.5 5 .3 5.9-2.2.7-2-.1-3.2-1.5-3.9 1.1-.3 1.9-1 2.1-2.5zm-3.7 5.2c-.5 2-4 .9-5.1.7l.9-3.7c1.1.3 4.7.8 4.2 3zm.5-5.3c-.5 1.8-3.4.9-4.3.7l.8-3.3c.9.2 4 .7 3.5 2.6z" fill="white"/>
  </svg>
);

const SolanaLogo = () => (
  <svg viewBox="0 0 397 311" className="w-7 h-7" fill="none">
    <defs><linearGradient id="sol-a" x1="360" y1="0" x2="141" y2="311" gradientUnits="userSpaceOnUse"><stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/></linearGradient></defs>
    <path d="M64.6 237.9a12.2 12.2 0 0 1 8.6-3.6h317.4a6.1 6.1 0 0 1 4.3 10.4l-61.3 61.4a12.2 12.2 0 0 1-8.6 3.5H7.6a6.1 6.1 0 0 1-4.3-10.4l61.3-61.3z" fill="url(#sol-a)"/>
    <path d="M64.6 3.8A12.5 12.5 0 0 1 73.2 0h317.4a6.1 6.1 0 0 1 4.3 10.4l-61.3 61.4a12.2 12.2 0 0 1-8.6 3.5H7.6a6.1 6.1 0 0 1-4.3-10.4L64.6 3.8z" fill="url(#sol-a)"/>
    <path d="M333 120.6a12.2 12.2 0 0 0-8.6-3.6H7a6.1 6.1 0 0 0-4.3 10.4l61.3 61.4a12.2 12.2 0 0 0 8.6 3.5h317.4a6.1 6.1 0 0 0 4.3-10.4L333 120.6z" fill="url(#sol-a)"/>
  </svg>
);

// Official Arbitrum logo – stylized "A" in blue circle
const ArbitrumLogo = () => (
  <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
    <rect width="40" height="40" rx="20" fill="#213147"/>
    <path d="M20.7 9.5l7.8 13.5c.3.5.3 1.1 0 1.6l-2.8 4.9c-.3.5-.8.8-1.4.8h-1.1l-6-10.4 3.5-6.1-1.4-2.4-.7-1.2c.3-.5.8-.8 1.4-.8h.7z" fill="#28A0F0"/>
    <path d="M23.2 30.3h-1.1l-2.4-4.2-2.4 4.2h-1.1c-.6 0-1.1-.3-1.4-.8l-2.8-4.9c-.3-.5-.3-1.1 0-1.6l7.8-13.5h.7c.6 0 1.1.3 1.4.8l5.3 9.2-6 10.4c-.3.5-.8.8-1.4.8l1.4.1z" fill="white"/>
    <path d="M14.1 25.4l-1.3 2.3c-.2.3-.1.7.2.9l1.3.8 1.4-2.5-1.6-1.5z" fill="#28A0F0"/>
    <path d="M25.9 25.4l1.3 2.3c.2.3.1.7-.2.9l-1.3.8-1.4-2.5 1.6-1.5z" fill="#28A0F0"/>
  </svg>
);

const BaseLogo = () => (
  <svg viewBox="0 0 111 111" className="w-7 h-7" fill="none">
    <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
    <path d="M55.4 93.3c20.9 0 37.8-16.9 37.8-37.8S76.3 17.7 55.4 17.7c-19.5 0-35.5 14.7-37.5 33.6h49.9v8.4H17.9c2 19 18 33.6 37.5 33.6z" fill="white"/>
  </svg>
);

const AvalancheLogo = () => (
  <svg viewBox="0 0 254 254" className="w-7 h-7" fill="none">
    <circle cx="127" cy="127" r="127" fill="#E84142"/>
    <path d="M171.8 170.3h27.4L132.5 56.6c-3.9-7.2-10.3-7.2-14.2 0L99 92.5l19.2 35.1c3.3-6 9.5-6 12.8 0l40.8 42.7z" fill="white"/>
    <path d="M99 92.5L58.8 170.3h27.4l21.3-42.7L99 92.5z" fill="white"/>
  </svg>
);

// Official Polkadot logo – pink circle with dot pattern
const PolkadotLogo = () => (
  <svg viewBox="0 0 80 80" className="w-7 h-7" fill="none">
    <circle cx="40" cy="40" r="40" fill="#E6007A"/>
    <circle cx="40" cy="16" r="7" fill="white"/>
    <circle cx="40" cy="64" r="7" fill="white"/>
    <circle cx="40" cy="40" r="7" fill="white"/>
    <circle cx="23" cy="28" r="4.5" fill="white"/>
    <circle cx="57" cy="28" r="4.5" fill="white"/>
    <circle cx="23" cy="52" r="4.5" fill="white"/>
    <circle cx="57" cy="52" r="4.5" fill="white"/>
  </svg>
);

// Official Cardano logo – starburst pattern
const CardanoLogo = () => (
  <svg viewBox="0 0 375 346" className="w-7 h-7" fill="none">
    <circle cx="187.5" cy="173" r="170" fill="#0033AD"/>
    <circle cx="187.5" cy="173" r="50" fill="white"/>
    <circle cx="187.5" cy="70" r="16" fill="white"/>
    <circle cx="187.5" cy="276" r="16" fill="white"/>
    <circle cx="98" cy="121" r="16" fill="white"/>
    <circle cx="277" cy="121" r="16" fill="white"/>
    <circle cx="98" cy="225" r="16" fill="white"/>
    <circle cx="277" cy="225" r="16" fill="white"/>
    <circle cx="130" cy="90" r="10" fill="white" opacity="0.7"/>
    <circle cx="245" cy="90" r="10" fill="white" opacity="0.7"/>
    <circle cx="130" cy="256" r="10" fill="white" opacity="0.7"/>
    <circle cx="245" cy="256" r="10" fill="white" opacity="0.7"/>
    <circle cx="80" cy="173" r="10" fill="white" opacity="0.7"/>
    <circle cx="295" cy="173" r="10" fill="white" opacity="0.7"/>
  </svg>
);

// Official Tezos logo – angular "T" shape
const TezosLogo = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
    <circle cx="16" cy="16" r="15" fill="#2C7DF7"/>
    <path d="M22.5 10.5h-4.8v-3h-3.4v3H9.5v3h4.8v8.3c0 2.4 1.5 3.7 3.7 3.7 1 0 2-.3 2.6-.7l-.8-2.5c-.3.2-.7.3-1.1.3-.8 0-1.3-.5-1.3-1.4v-7.7h4.8l.3-3z" fill="white"/>
  </svg>
);

/* ══════════════════════════════════════════════
   Official Brand Logos – Wallet Providers
   ══════════════════════════════════════════════ */

const MetaMaskProviderLogo = () => (
  <svg viewBox="0 0 35 33" className="w-6 h-6" fill="none">
    <path d="M32.958 1l-13.134 9.718 2.442-5.727z" fill="#E17726" stroke="#E17726" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.066 1l13.003 9.809-2.312-5.818zM28.146 23.898l-3.487 5.34 7.463 2.053 2.143-7.283zM.889 24.008l2.13 7.283 7.463-2.053-3.487-5.34z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.115 14.558l-2.077 3.14 7.405.337-.247-7.969zM24.91 14.558l-5.16-4.583-.169 8.06 7.405-.337z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.482 29.238l4.465-2.173-3.86-3.006zM20.078 27.065l4.446 2.173-.587-5.18z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CoinbaseProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect width="40" height="40" rx="10" fill="#0052FF"/>
    <rect x="12" y="12" width="16" height="16" rx="8" fill="white"/>
    <rect x="16" y="16" width="8" height="8" rx="2" fill="#0052FF"/>
  </svg>
);

const PhantomProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <defs><linearGradient id="ppg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#534BB1"/><stop offset="100%" stopColor="#551BF9"/></linearGradient></defs>
    <rect width="40" height="40" rx="10" fill="url(#ppg)"/>
    <circle cx="16" cy="19" r="2.5" fill="white"/><circle cx="24" cy="19" r="2.5" fill="white"/>
  </svg>
);

const RainbowProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <defs><linearGradient id="rpg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FF4000"/><stop offset="25%" stopColor="#FF9901"/><stop offset="50%" stopColor="#01DA40"/><stop offset="75%" stopColor="#00AAFF"/><stop offset="100%" stopColor="#A259FF"/></linearGradient></defs>
    <rect rx="10" width="40" height="40" fill="url(#rpg)"/>
    <path d="M8 28v-4a12 12 0 0 1 24 0v4" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M12 28v-4a8 8 0 0 1 16 0v4" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M16 28v-4a4 4 0 0 1 8 0v4" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
  </svg>
);

const WalletConnectProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect rx="10" width="40" height="40" fill="#3B99FC"/>
    <path d="M12.5 16.5c4.1-4 10.9-4 15 0l.5.5-1.7 1.7-.5-.5c-3.2-3.1-8.4-3.1-11.6 0l-.5.5L12 17l.5-.5zm18.5 3.4l1.5 1.5-7.1 7-1.5-1.5 5.6-5.5zm-24.5 1.5L8 19.9l5.6 5.5L12 27z" fill="white"/>
  </svg>
);

// Talisman Wallet – official star logo
const TalismanProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect width="40" height="40" rx="10" fill="#D5FF5C"/>
    <path d="M20 6l3.5 10.5H34L25.5 22l3.5 10.5L20 26l-9 6.5L14.5 22 6 16.5h10.5z" fill="#1A1A1A"/>
  </svg>
);

// Eternl – Cardano wallet
const EternlProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect width="40" height="40" rx="10" fill="#1A44B7"/>
    <text x="20" y="25" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="sans-serif">E</text>
  </svg>
);

// Nami – Cardano wallet
const NamiProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect width="40" height="40" rx="10" fill="#349EA3"/>
    <path d="M12 28V14l8 10 8-10v14" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Temple – Tezos wallet
const TempleProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect width="40" height="40" rx="10" fill="#4B72FF"/>
    <path d="M13 28l7-18 7 18M15 22h10" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Kukai – Tezos wallet
const KukaiProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect width="40" height="40" rx="10" fill="#2B6CB0"/>
    <circle cx="20" cy="20" r="8" stroke="white" strokeWidth="2.5" fill="none"/>
    <circle cx="20" cy="20" r="3" fill="white"/>
  </svg>
);

// Core – Avalanche wallet
const CoreProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect width="40" height="40" rx="10" fill="#E84142"/>
    <path d="M14 26h12L20 14z" fill="white"/>
  </svg>
);

// Xverse – Bitcoin wallet
const XverseProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect width="40" height="40" rx="10" fill="#EE7A30"/>
    <path d="M13 13l14 14M27 13L13 27" stroke="white" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

// Unisat – Bitcoin wallet
const UnisatProviderLogo = () => (
  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
    <rect width="40" height="40" rx="10" fill="#F7931A"/>
    <circle cx="20" cy="20" r="10" fill="white"/>
    <path d="M20 12v16M14 16l6-4 6 4M14 24l6 4 6-4" stroke="#F7931A" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ══════════════════════════════════════════════
   Chain → Wallet Provider Mapping
   ══════════════════════════════════════════════ */

interface WalletProvider {
  name: string;
  description: string;
  Logo: React.FC;
  chains: string[]; // which chains this wallet supports
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

  // Filter wallet providers by selected chain
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
