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
  
  const [balanceRes, signaturesRes] = await Promise.all([
    fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address] }),
    }).then(r => r.json()),
    fetch(rpcUrl, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSignaturesForAddress', params: [address, { limit: 1000 }] }),
    }).then(r => r.json()),
  ]);

  const balanceLamports = balanceRes.result?.value || 0;
  const balanceSol = balanceLamports / 1e9;
  const signatures = signaturesRes.result || [];

  return { txCount: signatures.length, balanceSol, chain: 'solana' };
}

async function analyzeBitcoinWallet(address: string) {
  const res = await fetch(`https://blockchain.info/rawaddr/${address}?limit=0`);
  if (!res.ok) throw new Error('Bitcoin API error');
  const data = await res.json();
  
  return {
    txCount: data.n_tx || 0,
    balanceBtc: (data.final_balance || 0) / 1e8,
    totalReceived: (data.total_received || 0) / 1e8,
    totalSent: (data.total_sent || 0) / 1e8,
    chain: 'bitcoin',
  };
}

function detectChain(address: string): string {
  if (address.startsWith('0x') && address.length === 42) return 'ethereum';
  if (address.length >= 32 && address.length <= 44 && !address.startsWith('0x')) {
    if (address.startsWith('1') || address.startsWith('3') || address.startsWith('bc1')) return 'bitcoin';
    return 'solana';
  }
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
    } else {
      // EVM chains
      const evm = await analyzeEVMWallet(address, chain);
      
      // Try multiple chains for a fuller picture
      const chainsToCheck = ['ethereum', 'arbitrum', 'base', 'polygon', 'optimism', 'avalanche'].filter(c => c !== chain);
      let totalTx = evm.txCount;
      let totalBalance = evm.balanceEth;
      const activeChains = [chain];

      const otherResults = await Promise.allSettled(
        chainsToCheck.slice(0, 3).map(async (c) => {
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

      const ethPrice = 2500; // approximate
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

    // Generate activity data (monthly tx approximation)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const avgPerMonth = Math.max(1, Math.floor((result.txCount as number) / 12));
    const activityData = months.map(name => ({
      name,
      tx: Math.max(0, avgPerMonth + Math.floor(Math.random() * avgPerMonth * 0.6 - avgPerMonth * 0.3))
    }));

    // Determine account age estimate
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
