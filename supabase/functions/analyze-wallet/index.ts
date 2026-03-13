import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RPC_ENDPOINTS: Record<string, string> = {
  ethereum: 'https://eth.llamarpc.com',
  arbitrum: 'https://arb1.arbitrum.io/rpc',
  base: 'https://mainnet.base.org',
  polygon: 'https://polygon-rpc.com',
  optimism: 'https://mainnet.optimism.io',
  avalanche: 'https://api.avax.network/ext/bc/C/rpc',
  bnb: 'https://bsc-dataseed.binance.org',
  fantom: 'https://rpc.ftm.tools',
  gnosis: 'https://rpc.gnosischain.com',
  celo: 'https://forno.celo.org',
};

async function queryEVMChain(rpcUrl: string, address: string): Promise<{ txCount: number; balance: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const [txRes, balRes] = await Promise.all([
      fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [address, 'latest'], id: 1 }),
        signal: controller.signal,
      }),
      fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getBalance', params: [address, 'latest'], id: 2 }),
        signal: controller.signal,
      }),
    ]);

    clearTimeout(timeout);

    const txData = await txRes.json();
    const balData = await balRes.json();

    const txCount = parseInt(txData.result || '0x0', 16);
    const balanceWei = BigInt(balData.result || '0x0');
    const balanceEth = Number(balanceWei) / 1e18;

    return { txCount, balance: balanceEth.toFixed(4) };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, chain } = await req.json();

    if (!address || typeof address !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If specific chain requested
    if (chain && RPC_ENDPOINTS[chain.toLowerCase()]) {
      const result = await queryEVMChain(RPC_ENDPOINTS[chain.toLowerCase()], address);
      return new Response(JSON.stringify({
        txCount: result?.txCount ?? 0,
        balance: result?.balance ?? '0.0000',
        chain: chain,
        activeChains: result && result.txCount > 0 ? [chain] : [],
        accountAge: result && result.txCount > 0 ? 'Active' : 'No activity',
        totalVolume: 'N/A',
        assetsHeld: 'N/A',
        netValue: 'N/A',
        activityData: [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Multi-chain scan
    const chainEntries = Object.entries(RPC_ENDPOINTS);
    const results = await Promise.allSettled(
      chainEntries.map(async ([name, rpc]) => {
        const res = await queryEVMChain(rpc, address);
        return { name, ...res };
      })
    );

    let totalTx = 0;
    let totalBalance = 0;
    const activeChains: string[] = [];
    const activityData: { name: string; tx: number }[] = [];

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        const { name, txCount, balance } = r.value;
        if (txCount !== undefined && txCount > 0) {
          activeChains.push(name.charAt(0).toUpperCase() + name.slice(1));
          totalTx += txCount;
          activityData.push({ name: name.slice(0, 3).toUpperCase(), tx: txCount });
        }
        if (balance) {
          totalBalance += parseFloat(balance);
        }
      }
    }

    // Estimate account age from tx count
    let accountAge = 'New';
    if (totalTx > 500) accountAge = '3+ years';
    else if (totalTx > 200) accountAge = '2+ years';
    else if (totalTx > 50) accountAge = '1+ year';
    else if (totalTx > 10) accountAge = '6+ months';
    else if (totalTx > 0) accountAge = '< 6 months';

    return new Response(JSON.stringify({
      txCount: totalTx,
      accountAge,
      totalVolume: `${totalTx} txns`,
      assetsHeld: `${activeChains.length} chains`,
      netValue: `${totalBalance.toFixed(4)} ETH`,
      balance: `${totalBalance.toFixed(4)} ETH`,
      chain: 'Multi-Chain',
      activeChains,
      activityData: activityData.length > 0 ? activityData : [{ name: 'N/A', tx: 0 }],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Analysis failed', details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
