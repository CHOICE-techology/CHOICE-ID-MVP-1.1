import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RPC_ENDPOINTS: Record<string, string> = {
  ethereum: "https://eth.llamarpc.com",
  arbitrum: "https://arb1.arbitrum.io/rpc",
  base: "https://mainnet.base.org",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  polygon: "https://polygon-rpc.com",
  optimism: "https://mainnet.optimism.io",
  bsc: "https://bsc-dataseed.binance.org",
};

// Known protocol contract addresses (lowercase)
const KNOWN_PROTOCOLS: Record<string, { name: string; chain: string; logo: string }> = {
  // === Ethereum Mainnet ===
  // Uniswap
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": { name: "Uniswap", chain: "Ethereum", logo: "https://cryptologos.cc/logos/uniswap-uni-logo.svg" },
  "0xe592427a0aece92de3edee1f18e0157c05861564": { name: "Uniswap V3", chain: "Ethereum", logo: "https://cryptologos.cc/logos/uniswap-uni-logo.svg" },
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": { name: "Uniswap", chain: "Ethereum", logo: "https://cryptologos.cc/logos/uniswap-uni-logo.svg" },
  "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad": { name: "Uniswap Universal Router", chain: "Ethereum", logo: "https://cryptologos.cc/logos/uniswap-uni-logo.svg" },
  // Aave
  "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9": { name: "Aave V2", chain: "Ethereum", logo: "https://cryptologos.cc/logos/aave-aave-logo.svg" },
  "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2": { name: "Aave V3", chain: "Ethereum", logo: "https://cryptologos.cc/logos/aave-aave-logo.svg" },
  // OpenSea
  "0x00000000000000adc04c56bf30ac9d3c0aaf14dc": { name: "OpenSea", chain: "Ethereum", logo: "https://storage.googleapis.com/opensea-static/Logomark/Logomark-Blue.svg" },
  "0x00000000006c3852cbef3e08e8df289169ede581": { name: "OpenSea", chain: "Ethereum", logo: "https://storage.googleapis.com/opensea-static/Logomark/Logomark-Blue.svg" },
  // Blur
  "0x39da41747a83aee658334415666f3ef92dd0d541": { name: "Blur", chain: "Ethereum", logo: "https://blur.io/favicon.ico" },
  "0xb2ecfe4e4d61f8790bbb9de2d1259b9e2410cea5": { name: "Blur", chain: "Ethereum", logo: "https://blur.io/favicon.ico" },
  // ENS
  "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5": { name: "ENS", chain: "Ethereum", logo: "https://cryptologos.cc/logos/ethereum-name-service-ens-logo.svg" },
  "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85": { name: "ENS", chain: "Ethereum", logo: "https://cryptologos.cc/logos/ethereum-name-service-ens-logo.svg" },
  // Lido
  "0xae7ab96520de3a18e5e111b5eaab095312d7fe84": { name: "Lido", chain: "Ethereum", logo: "https://cryptologos.cc/logos/lido-dao-ldo-logo.svg" },
  // 1inch
  "0x1111111254eeb25477b68fb85ed929f73a960582": { name: "1inch", chain: "Ethereum", logo: "https://cryptologos.cc/logos/1inch-1inch-logo.svg" },
  "0x111111125421ca6dc452d289314280a0f8842a65": { name: "1inch V6", chain: "Ethereum", logo: "https://cryptologos.cc/logos/1inch-1inch-logo.svg" },
  // Compound
  "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b": { name: "Compound", chain: "Ethereum", logo: "https://cryptologos.cc/logos/compound-comp-logo.svg" },
  // Curve
  "0xd51a44d3fae010294c616388b506acda1bfaae46": { name: "Curve", chain: "Ethereum", logo: "https://cryptologos.cc/logos/curve-dao-token-crv-logo.svg" },
  "0xbebc44782c7db0a1a60cb6fe97d0b483032f535d": { name: "Curve 3pool", chain: "Ethereum", logo: "https://cryptologos.cc/logos/curve-dao-token-crv-logo.svg" },
  // SushiSwap
  "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f": { name: "SushiSwap", chain: "Ethereum", logo: "https://cryptologos.cc/logos/sushiswap-sushi-logo.svg" },

  // === Arbitrum ===
  "0x5e325eda8064b456f4781070c0738d849c824258": { name: "Aave (Arbitrum)", chain: "Arbitrum", logo: "https://cryptologos.cc/logos/aave-aave-logo.svg" },

  // === Base ===
  "0x2626664c2603336e57b271c5c0b26f421741e481": { name: "Uniswap (Base)", chain: "Base", logo: "https://cryptologos.cc/logos/uniswap-uni-logo.svg" },

  // === Polygon ===
  "0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff": { name: "QuickSwap", chain: "Polygon", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/8206.png" },

  // === BSC / BNB Chain ===
  "0x10ed43c718714eb63d5aa57b78b54704e256024e": { name: "PancakeSwap", chain: "BNB Chain", logo: "https://cryptologos.cc/logos/pancakeswap-cake-logo.svg" },
  "0xfd36e2c2a6789db23113685031d7f16329158384": { name: "Venus", chain: "BNB Chain", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/7288.png" },

  // === Optimism ===
  "0xb555edF5dcF85f42cEeF1f3630a52A108E55A654": { name: "Velodrome", chain: "Optimism", logo: "https://velodrome.finance/velodrome.svg" },
};

async function getEthLikeStats(rpcUrl: string, address: string) {
  try {
    const [txCountRes, balRes] = await Promise.all([
      fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getTransactionCount", params: [address, "latest"], id: 1 }),
      }),
      fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getBalance", params: [address, "latest"], id: 2 }),
      }),
    ]);

    const txCountData = await txCountRes.json();
    const balData = await balRes.json();
    const txCount = parseInt(txCountData?.result || "0x0", 16);
    const balWei = BigInt(balData?.result || "0x0");
    const balEth = Number(balWei) / 1e18;

    return { txCount, balance: balEth };
  } catch (e) {
    console.error("RPC error:", e);
    return { txCount: 0, balance: 0 };
  }
}

async function detectProtocols(address: string): Promise<{ name: string; chain: string; logo: string }[]> {
  const detected = new Map<string, { name: string; chain: string; logo: string }>();

  try {
    const rpc = RPC_ENDPOINTS.ethereum;

    const blockRes = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
    });
    const blockData = await blockRes.json();
    const latestBlock = parseInt(blockData?.result || "0x0", 16);
    const fromBlock = "0x" + Math.max(0, latestBlock - 200000).toString(16);

    // Check Transfer events FROM this address
    const logsRes = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getLogs",
        params: [{
          fromBlock,
          toBlock: "latest",
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x000000000000000000000000" + address.slice(2).toLowerCase(),
          ],
        }],
        id: 3,
      }),
    });
    const logsData = await logsRes.json();
    const logs = Array.isArray(logsData?.result) ? logsData.result : [];

    for (const log of logs) {
      const contractAddr = log.address?.toLowerCase();
      if (contractAddr && KNOWN_PROTOCOLS[contractAddr]) {
        const proto = KNOWN_PROTOCOLS[contractAddr];
        detected.set(proto.name, proto);
      }
      // Also check if transfer TO is a known protocol
      if (log.topics?.[2]) {
        const toAddr = "0x" + (log.topics[2] as string).slice(26).toLowerCase();
        if (KNOWN_PROTOCOLS[toAddr]) {
          const proto = KNOWN_PROTOCOLS[toAddr];
          detected.set(proto.name, proto);
        }
      }
    }

    // Also check Transfer events TO this address
    const logsToRes = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getLogs",
        params: [{
          fromBlock,
          toBlock: "latest",
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            null,
            "0x000000000000000000000000" + address.slice(2).toLowerCase(),
          ],
        }],
        id: 4,
      }),
    });
    const logsToData = await logsToRes.json();
    const logsTo = Array.isArray(logsToData?.result) ? logsToData.result : [];

    for (const log of logsTo) {
      const contractAddr = log.address?.toLowerCase();
      if (contractAddr && KNOWN_PROTOCOLS[contractAddr]) {
        const proto = KNOWN_PROTOCOLS[contractAddr];
        detected.set(proto.name, proto);
      }
    }
  } catch (e) {
    console.error("Protocol detection error:", e);
  }

  return Array.from(detected.values());
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();
    if (!address || typeof address !== "string") {
      return new Response(JSON.stringify({ error: "Missing address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [chainResults, protocols] = await Promise.all([
      Promise.allSettled(
        Object.entries(RPC_ENDPOINTS).map(async ([chain, rpc]) => {
          const stats = await getEthLikeStats(rpc, address);
          return { chain, ...stats };
        })
      ),
      detectProtocols(address),
    ]);

    const activeChains: string[] = [];
    let totalTxCount = 0;
    let totalBalance = 0;
    const chainDetails: Record<string, { txCount: number; balance: number }> = {};

    for (const result of chainResults) {
      if (result.status === "fulfilled") {
        const { chain, txCount, balance } = result.value;
        chainDetails[chain] = { txCount, balance };
        totalTxCount += txCount;
        totalBalance += balance;
        if (txCount > 0 || balance > 0) {
          activeChains.push(chain.charAt(0).toUpperCase() + chain.slice(1));
        }
      }
    }

    const accountAge = totalTxCount > 100 ? "3+ years" : totalTxCount > 50 ? "2+ years" : totalTxCount > 10 ? "1+ year" : totalTxCount > 0 ? "< 1 year" : "New";

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const activityData = months.map((name, i) => ({
      name,
      tx: Math.max(0, Math.floor(totalTxCount / 6 + (Math.random() - 0.5) * (totalTxCount / 3))),
    }));

    const totalVolume = totalBalance > 100 ? `${totalBalance.toFixed(1)} ETH` : totalBalance > 1 ? `${totalBalance.toFixed(2)} ETH` : `${totalBalance.toFixed(4)} ETH`;

    const response = {
      txCount: totalTxCount,
      accountAge,
      totalVolume,
      assetsHeld: `${activeChains.length} chain${activeChains.length !== 1 ? "s" : ""}`,
      netValue: totalBalance > 0 ? `$${(totalBalance * 3500).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "$0",
      activityData,
      chain: "Multi-chain",
      activeChains,
      balance: `${totalBalance.toFixed(4)} ETH`,
      chainDetails,
      protocols,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
