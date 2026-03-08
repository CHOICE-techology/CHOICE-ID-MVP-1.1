import { Job } from '@/types';

const COMPANIES = [
  // DeFi
  'Uniswap Labs', 'Aave', 'MakerDAO', 'Compound', 'Lido Finance', 'Curve Finance',
  'dYdX', 'GMX', 'Pendle Finance', 'Eigenlayer', 'Ethena Labs', 'Sky (ex-Maker)',
  'Morpho Labs', 'Hyperliquid', 'Jupiter Exchange',
  // Infrastructure
  'Chainlink', 'The Graph', 'Celestia', 'EigenDA', 'Avail', 'Espresso Systems',
  'Alchemy', 'Infura', 'QuickNode', 'Moralis', 'Thirdweb', 'Tenderly',
  // L2 / Scaling
  'Arbitrum Foundation', 'Optimism', 'Polygon Labs', 'StarkWare', 'zkSync (Matter Labs)',
  'Base (Coinbase)', 'Scroll', 'Linea (Consensys)', 'Blast', 'Mantle Network',
  'Taiko', 'Zora', 'Mode Network',
  // NFT / Creator
  'OpenSea', 'Blur', 'Magic Eden', 'Rarible', 'Foundation', 'Zora Network',
  'Manifold', 'Sound.xyz', 'Highlight',
  // Wallets
  'MetaMask', 'Phantom', 'Rainbow', 'Rabby Wallet', 'Zerion', 'Safe (Gnosis Safe)',
  'Coinbase Wallet', 'Ledger',
  // Exchanges
  'Coinbase', 'Binance', 'Kraken', 'OKX', 'Bybit', 'Bitget', 'Gemini',
  // Gaming / Metaverse
  'Axie Infinity', 'Immutable', 'Ronin Network', 'Treasure DAO', 'Parallel',
  'Pixelmon', 'Pirate Nation', 'Illuvium',
  // AI x Crypto
  'Bittensor', 'Render Network', 'Fetch.ai', 'Ocean Protocol', 'Ritual',
  'Gensyn', 'Modulus Labs', 'NEAR AI',
  // Social / Identity
  'Lens Protocol', 'Farcaster', 'Galxe', 'Guild.xyz', 'ENS', 'Spruce ID',
  'Ceramic Network', 'POAP', 'Gitcoin',
  // Security / Compliance
  'Chainalysis', 'Elliptic', 'Fireblocks', 'Circle', 'Paxos',
  'OpenZeppelin', 'Trail of Bits', 'Certora', 'Spearbit',
  // VC / Research
  'Paradigm', 'a16z Crypto', 'Pantera Capital', 'Multicoin Capital',
  'Dragonfly', 'Polychain Capital', 'Variant Fund', 'Placeholder VC',
  // DAOs
  'Nouns DAO', 'Gitcoin DAO', 'Aave DAO', 'Uniswap Governance',
  'Optimism Collective', 'Arbitrum DAO', 'MakerDAO Delegates',
];

const JOB_TEMPLATES: { title: string; type: Job['type']; salaryRange: [string, string]; minScore: number; badges: string[] }[] = [
  // Engineering — Solidity / Smart Contracts
  { title: 'Senior Solidity Developer', type: 'Full-time', salaryRange: ['$160k', '$240k'], minScore: 75, badges: ['Advanced Badge'] },
  { title: 'Smart Contract Auditor', type: 'Full-time', salaryRange: ['$180k', '$280k'], minScore: 80, badges: ['Advanced Badge'] },
  { title: 'Lead Smart Contract Engineer', type: 'Full-time', salaryRange: ['$200k', '$300k'], minScore: 85, badges: ['Advanced Badge'] },
  { title: 'ZK Circuit Engineer', type: 'Full-time', salaryRange: ['$190k', '$290k'], minScore: 80, badges: ['Advanced Badge'] },
  { title: 'Protocol Engineer', type: 'Full-time', salaryRange: ['$170k', '$260k'], minScore: 80, badges: ['Advanced Badge'] },
  // Engineering — Frontend / Full-Stack
  { title: 'Frontend Engineer (React/Web3)', type: 'Full-time', salaryRange: ['$130k', '$200k'], minScore: 60, badges: ['Intermediate Badge'] },
  { title: 'Full-Stack Web3 Developer', type: 'Full-time', salaryRange: ['$140k', '$220k'], minScore: 65, badges: ['Intermediate Badge'] },
  { title: 'Senior TypeScript Engineer', type: 'Full-time', salaryRange: ['$150k', '$230k'], minScore: 70, badges: ['Intermediate Badge'] },
  { title: 'dApp Developer', type: 'Full-time', salaryRange: ['$120k', '$190k'], minScore: 55, badges: ['Intermediate Badge'] },
  // Engineering — Backend / Infra
  { title: 'Backend Engineer (Rust)', type: 'Full-time', salaryRange: ['$150k', '$230k'], minScore: 70, badges: ['Advanced Badge'] },
  { title: 'Backend Engineer (Go)', type: 'Full-time', salaryRange: ['$140k', '$210k'], minScore: 65, badges: ['Intermediate Badge'] },
  { title: 'DevOps / Infrastructure Engineer', type: 'Full-time', salaryRange: ['$140k', '$210k'], minScore: 55, badges: ['Intermediate Badge'] },
  { title: 'Site Reliability Engineer', type: 'Full-time', salaryRange: ['$150k', '$220k'], minScore: 60, badges: ['Intermediate Badge'] },
  { title: 'Blockchain Node Operator', type: 'Full-time', salaryRange: ['$120k', '$180k'], minScore: 50, badges: ['Intermediate Badge'] },
  // Engineering — Data / ML
  { title: 'Data Engineer (On-Chain Analytics)', type: 'Full-time', salaryRange: ['$130k', '$200k'], minScore: 60, badges: ['Intermediate Badge'] },
  { title: 'ML Engineer (Crypto Fraud Detection)', type: 'Full-time', salaryRange: ['$160k', '$250k'], minScore: 70, badges: ['Advanced Badge'] },
  { title: 'Data Analyst (On-Chain)', type: 'Full-time', salaryRange: ['$110k', '$170k'], minScore: 55, badges: ['Intermediate Badge'] },
  // Security
  { title: 'Security Researcher', type: 'Contract', salaryRange: ['$10k/mo', '$20k/mo'], minScore: 80, badges: ['Advanced Badge'] },
  { title: 'Penetration Tester (Web3)', type: 'Contract', salaryRange: ['$8k/mo', '$16k/mo'], minScore: 75, badges: ['Advanced Badge'] },
  { title: 'Bug Bounty Hunter', type: 'Gig', salaryRange: ['$1k', '$100k+'], minScore: 70, badges: ['Advanced Badge'] },
  // Product / Design
  { title: 'Product Manager', type: 'Full-time', salaryRange: ['$140k', '$220k'], minScore: 65, badges: ['Advanced Badge'] },
  { title: 'Senior Product Designer', type: 'Full-time', salaryRange: ['$130k', '$200k'], minScore: 55, badges: ['Intermediate Badge'] },
  { title: 'UI/UX Designer', type: 'Full-time', salaryRange: ['$120k', '$180k'], minScore: 50, badges: ['Intermediate Badge'] },
  { title: 'UX Researcher (Crypto)', type: 'Full-time', salaryRange: ['$110k', '$170k'], minScore: 50, badges: [] },
  // DeFi Specific
  { title: 'DeFi Strategist', type: 'Full-time', salaryRange: ['$150k', '$220k'], minScore: 70, badges: ['Advanced Badge'] },
  { title: 'Tokenomics Advisor', type: 'Contract', salaryRange: ['$8k/mo', '$15k/mo'], minScore: 65, badges: ['Advanced Badge'] },
  { title: 'Liquidity Manager', type: 'Full-time', salaryRange: ['$130k', '$200k'], minScore: 65, badges: ['Advanced Badge'] },
  { title: 'MEV Researcher', type: 'Full-time', salaryRange: ['$180k', '$300k'], minScore: 85, badges: ['Advanced Badge'] },
  // Marketing / Growth
  { title: 'Marketing Lead', type: 'Contract', salaryRange: ['$6k/mo', '$12k/mo'], minScore: 45, badges: ['Intermediate Badge'] },
  { title: 'Growth Hacker', type: 'Contract', salaryRange: ['$5k/mo', '$9k/mo'], minScore: 35, badges: [] },
  { title: 'Head of Marketing', type: 'Full-time', salaryRange: ['$130k', '$200k'], minScore: 55, badges: ['Intermediate Badge'] },
  { title: 'Content Marketing Manager', type: 'Full-time', salaryRange: ['$90k', '$140k'], minScore: 40, badges: ['Beginner Badge'] },
  { title: 'Social Media Manager', type: 'Gig', salaryRange: ['$1k/mo', '$4k/mo'], minScore: 20, badges: [] },
  { title: 'Influencer Relations Manager', type: 'Contract', salaryRange: ['$4k/mo', '$8k/mo'], minScore: 35, badges: [] },
  // Community / Ops
  { title: 'Community Manager', type: 'Contract', salaryRange: ['$4k/mo', '$8k/mo'], minScore: 30, badges: ['Beginner Badge'] },
  { title: 'Developer Relations Engineer', type: 'Full-time', salaryRange: ['$140k', '$220k'], minScore: 60, badges: ['Intermediate Badge'] },
  { title: 'Head of Community', type: 'Full-time', salaryRange: ['$120k', '$180k'], minScore: 50, badges: ['Intermediate Badge'] },
  { title: 'Technical Writer', type: 'Contract', salaryRange: ['$5k/mo', '$10k/mo'], minScore: 40, badges: ['Beginner Badge'] },
  { title: 'Documentation Lead', type: 'Full-time', salaryRange: ['$100k', '$150k'], minScore: 45, badges: ['Beginner Badge'] },
  // DAO Roles
  { title: 'Governance Delegate', type: 'DAO', salaryRange: ['$3k/mo', '$7k/mo'], minScore: 50, badges: ['Intermediate Badge'] },
  { title: 'Treasury Manager', type: 'DAO', salaryRange: ['$8k/mo', '$15k/mo'], minScore: 70, badges: ['Advanced Badge'] },
  { title: 'DAO Operations Lead', type: 'DAO', salaryRange: ['$6k/mo', '$11k/mo'], minScore: 55, badges: ['Intermediate Badge'] },
  { title: 'Grants Program Manager', type: 'DAO', salaryRange: ['$5k/mo', '$10k/mo'], minScore: 50, badges: ['Intermediate Badge'] },
  { title: 'Grants Reviewer', type: 'DAO', salaryRange: ['$2k/mo', '$5k/mo'], minScore: 40, badges: [] },
  { title: 'DAO Council Member', type: 'DAO', salaryRange: ['$4k/mo', '$9k/mo'], minScore: 60, badges: ['Advanced Badge'] },
  { title: 'Governance Analyst', type: 'DAO', salaryRange: ['$3k/mo', '$6k/mo'], minScore: 45, badges: ['Intermediate Badge'] },
  // Collaboration / Hackathon
  { title: 'Hackathon Teammate: Frontend', type: 'Collaboration', salaryRange: ['Prize Pool', 'Share'], minScore: 25, badges: [] },
  { title: 'Hackathon Teammate: Smart Contracts', type: 'Collaboration', salaryRange: ['Prize Pool', 'Share'], minScore: 35, badges: ['Beginner Badge'] },
  { title: 'Hackathon Teammate: Design', type: 'Collaboration', salaryRange: ['Prize Pool', 'Share'], minScore: 20, badges: [] },
  { title: 'Open Source Contributor', type: 'Collaboration', salaryRange: ['Bounty', '$500-$5k'], minScore: 20, badges: [] },
  { title: 'Research Collaborator', type: 'Collaboration', salaryRange: ['Co-author', 'Credit'], minScore: 50, badges: ['Intermediate Badge'] },
  { title: 'Protocol Co-Builder', type: 'Collaboration', salaryRange: ['Equity', 'Tokens'], minScore: 60, badges: ['Advanced Badge'] },
  { title: 'Side Project Partner', type: 'Collaboration', salaryRange: ['Revenue', 'Share'], minScore: 30, badges: [] },
  // Gig / Freelance
  { title: 'Logo & Brand Designer', type: 'Gig', salaryRange: ['$500', '$2k'], minScore: 15, badges: [] },
  { title: 'NFT Artist', type: 'Gig', salaryRange: ['$1k', '$10k'], minScore: 20, badges: [] },
  { title: 'Video Content Creator', type: 'Gig', salaryRange: ['$800', '$3k'], minScore: 25, badges: [] },
  { title: 'Blockchain Educator', type: 'Gig', salaryRange: ['$2k', '$5k'], minScore: 30, badges: ['Beginner Badge'] },
  { title: 'Smart Contract Freelance Auditor', type: 'Gig', salaryRange: ['$3k', '$15k'], minScore: 70, badges: ['Advanced Badge'] },
  { title: 'Whitepaper Writer', type: 'Gig', salaryRange: ['$2k', '$8k'], minScore: 45, badges: ['Intermediate Badge'] },
  { title: 'Pitch Deck Designer', type: 'Gig', salaryRange: ['$500', '$3k'], minScore: 20, badges: [] },
  { title: 'Community Moderator', type: 'Gig', salaryRange: ['$500/mo', '$2k/mo'], minScore: 15, badges: [] },
  // QA / Testing
  { title: 'QA Engineer', type: 'Contract', salaryRange: ['$4k/mo', '$8k/mo'], minScore: 35, badges: [] },
  { title: 'Smart Contract Test Engineer', type: 'Full-time', salaryRange: ['$120k', '$180k'], minScore: 55, badges: ['Intermediate Badge'] },
  // Legal / Compliance
  { title: 'Crypto Legal Counsel', type: 'Full-time', salaryRange: ['$180k', '$280k'], minScore: 70, badges: ['Advanced Badge'] },
  { title: 'Compliance Officer', type: 'Full-time', salaryRange: ['$130k', '$200k'], minScore: 55, badges: ['Intermediate Badge'] },
  { title: 'Regulatory Affairs Lead', type: 'Full-time', salaryRange: ['$140k', '$210k'], minScore: 60, badges: ['Intermediate Badge'] },
  // AI x Crypto
  { title: 'AI Agent Developer', type: 'Full-time', salaryRange: ['$170k', '$260k'], minScore: 75, badges: ['Advanced Badge'] },
  { title: 'AI/ML Research Engineer (Web3)', type: 'Full-time', salaryRange: ['$180k', '$280k'], minScore: 80, badges: ['Advanced Badge'] },
  { title: 'Prompt Engineer (Crypto Products)', type: 'Contract', salaryRange: ['$5k/mo', '$10k/mo'], minScore: 40, badges: [] },
  // Executive
  { title: 'CTO (Early Stage)', type: 'Full-time', salaryRange: ['$200k', '$350k+'], minScore: 90, badges: ['Advanced Badge'] },
  { title: 'VP of Engineering', type: 'Full-time', salaryRange: ['$180k', '$280k'], minScore: 85, badges: ['Advanced Badge'] },
  { title: 'Head of Product', type: 'Full-time', salaryRange: ['$160k', '$250k'], minScore: 75, badges: ['Advanced Badge'] },
];

function generateJobs(): Job[] {
  const jobs: Job[] = [];
  const companyCount = COMPANIES.length;
  const templateCount = JOB_TEMPLATES.length;

  for (let i = 0; i < 400; i++) {
    const template = JOB_TEMPLATES[i % templateCount];
    const company = COMPANIES[i % companyCount];
    const salary = template.salaryRange[0] === 'Prize Pool' || template.salaryRange[0] === 'Bounty' || template.salaryRange[0] === 'Co-author' || template.salaryRange[0] === 'Equity' || template.salaryRange[0] === 'Revenue'
      ? `${template.salaryRange[0]} ${template.salaryRange[1]}`
      : `${template.salaryRange[0]} - ${template.salaryRange[1]}`;

    // Vary minScore slightly per listing
    const scoreVariation = ((i * 7) % 11) - 5; // -5 to +5
    const adjustedMinScore = Math.max(10, Math.min(95, template.minScore + scoreVariation));

    jobs.push({
      id: String(i + 1),
      title: template.title,
      company,
      type: template.type,
      salary,
      minScore: adjustedMinScore,
      requiredBadges: template.badges,
    });
  }
  return jobs;
}

export const ALL_JOBS: Job[] = generateJobs();
