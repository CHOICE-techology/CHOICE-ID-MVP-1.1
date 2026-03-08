/**
 * Registry of the 50 most popular wallets for the Connect CHOICE ID modal.
 * All logos use local assets for reliability and consistent display.
 */

// ── Local asset imports ──
import metamaskLogo from '@/assets/logos/metamask-official.png';
import trustWalletLogo from '@/assets/logos/trust-wallet-new.png';
import phantomLogo from '@/assets/logos/phantom-new.png';
import coinbaseLogo from '@/assets/logos/coinbase.webp';
import rainbowLogo from '@/assets/logos/rainbow.png';
import walletconnectLogo from '@/assets/logos/walletconnect.png';
import rabbyLogo from '@/assets/logos/rabby.png';
import zerionLogo from '@/assets/logos/zerion.png';
import braveLogo from '@/assets/logos/brave.png';
import okxLogo from '@/assets/logos/okx.png';
import bitgetLogo from '@/assets/logos/bitget.png';
import tokenPocketLogo from '@/assets/logos/token-pocket.png';
import onekeyLogo from '@/assets/logos/onekey.png';
import safeLogo from '@/assets/logos/safe.png';
import solflareLogo from '@/assets/logos/solflare.png';
import backpackLogo from '@/assets/logos/backpack.png';
import xverseLogo from '@/assets/logos/xverse.png';
import unisatLogo from '@/assets/logos/unisat.png';
import leatherLogo from '@/assets/logos/leather.png';
import keplrLogo from '@/assets/logos/keplr.png';
import leapLogo from '@/assets/logos/leap.png';
import exodusLogo from '@/assets/logos/exodus.png';
import talismanLogo from '@/assets/logos/talisman-wallet.png';
import subwalletLogo from '@/assets/logos/subwallet.png';
import coin98Logo from '@/assets/logos/coin98.png';
import frontierLogo from '@/assets/logos/frontier.png';
import safepalLogo from '@/assets/logos/safepal.png';
import ledgerLogo from '@/assets/logos/ledger.png';
import trezorLogo from '@/assets/logos/trezor.png';
import argentLogo from '@/assets/logos/argent.png';
import imtokenLogo from '@/assets/logos/imtoken.png';
import hashpackLogo from '@/assets/logos/hashpack.png';
import petraLogo from '@/assets/logos/petra.png';
import tonkeeperLogo from '@/assets/logos/tonkeeper.png';

export interface WalletEntry {
  id: string;
  name: string;
  logo: string;
  category: 'popular' | 'evm' | 'solana' | 'bitcoin' | 'multi' | 'other';
  /** Returns true if the wallet's browser extension is detected */
  detect?: () => boolean;
}

const w = (window as any);

/**
 * Top 50 wallets — ordered by popularity / market share.
 * All logos are local assets for guaranteed rendering.
 */
export const walletRegistry: WalletEntry[] = [
  // ── Top tier (popular) ──
  { id: 'metamask', name: 'MetaMask', logo: metamaskLogo, category: 'popular',
    detect: () => !!w.ethereum?.isMetaMask },
  { id: 'phantom', name: 'Phantom', logo: phantomLogo, category: 'popular',
    detect: () => !!w.phantom?.solana?.isPhantom || !!w.solana?.isPhantom },
  { id: 'coinbase', name: 'Coinbase Wallet', logo: coinbaseLogo, category: 'popular',
    detect: () => !!w.ethereum?.isCoinbaseWallet || !!w.coinbaseWalletExtension },
  { id: 'trust', name: 'Trust Wallet', logo: trustWalletLogo, category: 'popular',
    detect: () => !!w.trustwallet || !!w.ethereum?.isTrust },
  { id: 'rainbow', name: 'Rainbow', logo: rainbowLogo, category: 'popular',
    detect: () => !!w.ethereum?.isRainbow },
  { id: 'walletconnect', name: 'WalletConnect', logo: walletconnectLogo, category: 'popular' },

  // ── EVM wallets ──
  { id: 'rabby', name: 'Rabby Wallet', logo: rabbyLogo, category: 'evm',
    detect: () => !!w.ethereum?.isRabby },
  { id: 'zerion', name: 'Zerion', logo: zerionLogo, category: 'evm',
    detect: () => !!w.ethereum?.isZerion },
  { id: 'brave', name: 'Brave Wallet', logo: braveLogo, category: 'evm',
    detect: () => !!w.ethereum?.isBraveWallet },
  { id: 'okx', name: 'OKX Wallet', logo: okxLogo, category: 'evm',
    detect: () => !!w.okxwallet },
  { id: 'frame', name: 'Frame', logo: 'https://frame.sh/icons/frame256.png', category: 'evm',
    detect: () => !!w.ethereum?.isFrame },
  { id: 'taho', name: 'Taho', logo: 'https://taho.xyz/favicon.svg', category: 'evm',
    detect: () => !!w.tpiProvider || !!w.ethereum?.isTally },
  { id: 'bitget', name: 'Bitget Wallet', logo: bitgetLogo, category: 'evm',
    detect: () => !!w.bitkeep },
  { id: 'token-pocket', name: 'TokenPocket', logo: tokenPocketLogo, category: 'evm',
    detect: () => !!w.ethereum?.isTokenPocket },
  { id: 'math', name: 'MathWallet', logo: 'https://medishares-cn.oss-cn-hangzhou.aliyuncs.com/mathwallet/logo_b.png', category: 'evm',
    detect: () => !!w.ethereum?.isMathWallet },
  { id: 'onekey', name: 'OneKey', logo: onekeyLogo, category: 'evm',
    detect: () => !!w.$onekey },
  { id: 'safe', name: 'Safe (Gnosis)', logo: safeLogo, category: 'evm' },
  { id: 'sequence', name: 'Sequence', logo: 'https://sequence.xyz/icon.svg', category: 'evm' },
  { id: 'enkrypt', name: 'Enkrypt', logo: 'https://www.enkrypt.com/favicon.svg', category: 'evm',
    detect: () => !!w.enkrypt },

  // ── Solana wallets ──
  { id: 'solflare', name: 'Solflare', logo: solflareLogo, category: 'solana',
    detect: () => !!w.solflare?.isSolflare },
  { id: 'backpack', name: 'Backpack', logo: backpackLogo, category: 'solana',
    detect: () => !!w.backpack },
  { id: 'glow', name: 'Glow', logo: 'https://glow.app/favicon.svg', category: 'solana',
    detect: () => !!w.glowSolana },
  { id: 'slope', name: 'Slope', logo: 'https://slope.finance/assets/icon/slope_icon.svg', category: 'solana' },

  // ── Bitcoin wallets ──
  { id: 'xverse', name: 'Xverse', logo: xverseLogo, category: 'bitcoin',
    detect: () => !!w.XverseProviders },
  { id: 'unisat', name: 'UniSat', logo: unisatLogo, category: 'bitcoin',
    detect: () => !!w.unisat },
  { id: 'leather', name: 'Leather (Hiro)', logo: leatherLogo, category: 'bitcoin',
    detect: () => !!w.LeatherProvider || !!w.HiroWalletProvider },
  { id: 'ordinals', name: 'Ordinals Wallet', logo: 'https://ordinalswallet.com/favicon.ico', category: 'bitcoin' },

  // ── Multi-chain wallets ──
  { id: 'keplr', name: 'Keplr', logo: keplrLogo, category: 'multi',
    detect: () => !!w.keplr },
  { id: 'leap', name: 'Leap Wallet', logo: leapLogo, category: 'multi',
    detect: () => !!w.leap },
  { id: 'exodus', name: 'Exodus', logo: exodusLogo, category: 'multi',
    detect: () => !!w.exodus },
  { id: 'talisman', name: 'Talisman', logo: talismanLogo, category: 'multi',
    detect: () => !!w.talismanEth },
  { id: 'polkadot-js', name: 'Polkadot.js', logo: 'https://polkadot.js.org/docs/img/logo.svg', category: 'multi',
    detect: () => !!w.injectedWeb3?.['polkadot-js'] },
  { id: 'subwallet', name: 'SubWallet', logo: subwalletLogo, category: 'multi',
    detect: () => !!w.SubWallet || !!w.injectedWeb3?.subwallet },
  { id: 'core', name: 'Core Wallet', logo: 'https://core.app/favicon.svg', category: 'multi',
    detect: () => !!w.avalanche },
  { id: 'coin98', name: 'Coin98', logo: coin98Logo, category: 'multi',
    detect: () => !!w.coin98 },
  { id: 'frontier', name: 'Frontier', logo: frontierLogo, category: 'multi',
    detect: () => !!w.frontier },
  { id: 'safepal', name: 'SafePal', logo: safepalLogo, category: 'multi' },
  { id: 'keystone', name: 'Keystone', logo: 'https://keyst.one/favicon.svg', category: 'multi' },
  { id: 'ledger', name: 'Ledger Live', logo: ledgerLogo, category: 'multi' },
  { id: 'trezor', name: 'Trezor', logo: trezorLogo, category: 'multi' },
  { id: 'argent', name: 'Argent', logo: argentLogo, category: 'multi' },
  { id: 'imtoken', name: 'imToken', logo: imtokenLogo, category: 'multi',
    detect: () => !!w.ethereum?.isImToken },
  { id: 'hashpack', name: 'HashPack', logo: hashpackLogo, category: 'multi',
    detect: () => !!w.hashpack },
  { id: 'blade', name: 'Blade Wallet', logo: 'https://www.bladewallet.io/favicon.ico', category: 'multi' },

  // ── Other notable wallets ──
  { id: 'temple', name: 'Temple (Tezos)', logo: 'https://templewallet.com/favicon.svg', category: 'other',
    detect: () => !!w.tezos },
  { id: 'nami', name: 'Nami (Cardano)', logo: 'https://namiwallet.io/favicon.ico', category: 'other',
    detect: () => !!w.cardano?.nami },
  { id: 'eternl', name: 'Eternl (Cardano)', logo: 'https://eternl.io/favicon.ico', category: 'other',
    detect: () => !!w.cardano?.eternl },
  { id: 'petra', name: 'Petra (Aptos)', logo: petraLogo, category: 'other',
    detect: () => !!w.aptos },
  { id: 'sui', name: 'Sui Wallet', logo: 'https://sui.io/favicon.ico', category: 'other',
    detect: () => !!w.suiWallet },
  { id: 'tonkeeper', name: 'Tonkeeper', logo: tonkeeperLogo, category: 'other',
    detect: () => !!w.tonkeeper },
];

/** Detect which wallets are installed as browser extensions */
export const getDetectedWallets = (): Set<string> => {
  const detected = new Set<string>();
  if (typeof window === 'undefined') return detected;
  for (const wallet of walletRegistry) {
    try {
      if (wallet.detect?.()) detected.add(wallet.id);
    } catch { /* ignore detection errors */ }
  }
  return detected;
};
