import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Public RPC endpoints (no API key needed)
const RPC_ENDPOINTS: Record<string, string> = {
  ethereum: 'https://eth.llamarpc.com',
  arbitrum: 'https://arb1.arbitrum.io/rpc',
  polygon: 'https://polygon-rpc.com',
  base: 'https://mainnet.base.org',
  avalanche: 'https://api.avax.network/ext/bc/C/rpc',
  optimism: 'https://mainnet.optimism.io',
};

async function rpcCall(rpcUrl: string, method: string, params: unknown[]) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    console.error(`RPC returned non-JSON (${res.status}): ${contentType} from ${rpcUrl}`);
    return null;
  }
  const data = await res.json();
  return data.result;
}

async function analyzeEVMWallet(address: string, chain: string) {
  const rpcUrl = RPC_ENDPOINTS[chain] || RPC_ENDPOINTS.ethereum;
  const [txCountHex, balanceHex] = await Promise.all([
    rpcCall(rpcUrl, 'eth_getTransactionCount', [address, 'latest']),
    rpcCall(rpcUrl, 'eth_getBalance', [address, 'latest']),
  ]);
  const txCount = parseInt(txCountHex || '0x0', 16);
  const balanceWei = BigInt(balanceHex || '0x0');
  const balanceEth = Number(balanceWei) / 1e18;
  return { txCount, balanceEth, chain };
}

async function analyzeSolanaWallet(address: string) {
  const rpcUrl = 'https://api.mainnet-beta.solana.com';
  async function safeFetch(method: string, params: unknown[]) {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return {};
    return res.json();
  }
  const [balanceRes, signaturesRes] = await Promise.all([
    safeFetch('getBalance', [address]),
    safeFetch('getSignaturesForAddress', [address, { limit: 1000 }]),
  ]);
  const balanceLamports = balanceRes.result?.value || 0;
  const balanceSol = balanceLamports / 1e9;
  const signatures = signaturesRes.result || [];
  return { txCount: signatures.length, balanceSol, chain: 'solana' };
}

async function analyzeBitcoinWallet(address: string) {
  const res = await fetch(`https://blockchain.info/rawaddr/${address}?limit=0`);
  if (!res.ok) throw new Error('Bitcoin API error');
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('json')) throw new Error('Bitcoin API returned non-JSON');
  const data = await res.json();
  return {
    txCount: data.n_tx || 0,
    balanceBtc: (data.final_balance || 0) / 1e8,
    totalReceived: (data.total_received || 0) / 1e8,
    totalSent: (data.total_sent || 0) / 1e8,
    chain: 'bitcoin',
  };
}

async function analyzeCardanoWallet(address: string) {
  try {
    const res = await fetch(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`, {
      headers: { 'project_id': 'mainnetpublic' },
    });
    if (!res.ok) {
      // Fallback: return minimal info based on address validity
      return { txCount: 0, balanceAda: 0, chain: 'cardano' };
    }
    const data = await res.json();
    const balanceLovelace = parseInt(data.amount?.[0]?.quantity || '0', 10);
    return {
      txCount: data.tx_count || 0,
      balanceAda: balanceLovelace / 1e6,
      chain: 'cardano',
    };
  } catch {
    return { txCount: 0, balanceAda: 0, chain: 'cardano' };
  }
}

async function analyzePolkadotWallet(address: string) {
  try {
    // Use Subscan v2 API with proper headers
    const res = await fetch('https://polkadot.api.subscan.io/api/v2/scan/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ key: address }),
    });
    if (!res.ok) {
      console.error(`Subscan returned ${res.status} for ${address}`);
      // Fallback: try the account endpoint
      const fallbackRes = await fetch(`https://polkadot.api.subscan.io/api/scan/account/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        return {
          txCount: 0,
          balanceDot: parseFloat(fallbackData.data?.native?.[0]?.balance || '0'),
          chain: 'polkadot',
        };
      }
      return { txCount: 0, balanceDot: 0, chain: 'polkadot' };
    }
    const data = await res.json();
    const account = data.data?.account;
    return {
      txCount: account?.count_extrinsic || 0,
      balanceDot: parseFloat(account?.balance || '0'),
      chain: 'polkadot',
    };
  } catch (e) {
    console.error('Polkadot analysis error:', e);
    return { txCount: 0, balanceDot: 0, chain: 'polkadot' };
  }
}

async function analyzeTezosWallet(address: string) {
  try {
    const res = await fetch(`https://api.tzkt.io/v1/accounts/${address}`);
    if (!res.ok) return { txCount: 0, balanceXtz: 0, chain: 'tezos' };
    const data = await res.json();
    return {
      txCount: data.numTransactions || 0,
      balanceXtz: (data.balance || 0) / 1e6,
      chain: 'tezos',
    };
  } catch {
    return { txCount: 0, balanceXtz: 0, chain: 'tezos' };
  }
}

function detectChain(address: string): string {
  if (address.startsWith('0x') && address.length === 42) return 'ethereum';
  if (address.startsWith('addr1') || address.startsWith('stake1')) return 'cardano';
  if (address.startsWith('tz1') || address.startsWith('tz2') || address.startsWith('tz3') || address.startsWith('KT1')) return 'tezos';
  // Polkadot addresses: start with 1 and are typically 47-48 chars (SS58 encoding)
  if (address.startsWith('1') && address.length >= 46 && address.length <= 48) return 'polkadot';
  // Bitcoin addresses: start with 1 or 3 (26-35 chars) or bc1
  if (address.startsWith('1') && address.length >= 26 && address.length <= 35) return 'bitcoin';
  if (address.startsWith('3') && address.length >= 26 && address.length <= 35) return 'bitcoin';
  if (address.startsWith('bc1')) return 'bitcoin';
  // Solana: base58, 32-44 chars
  if (address.length >= 32 && address.length <= 44 && !address.startsWith('0x')) return 'solana';
  return 'ethereum';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, chain: requestedChain } = await req.json();
    if (!address) {
      return new Response(JSON.stringify({ error: 'Address required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const chain = requestedChain || detectChain(address);
    let result: Record<string, unknown>;

    if (chain === 'bitcoin') {
      const btc = await analyzeBitcoinWallet(address);
      result = {
        chain: 'bitcoin',
        txCount: btc.txCount,
        balance: `${btc.balanceBtc.toFixed(8)} BTC`,
        totalVolume: `${(btc.totalReceived + btc.totalSent).toFixed(4)} BTC`,
        netValue: `$${(btc.balanceBtc * 65000).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        assetsHeld: btc.balanceBtc > 0 ? '1 Token(s)' : '0 Token(s)',
      };
    } else if (chain === 'solana') {
      const sol = await analyzeSolanaWallet(address);
      result = {
        chain: 'solana',
        txCount: sol.txCount,
        balance: `${sol.balanceSol.toFixed(4)} SOL`,
        totalVolume: `${sol.txCount} txns`,
        netValue: `$${(sol.balanceSol * 150).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        assetsHeld: sol.balanceSol > 0 ? '1+ Token(s)' : '0 Token(s)',
      };
    } else if (chain === 'cardano') {
      const ada = await analyzeCardanoWallet(address);
      result = {
        chain: 'cardano',
        txCount: ada.txCount,
        balance: `${ada.balanceAda.toFixed(2)} ADA`,
        totalVolume: `${ada.txCount} txns`,
        netValue: `$${(ada.balanceAda * 0.45).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        assetsHeld: ada.balanceAda > 0 ? '1+ Token(s)' : '0 Token(s)',
      };
    } else if (chain === 'polkadot') {
      const dot = await analyzePolkadotWallet(address);
      result = {
        chain: 'polkadot',
        txCount: dot.txCount,
        balance: `${dot.balanceDot.toFixed(4)} DOT`,
        totalVolume: `${dot.txCount} txns`,
        netValue: `$${(dot.balanceDot * 7).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        assetsHeld: dot.balanceDot > 0 ? '1+ Token(s)' : '0 Token(s)',
      };
    } else if (chain === 'tezos') {
      const xtz = await analyzeTezosWallet(address);
      result = {
        chain: 'tezos',
        txCount: xtz.txCount,
        balance: `${xtz.balanceXtz.toFixed(4)} XTZ`,
        totalVolume: `${xtz.txCount} txns`,
        netValue: `$${(xtz.balanceXtz * 0.95).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        assetsHeld: xtz.balanceXtz > 0 ? '1+ Token(s)' : '0 Token(s)',
      };
    } else {
      // EVM chains
      const evm = await analyzeEVMWallet(address, chain);
      const chainsToCheck = ['ethereum', 'arbitrum', 'base', 'polygon', 'optimism', 'avalanche'].filter(c => c !== chain);
      let totalTx = evm.txCount;
      let totalBalance = evm.balanceEth;
      const activeChains = [chain];

      const otherResults = await Promise.allSettled(
        chainsToCheck.slice(0, 5).map(async (c) => {
          const r = await analyzeEVMWallet(address, c);
          return { ...r, chain: c };
        })
      );

      for (const r of otherResults) {
        if (r.status === 'fulfilled' && (r.value.txCount > 0 || r.value.balanceEth > 0)) {
          totalTx += r.value.txCount;
          totalBalance += r.value.balanceEth;
          activeChains.push(r.value.chain);
        }
      }

      const ethPrice = 2500;
      result = {
        chain,
        txCount: totalTx,
        balance: `${totalBalance.toFixed(4)} ETH`,
        totalVolume: `${totalTx} txns across ${activeChains.length} chain(s)`,
        netValue: `$${(totalBalance * ethPrice).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        assetsHeld: `${activeChains.length} Chain(s) Active`,
        activeChains,
      };
    }

    // Generate activity data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const avgPerMonth = Math.max(1, Math.floor((result.txCount as number) / 12));
    const activityData = months.map(name => ({
      name,
      tx: Math.max(0, avgPerMonth + Math.floor(Math.random() * avgPerMonth * 0.6 - avgPerMonth * 0.3))
    }));

    const txCount = result.txCount as number;
    let accountAge = '< 1 Yr';
    if (txCount > 500) accountAge = '3+ Yrs';
    else if (txCount > 100) accountAge = '2+ Yrs';
    else if (txCount > 20) accountAge = '1+ Yrs';

    return new Response(JSON.stringify({
      ...result,
      accountAge,
      activityData,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Wallet analysis error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Analysis failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
