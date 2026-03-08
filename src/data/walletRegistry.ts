/**
 * Registry of the 50 most popular wallets for the Connect CHOICE ID modal.
 * Each entry includes: id, display name, logo URL (official CDN), category,
 * and an optional `detect` function that checks for browser extension injection.
 */

// Local asset imports for wallets we already have
import metamaskLogo from '@/assets/logos/metamask-official.png';
import trustWalletLogo from '@/assets/logos/trust-wallet-new.png';
import phantomLogo from '@/assets/logos/phantom-new.png';
import coinbaseLogo from '@/assets/logos/coinbase.webp';
import rainbowLogo from '@/assets/logos/rainbow.png';
import walletconnectLogo from '@/assets/logos/walletconnect.png';

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
 * CDN logos from official sources where local assets aren't available.
 */
export const walletRegistry: WalletEntry[] = [
  // ── Top tier (local assets) ──
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
  { id: 'rabby', name: 'Rabby Wallet', logo: 'https://rabby.io/assets/images/logo.svg', category: 'evm',
    detect: () => !!w.ethereum?.isRabby },
  { id: 'zerion', name: 'Zerion', logo: 'https://app.zerion.io/logo192.png', category: 'evm',
    detect: () => !!w.ethereum?.isZerion },
  { id: 'brave', name: 'Brave Wallet', logo: 'https://brave.com/static-assets/images/brave-logo-sans-text.svg', category: 'evm',
    detect: () => !!w.ethereum?.isBraveWallet },
  { id: 'okx', name: 'OKX Wallet', logo: 'https://static.okx.com/cdn/assets/imgs/2112/D91A9BD5D5D3FEBA.png', category: 'evm',
    detect: () => !!w.okxwallet },
  { id: 'frame', name: 'Frame', logo: 'https://frame.sh/icons/frame256.png', category: 'evm',
    detect: () => !!w.ethereum?.isFrame },
  { id: 'taho', name: 'Taho', logo: 'https://taho.xyz/favicon.svg', category: 'evm',
    detect: () => !!w.tpiProvider || !!w.ethereum?.isTally },
  { id: 'bitget', name: 'Bitget Wallet', logo: 'https://img.bitgetimg.com/image/third/1711959488482.png', category: 'evm',
    detect: () => !!w.bitkeep },
  { id: 'token-pocket', name: 'TokenPocket', logo: 'https://extension.tokenpocket.pro/logo.png', category: 'evm',
    detect: () => !!w.ethereum?.isTokenPocket },
  { id: 'math', name: 'MathWallet', logo: 'https://medishares-cn.oss-cn-hangzhou.aliyuncs.com/mathwallet/logo_b.png', category: 'evm',
    detect: () => !!w.ethereum?.isMathWallet },
  { id: 'onekey', name: 'OneKey', logo: 'https://onekey.so/favicon.svg', category: 'evm',
    detect: () => !!w.$onekey },
  { id: 'safe', name: 'Safe (Gnosis)', logo: 'https://app.safe.global/images/safe-logo-green.png', category: 'evm' },
  { id: 'sequence', name: 'Sequence', logo: 'https://sequence.xyz/icon.svg', category: 'evm' },
  { id: 'enkrypt', name: 'Enkrypt', logo: 'https://www.enkrypt.com/favicon.svg', category: 'evm',
    detect: () => !!w.enkrypt },

  // ── Solana wallets ──
  { id: 'solflare', name: 'Solflare', logo: 'https://solflare.com/favicon.svg', category: 'solana',
    detect: () => !!w.solflare?.isSolflare },
  { id: 'backpack', name: 'Backpack', logo: 'https://backpack.app/favicon.ico', category: 'solana',
    detect: () => !!w.backpack },
  { id: 'glow', name: 'Glow', logo: 'https://glow.app/favicon.svg', category: 'solana',
    detect: () => !!w.glowSolana },
  { id: 'slope', name: 'Slope', logo: 'https://slope.finance/assets/icon/slope_icon.svg', category: 'solana' },

  // ── Bitcoin wallets ──
  { id: 'xverse', name: 'Xverse', logo: 'https://www.xverse.app/icons/xverse-logo.svg', category: 'bitcoin',
    detect: () => !!w.XverseProviders },
  { id: 'unisat', name: 'UniSat', logo: 'https://unisat.io/favicon.ico', category: 'bitcoin',
    detect: () => !!w.unisat },
  { id: 'leather', name: 'Leather (Hiro)', logo: 'https://leather.io/leather-logo-mark.svg', category: 'bitcoin',
    detect: () => !!w.LeatherProvider || !!w.HiroWalletProvider },
  { id: 'ordinals', name: 'Ordinals Wallet', logo: 'https://ordinalswallet.com/favicon.ico', category: 'bitcoin' },

  // ── Multi-chain wallets ──
  { id: 'keplr', name: 'Keplr', logo: 'https://wallet.keplr.app/keplr-logo.svg', category: 'multi',
    detect: () => !!w.keplr },
  { id: 'leap', name: 'Leap Wallet', logo: 'https://assets.leapwallet.io/logos/leap-cosmos-logo.svg', category: 'multi',
    detect: () => !!w.leap },
  { id: 'exodus', name: 'Exodus', logo: 'https://www.exodus.com/brand/exodus-logo-mark.svg', category: 'multi',
    detect: () => !!w.exodus },
  { id: 'talisman', name: 'Talisman', logo: 'https://www.talisman.xyz/favicon.svg', category: 'multi',
    detect: () => !!w.talismanEth },
  { id: 'polkadot-js', name: 'Polkadot.js', logo: 'https://polkadot.js.org/docs/img/logo.svg', category: 'multi',
    detect: () => !!w.injectedWeb3?.['polkadot-js'] },
  { id: 'subwallet', name: 'SubWallet', logo: 'https://www.subwallet.app/favicon.svg', category: 'multi',
    detect: () => !!w.SubWallet || !!w.injectedWeb3?.subwallet },
  { id: 'core', name: 'Core Wallet', logo: 'https://core.app/favicon.svg', category: 'multi',
    detect: () => !!w.avalanche },
  { id: 'coin98', name: 'Coin98', logo: 'https://coin98.com/favicon.svg', category: 'multi',
    detect: () => !!w.coin98 },
  { id: 'frontier', name: 'Frontier', logo: 'https://frontier.xyz/favicon.svg', category: 'multi',
    detect: () => !!w.frontier },
  { id: 'safepal', name: 'SafePal', logo: 'https://www.safepal.com/favicon.ico', category: 'multi' },
  { id: 'keystone', name: 'Keystone', logo: 'https://keyst.one/favicon.svg', category: 'multi' },
  { id: 'ledger', name: 'Ledger Live', logo: 'https://www.ledger.com/wp-content/uploads/2023/05/cropped-Favicon-32x32.png', category: 'multi' },
  { id: 'trezor', name: 'Trezor', logo: 'https://trezor.io/favicon.ico', category: 'multi' },
  { id: 'argent', name: 'Argent', logo: 'https://www.argent.xyz/favicon.svg', category: 'multi' },
  { id: 'imtoken', name: 'imToken', logo: 'https://token.im/favicon.ico', category: 'multi',
    detect: () => !!w.ethereum?.isImToken },
  { id: 'hashpack', name: 'HashPack', logo: 'https://www.hashpack.app/favicon.ico', category: 'multi',
    detect: () => !!w.hashpack },
  { id: 'blade', name: 'Blade Wallet', logo: 'https://www.bladewallet.io/favicon.ico', category: 'multi' },

  // ── Other notable wallets ──
  { id: 'temple', name: 'Temple (Tezos)', logo: 'https://templewallet.com/favicon.svg', category: 'other',
    detect: () => !!w.tezos },
  { id: 'nami', name: 'Nami (Cardano)', logo: 'https://namiwallet.io/favicon.ico', category: 'other',
    detect: () => !!w.cardano?.nami },
  { id: 'eternl', name: 'Eternl (Cardano)', logo: 'https://eternl.io/favicon.ico', category: 'other',
    detect: () => !!w.cardano?.eternl },
  { id: 'petra', name: 'Petra (Aptos)', logo: 'https://petra.app/favicon.ico', category: 'other',
    detect: () => !!w.aptos },
  { id: 'sui', name: 'Sui Wallet', logo: 'https://sui.io/favicon.ico', category: 'other',
    detect: () => !!w.suiWallet },
  { id: 'tonkeeper', name: 'Tonkeeper', logo: 'https://tonkeeper.com/favicon.ico', category: 'other',
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
