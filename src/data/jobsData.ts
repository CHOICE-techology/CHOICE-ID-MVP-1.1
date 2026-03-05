import { Job } from '@/types';

const COMPANIES = [
  'Uniswap Labs', 'Aave', 'MakerDAO', 'Compound', 'Lido Finance', 'Chainlink',
  'Arbitrum Foundation', 'Optimism', 'Polygon Labs', 'StarkWare', 'zkSync',
  'OpenSea', 'Blur', 'Magic Eden', 'Rarible', 'Foundation',
  'Alchemy', 'Infura', 'QuickNode', 'Moralis', 'Thirdweb',
  'Consensys', 'Paradigm', 'a16z Crypto', 'Pantera Capital', 'Multicoin Capital',
  'Coinbase', 'Binance', 'Kraken', 'OKX', 'Bybit',
  'Ledger', 'Trezor', 'MetaMask', 'Phantom', 'Rainbow',
  'Gitcoin', 'ENS', 'IPFS/Filecoin', 'The Graph', 'Ceramic Network',
  'Axie Infinity', 'Decentraland', 'The Sandbox', 'Immutable', 'Ronin Network',
  'Circle', 'Paxos', 'Fireblocks', 'Chainalysis', 'Elliptic',
];

const JOB_TEMPLATES: { title: string; type: Job['type']; salaryRange: [string, string]; minScore: number; badges: string[] }[] = [
  { title: 'Senior Solidity Developer', type: 'Full-time', salaryRange: ['$160k', '$240k'], minScore: 75, badges: ['Advanced Badge'] },
  { title: 'Smart Contract Auditor', type: 'Full-time', salaryRange: ['$180k', '$280k'], minScore: 80, badges: ['Advanced Badge'] },
  { title: 'Frontend Engineer (React/Web3)', type: 'Full-time', salaryRange: ['$130k', '$200k'], minScore: 60, badges: ['Intermediate Badge'] },
  { title: 'Backend Engineer (Rust)', type: 'Full-time', salaryRange: ['$150k', '$230k'], minScore: 70, badges: ['Advanced Badge'] },
  { title: 'Protocol Engineer', type: 'Full-time', salaryRange: ['$170k', '$260k'], minScore: 80, badges: ['Advanced Badge'] },
  { title: 'DevOps / Infrastructure Engineer', type: 'Full-time', salaryRange: ['$140k', '$210k'], minScore: 55, badges: ['Intermediate Badge'] },
  { title: 'Community Manager', type: 'Contract', salaryRange: ['$4k/mo', '$8k/mo'], minScore: 30, badges: ['Beginner Badge'] },
  { title: 'Technical Writer', type: 'Contract', salaryRange: ['$5k/mo', '$10k/mo'], minScore: 40, badges: ['Beginner Badge'] },
  { title: 'Marketing Lead', type: 'Contract', salaryRange: ['$6k/mo', '$12k/mo'], minScore: 45, badges: ['Intermediate Badge'] },
  { title: 'Growth Hacker', type: 'Contract', salaryRange: ['$5k/mo', '$9k/mo'], minScore: 35, badges: [] },
  { title: 'Governance Delegate', type: 'DAO', salaryRange: ['$3k/mo', '$7k/mo'], minScore: 50, badges: ['Intermediate Badge'] },
  { title: 'Treasury Manager', type: 'DAO', salaryRange: ['$8k/mo', '$15k/mo'], minScore: 70, badges: ['Advanced Badge'] },
  { title: 'DAO Operations Lead', type: 'DAO', salaryRange: ['$6k/mo', '$11k/mo'], minScore: 55, badges: ['Intermediate Badge'] },
  { title: 'Grants Reviewer', type: 'DAO', salaryRange: ['$2k/mo', '$5k/mo'], minScore: 40, badges: [] },
  { title: 'Hackathon Teammate: Frontend', type: 'Collaboration', salaryRange: ['Prize Pool', 'Share'], minScore: 25, badges: [] },
  { title: 'Hackathon Teammate: Smart Contracts', type: 'Collaboration', salaryRange: ['Prize Pool', 'Share'], minScore: 35, badges: ['Beginner Badge'] },
  { title: 'Open Source Contributor', type: 'Collaboration', salaryRange: ['Bounty', '$500-$5k'], minScore: 20, badges: [] },
  { title: 'Research Collaborator', type: 'Collaboration', salaryRange: ['Co-author', 'Credit'], minScore: 50, badges: ['Intermediate Badge'] },
  { title: 'Logo & Brand Designer', type: 'Gig', salaryRange: ['$500', '$2k'], minScore: 15, badges: [] },
  { title: 'NFT Artist', type: 'Gig', salaryRange: ['$1k', '$10k'], minScore: 20, badges: [] },
  { title: 'Video Content Creator', type: 'Gig', salaryRange: ['$800', '$3k'], minScore: 25, badges: [] },
  { title: 'Social Media Manager', type: 'Gig', salaryRange: ['$1k/mo', '$4k/mo'], minScore: 20, badges: [] },
  { title: 'UI/UX Designer', type: 'Full-time', salaryRange: ['$120k', '$180k'], minScore: 50, badges: ['Intermediate Badge'] },
  { title: 'Product Manager', type: 'Full-time', salaryRange: ['$140k', '$220k'], minScore: 65, badges: ['Advanced Badge'] },
  { title: 'Data Analyst (On-Chain)', type: 'Full-time', salaryRange: ['$110k', '$170k'], minScore: 55, badges: ['Intermediate Badge'] },
  { title: 'Security Researcher', type: 'Contract', salaryRange: ['$10k/mo', '$20k/mo'], minScore: 80, badges: ['Advanced Badge'] },
  { title: 'QA Engineer', type: 'Contract', salaryRange: ['$4k/mo', '$8k/mo'], minScore: 35, badges: [] },
  { title: 'DeFi Strategist', type: 'Full-time', salaryRange: ['$150k', '$220k'], minScore: 70, badges: ['Advanced Badge'] },
  { title: 'Tokenomics Advisor', type: 'Contract', salaryRange: ['$8k/mo', '$15k/mo'], minScore: 65, badges: ['Advanced Badge'] },
  { title: 'Blockchain Educator', type: 'Gig', salaryRange: ['$2k', '$5k'], minScore: 30, badges: ['Beginner Badge'] },
];

function generateJobs(): Job[] {
  const jobs: Job[] = [];
  for (let i = 0; i < 100; i++) {
    const template = JOB_TEMPLATES[i % JOB_TEMPLATES.length];
    const company = COMPANIES[i % COMPANIES.length];
    const salary = template.salaryRange[0] === 'Prize Pool' || template.salaryRange[0] === 'Bounty' || template.salaryRange[0] === 'Co-author'
      ? `${template.salaryRange[0]} ${template.salaryRange[1]}`
      : `${template.salaryRange[0]} - ${template.salaryRange[1]}`;
    
    jobs.push({
      id: String(i + 1),
      title: template.title,
      company,
      type: template.type,
      salary,
      minScore: template.minScore + (i % 5) * 2,
      requiredBadges: template.badges,
    });
  }
  return jobs;
}

export const ALL_JOBS: Job[] = generateJobs();
