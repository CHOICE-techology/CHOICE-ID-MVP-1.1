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
  // Web2 Tech Companies (expanding into Web3)
  'Stripe', 'Shopify', 'PayPal', 'Visa', 'Mastercard', 'JPMorgan Onyx',
  'BlackRock Digital', 'Fidelity Digital', 'Goldman Sachs Digital',
  'Google Cloud Web3', 'Amazon Web Services', 'Microsoft Azure Blockchain',
  'Spotify Web3', 'Adobe Web3', 'Salesforce Web3',
  // Startups
  'LayerZero', 'Wormhole', 'Across Protocol', 'Socket', 'Superbridge',
  'Privy', 'Dynamic', 'Web3Auth', 'Magic Labs', 'Turnkey',
];

interface JobTemplate {
  title: string;
  type: Job['type'];
  salaryRange: [string, string];
  minScore: number;
  badges: string[];
  description: string;
  skills: string[];
  category: string;
}

const JOB_TEMPLATES: JobTemplate[] = [
  // ── ENGINEERING: Solidity / Smart Contracts ──
  { title: 'Senior Solidity Developer', type: 'Full-time', salaryRange: ['$160k', '$240k'], minScore: 75, badges: ['Advanced Badge'], category: 'Engineering', description: 'Design and implement secure smart contracts for DeFi protocols. Lead code reviews and mentor junior developers on Solidity best practices.', skills: ['Solidity', 'EVM', 'DeFi Protocols', 'Security Auditing'] },
  { title: 'Smart Contract Auditor', type: 'Full-time', salaryRange: ['$180k', '$280k'], minScore: 80, badges: ['Advanced Badge'], category: 'Engineering', description: 'Perform comprehensive security audits of smart contracts. Identify vulnerabilities, write detailed reports, and recommend mitigations.', skills: ['Solidity', 'Security Auditing', 'Formal Verification', 'DeFi Protocols'] },
  { title: 'Lead Smart Contract Engineer', type: 'Full-time', salaryRange: ['$200k', '$300k'], minScore: 85, badges: ['Advanced Badge'], category: 'Engineering', description: 'Architect and lead development of core protocol smart contracts. Define technical standards and oversee deployment pipelines.', skills: ['Solidity', 'Architecture', 'Team Leadership', 'EVM'] },
  { title: 'ZK Circuit Engineer', type: 'Full-time', salaryRange: ['$190k', '$290k'], minScore: 80, badges: ['Advanced Badge'], category: 'Engineering', description: 'Build zero-knowledge proof circuits for privacy-preserving applications. Optimize prover performance and integrate with on-chain verifiers.', skills: ['Zero-Knowledge Proofs', 'Circom', 'Rust', 'Cryptography'] },
  { title: 'Protocol Engineer', type: 'Full-time', salaryRange: ['$170k', '$260k'], minScore: 80, badges: ['Advanced Badge'], category: 'Engineering', description: 'Develop and maintain core blockchain protocol infrastructure. Implement consensus mechanisms and peer-to-peer networking layers.', skills: ['Rust', 'Go', 'Distributed Systems', 'Consensus Mechanisms'] },

  // ── ENGINEERING: Frontend / Full-Stack ──
  { title: 'Frontend Engineer (React/Web3)', type: 'Full-time', salaryRange: ['$130k', '$200k'], minScore: 60, badges: ['Intermediate Badge'], category: 'Engineering', description: 'Build responsive dApp interfaces using React and Web3 libraries. Integrate wallet connections, transaction signing, and real-time blockchain data.', skills: ['React', 'TypeScript', 'Web3.js', 'UI/UX'] },
  { title: 'Full-Stack Web3 Developer', type: 'Full-time', salaryRange: ['$140k', '$220k'], minScore: 65, badges: ['Intermediate Badge'], category: 'Engineering', description: 'Develop end-to-end decentralized applications from smart contracts to user interfaces. Handle indexing, APIs, and frontend state management.', skills: ['React', 'Node.js', 'Solidity', 'GraphQL'] },
  { title: 'Senior TypeScript Engineer', type: 'Full-time', salaryRange: ['$150k', '$230k'], minScore: 70, badges: ['Intermediate Badge'], category: 'Engineering', description: 'Build high-performance TypeScript applications for blockchain tooling. Design type-safe SDKs and developer-facing APIs.', skills: ['TypeScript', 'Node.js', 'API Design', 'Testing'] },
  { title: 'dApp Developer', type: 'Full-time', salaryRange: ['$120k', '$190k'], minScore: 55, badges: ['Intermediate Badge'], category: 'Engineering', description: 'Create user-friendly decentralized applications. Integrate smart contracts with frontend interfaces and ensure seamless wallet interactions.', skills: ['React', 'Ethers.js', 'Solidity', 'IPFS'] },
  { title: 'Mobile Web3 Developer', type: 'Full-time', salaryRange: ['$135k', '$210k'], minScore: 60, badges: ['Intermediate Badge'], category: 'Engineering', description: 'Build native mobile applications with embedded wallet functionality. Implement biometric signing and push notification systems for on-chain events.', skills: ['React Native', 'Swift', 'Kotlin', 'Web3'] },

  // ── ENGINEERING: Backend / Infra ──
  { title: 'Backend Engineer (Rust)', type: 'Full-time', salaryRange: ['$150k', '$230k'], minScore: 70, badges: ['Advanced Badge'], category: 'Engineering', description: 'Build high-performance backend services in Rust for blockchain infrastructure. Optimize data processing pipelines and indexing systems.', skills: ['Rust', 'PostgreSQL', 'Distributed Systems', 'Performance Optimization'] },
  { title: 'Backend Engineer (Go)', type: 'Full-time', salaryRange: ['$140k', '$210k'], minScore: 65, badges: ['Intermediate Badge'], category: 'Engineering', description: 'Develop microservices and APIs in Go for Web3 platforms. Build reliable indexing and caching layers for blockchain data.', skills: ['Go', 'Microservices', 'Docker', 'PostgreSQL'] },
  { title: 'DevOps / Infrastructure Engineer', type: 'Full-time', salaryRange: ['$140k', '$210k'], minScore: 55, badges: ['Intermediate Badge'], category: 'Engineering', description: 'Manage cloud infrastructure and CI/CD pipelines for blockchain nodes and services. Ensure high availability and disaster recovery.', skills: ['Kubernetes', 'Terraform', 'AWS', 'Monitoring'] },
  { title: 'Site Reliability Engineer', type: 'Full-time', salaryRange: ['$150k', '$220k'], minScore: 60, badges: ['Intermediate Badge'], category: 'Engineering', description: 'Maintain 99.99% uptime for critical Web3 infrastructure. Implement monitoring, alerting, and incident response procedures.', skills: ['SRE', 'Kubernetes', 'Prometheus', 'Incident Response'] },
  { title: 'Blockchain Node Operator', type: 'Full-time', salaryRange: ['$120k', '$180k'], minScore: 50, badges: ['Intermediate Badge'], category: 'Engineering', description: 'Operate and maintain blockchain validator and RPC nodes. Monitor network health, handle upgrades, and optimize performance.', skills: ['Linux', 'Networking', 'Docker', 'Blockchain Infrastructure'] },

  // ── DATA & ANALYTICS ──
  { title: 'Data Engineer (On-Chain Analytics)', type: 'Full-time', salaryRange: ['$130k', '$200k'], minScore: 60, badges: ['Intermediate Badge'], category: 'Data', description: 'Build ETL pipelines to process and index blockchain data. Create queryable datasets for on-chain analytics and business intelligence.', skills: ['SQL', 'Python', 'ETL Pipelines', 'On-Chain Data'] },
  { title: 'Data Analyst (On-Chain)', type: 'Full-time', salaryRange: ['$110k', '$170k'], minScore: 55, badges: ['Intermediate Badge'], category: 'Data', description: 'Analyze blockchain transaction data to extract insights on protocol usage, user behavior, and market trends. Create dashboards and reports.', skills: ['SQL', 'Dune Analytics', 'Data Visualization', 'Python'] },
  { title: 'Data Scientist (DeFi)', type: 'Full-time', salaryRange: ['$140k', '$220k'], minScore: 65, badges: ['Advanced Badge'], category: 'Data', description: 'Apply statistical modeling and machine learning to DeFi protocol optimization. Analyze liquidity patterns, yield strategies, and risk metrics.', skills: ['Python', 'Machine Learning', 'Statistics', 'DeFi Protocols'] },
  { title: 'Business Intelligence Analyst', type: 'Full-time', salaryRange: ['$100k', '$160k'], minScore: 45, badges: ['Beginner Badge'], category: 'Data', description: 'Build dashboards and reports to track KPIs across protocol growth, user acquisition, and revenue. Support data-driven decision making.', skills: ['SQL', 'Tableau', 'Data Visualization', 'Excel'] },
  { title: 'Blockchain Data Indexer Engineer', type: 'Full-time', salaryRange: ['$135k', '$200k'], minScore: 60, badges: ['Intermediate Badge'], category: 'Data', description: 'Design and build subgraphs and custom indexing solutions for blockchain data. Optimize query performance for real-time dApp interfaces.', skills: ['The Graph', 'GraphQL', 'TypeScript', 'Blockchain Data'] },

  // ── AI & MACHINE LEARNING ──
  { title: 'ML Engineer (Crypto Fraud Detection)', type: 'Full-time', salaryRange: ['$160k', '$250k'], minScore: 70, badges: ['Advanced Badge'], category: 'AI', description: 'Develop ML models to detect fraudulent transactions, wash trading, and suspicious wallet behavior across blockchain networks.', skills: ['Python', 'Machine Learning', 'Fraud Detection', 'On-Chain Data'] },
  { title: 'AI Agent Developer', type: 'Full-time', salaryRange: ['$170k', '$260k'], minScore: 75, badges: ['Advanced Badge'], category: 'AI', description: 'Build autonomous AI agents that interact with blockchain protocols. Design decision-making frameworks for DeFi strategies and DAO operations.', skills: ['Python', 'LLMs', 'Smart Contracts', 'Agent Frameworks'] },
  { title: 'AI/ML Research Engineer (Web3)', type: 'Full-time', salaryRange: ['$180k', '$280k'], minScore: 80, badges: ['Advanced Badge'], category: 'AI', description: 'Conduct applied research at the intersection of AI and blockchain. Publish papers and build novel systems for decentralized intelligence.', skills: ['Machine Learning', 'Research', 'Python', 'Distributed Systems'] },
  { title: 'Prompt Engineer (Crypto Products)', type: 'Contract', salaryRange: ['$5k/mo', '$10k/mo'], minScore: 40, badges: [], category: 'AI', description: 'Design and optimize AI prompts for crypto-native products. Build prompt pipelines for automated analysis, content generation, and user support.', skills: ['Prompt Engineering', 'LLMs', 'Content Strategy', 'Crypto Knowledge'] },
  { title: 'AI Product Manager', type: 'Full-time', salaryRange: ['$150k', '$230k'], minScore: 65, badges: ['Advanced Badge'], category: 'AI', description: 'Define product roadmaps for AI-powered Web3 tools. Coordinate between ML engineers and frontend teams to ship intelligent features.', skills: ['Product Management', 'AI/ML Understanding', 'Roadmapping', 'Stakeholder Management'] },

  // ── PRODUCT ──
  { title: 'Product Manager', type: 'Full-time', salaryRange: ['$140k', '$220k'], minScore: 65, badges: ['Advanced Badge'], category: 'Product', description: 'Define product vision and strategy for decentralized applications. Prioritize features, manage sprints, and drive user adoption through data.', skills: ['Product Strategy', 'Agile', 'User Research', 'Analytics'] },
  { title: 'Head of Product', type: 'Full-time', salaryRange: ['$160k', '$250k'], minScore: 75, badges: ['Advanced Badge'], category: 'Product', description: 'Lead the product organization and set strategic direction. Mentor PMs, define OKRs, and align product with business goals.', skills: ['Product Leadership', 'Strategy', 'Team Management', 'Web3 Knowledge'] },
  { title: 'Technical Product Manager', type: 'Full-time', salaryRange: ['$145k', '$225k'], minScore: 65, badges: ['Intermediate Badge'], category: 'Product', description: 'Bridge engineering and business teams for protocol development. Write technical specifications, manage API products, and coordinate releases.', skills: ['Technical Writing', 'API Design', 'Engineering Coordination', 'Product Management'] },
  { title: 'Product Analyst', type: 'Full-time', salaryRange: ['$100k', '$155k'], minScore: 45, badges: ['Beginner Badge'], category: 'Product', description: 'Analyze user behavior and product metrics to inform roadmap decisions. Build funnels, run A/B tests, and report on feature adoption.', skills: ['Analytics', 'SQL', 'A/B Testing', 'Product Metrics'] },
  { title: 'Product Operations Manager', type: 'Full-time', salaryRange: ['$110k', '$170k'], minScore: 50, badges: ['Intermediate Badge'], category: 'Product', description: 'Streamline product processes, manage tooling, and coordinate cross-functional launches. Build and maintain product documentation systems.', skills: ['Operations', 'Project Management', 'Documentation', 'Process Optimization'] },

  // ── DESIGN ──
  { title: 'Senior Product Designer', type: 'Full-time', salaryRange: ['$130k', '$200k'], minScore: 55, badges: ['Intermediate Badge'], category: 'Design', description: 'Lead design for complex DeFi and Web3 interfaces. Conduct user research, create design systems, and ship pixel-perfect experiences.', skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping'] },
  { title: 'UI/UX Designer', type: 'Full-time', salaryRange: ['$120k', '$180k'], minScore: 50, badges: ['Intermediate Badge'], category: 'Design', description: 'Create intuitive interfaces for blockchain applications. Design user flows, wireframes, and high-fidelity mockups for Web3 products.', skills: ['Figma', 'UI Design', 'UX Design', 'Wireframing'] },
  { title: 'UX Researcher (Crypto)', type: 'Full-time', salaryRange: ['$110k', '$170k'], minScore: 50, badges: [], category: 'Design', description: 'Conduct qualitative and quantitative user research for crypto products. Run usability tests, interviews, and surveys to improve user experience.', skills: ['User Research', 'Usability Testing', 'Data Analysis', 'Interview Skills'] },
  { title: 'Brand Designer', type: 'Full-time', salaryRange: ['$100k', '$160k'], minScore: 40, badges: ['Beginner Badge'], category: 'Design', description: 'Develop and maintain brand identity across all touchpoints. Create visual assets, brand guidelines, and marketing materials.', skills: ['Brand Design', 'Illustration', 'Typography', 'Adobe Creative Suite'] },
  { title: 'Motion Designer', type: 'Contract', salaryRange: ['$5k/mo', '$10k/mo'], minScore: 35, badges: [], category: 'Design', description: 'Create engaging animations and motion graphics for Web3 products. Design micro-interactions, loading states, and promotional videos.', skills: ['After Effects', 'Motion Design', 'Animation', 'Video Production'] },

  // ── MARKETING & GROWTH ──
  { title: 'Head of Marketing', type: 'Full-time', salaryRange: ['$130k', '$200k'], minScore: 55, badges: ['Intermediate Badge'], category: 'Marketing', description: 'Lead marketing strategy for protocol growth and brand awareness. Manage campaigns, partnerships, and content across all channels.', skills: ['Marketing Strategy', 'Brand Building', 'Team Leadership', 'Analytics'] },
  { title: 'Growth Marketing Manager', type: 'Full-time', salaryRange: ['$110k', '$175k'], minScore: 45, badges: ['Intermediate Badge'], category: 'Marketing', description: 'Drive user acquisition and retention through data-driven growth experiments. Optimize funnels, run campaigns, and scale community programs.', skills: ['Growth Hacking', 'Analytics', 'SEO/SEM', 'Conversion Optimization'] },
  { title: 'Content Marketing Manager', type: 'Full-time', salaryRange: ['$90k', '$140k'], minScore: 40, badges: ['Beginner Badge'], category: 'Marketing', description: 'Create and manage content strategy across blog, social media, and educational resources. Build thought leadership and organic traffic.', skills: ['Content Strategy', 'SEO', 'Writing', 'Social Media'] },
  { title: 'Social Media Manager', type: 'Gig', salaryRange: ['$1k/mo', '$4k/mo'], minScore: 20, badges: [], category: 'Marketing', description: 'Manage social media presence across Twitter/X, Discord, and other platforms. Create engaging content and grow community engagement.', skills: ['Social Media', 'Content Creation', 'Community Engagement', 'Analytics'] },
  { title: 'Marketing Lead', type: 'Contract', salaryRange: ['$6k/mo', '$12k/mo'], minScore: 45, badges: ['Intermediate Badge'], category: 'Marketing', description: 'Plan and execute marketing campaigns for product launches and token events. Coordinate with design and engineering teams.', skills: ['Campaign Management', 'Digital Marketing', 'Analytics', 'Project Management'] },
  { title: 'Growth Hacker', type: 'Contract', salaryRange: ['$5k/mo', '$9k/mo'], minScore: 35, badges: [], category: 'Marketing', description: 'Experiment with creative growth tactics for decentralized products. Identify viral loops, referral mechanisms, and incentive designs.', skills: ['Growth Experimentation', 'Analytics', 'Creative Strategy', 'Crypto Native'] },
  { title: 'Influencer Relations Manager', type: 'Contract', salaryRange: ['$4k/mo', '$8k/mo'], minScore: 35, badges: [], category: 'Marketing', description: 'Build and manage relationships with crypto influencers and KOLs. Coordinate sponsored content and partnership campaigns.', skills: ['Influencer Marketing', 'Relationship Management', 'Negotiation', 'Social Media'] },
  { title: 'PR & Communications Manager', type: 'Full-time', salaryRange: ['$100k', '$160k'], minScore: 45, badges: ['Beginner Badge'], category: 'Marketing', description: 'Manage public relations and media communications. Draft press releases, coordinate media outreach, and handle crisis communications.', skills: ['Public Relations', 'Media Relations', 'Writing', 'Crisis Management'] },
  { title: 'Email Marketing Specialist', type: 'Contract', salaryRange: ['$3k/mo', '$6k/mo'], minScore: 25, badges: [], category: 'Marketing', description: 'Design and execute email marketing campaigns for protocol updates and user re-engagement. Optimize open rates and conversion funnels.', skills: ['Email Marketing', 'Copywriting', 'Automation', 'Analytics'] },
  { title: 'SEO Specialist (Web3)', type: 'Contract', salaryRange: ['$4k/mo', '$7k/mo'], minScore: 30, badges: [], category: 'Marketing', description: 'Optimize web properties for search visibility in the crypto and DeFi space. Conduct keyword research and build link-building strategies.', skills: ['SEO', 'Content Strategy', 'Analytics', 'Technical SEO'] },

  // ── COMMUNITY ──
  { title: 'Community Manager', type: 'Contract', salaryRange: ['$4k/mo', '$8k/mo'], minScore: 30, badges: ['Beginner Badge'], category: 'Community', description: 'Build and nurture vibrant online communities on Discord, Telegram, and forums. Moderate discussions, organize events, and onboard new users.', skills: ['Community Building', 'Discord', 'Telegram', 'Event Organization'] },
  { title: 'Head of Community', type: 'Full-time', salaryRange: ['$120k', '$180k'], minScore: 50, badges: ['Intermediate Badge'], category: 'Community', description: 'Lead community strategy and team. Define engagement frameworks, measure community health, and align community goals with product roadmap.', skills: ['Community Strategy', 'Team Leadership', 'Analytics', 'Partnership Building'] },
  { title: 'Developer Relations Engineer', type: 'Full-time', salaryRange: ['$140k', '$220k'], minScore: 60, badges: ['Intermediate Badge'], category: 'Community', description: 'Enable external developers to build on the protocol. Create tutorials, documentation, SDKs, and represent the project at conferences.', skills: ['Developer Advocacy', 'Technical Writing', 'Public Speaking', 'SDK Development'] },
  { title: 'Community Moderator', type: 'Gig', salaryRange: ['$500/mo', '$2k/mo'], minScore: 15, badges: [], category: 'Community', description: 'Moderate community channels, answer user questions, and enforce community guidelines. Report issues and gather user feedback.', skills: ['Moderation', 'Communication', 'Crypto Knowledge', 'Patience'] },
  { title: 'Ambassador Program Lead', type: 'Contract', salaryRange: ['$4k/mo', '$8k/mo'], minScore: 40, badges: ['Beginner Badge'], category: 'Community', description: 'Design and manage global ambassador programs. Recruit ambassadors, create training materials, and track regional community growth.', skills: ['Program Management', 'Community Building', 'Content Creation', 'Analytics'] },
  { title: 'Events & Partnerships Manager', type: 'Full-time', salaryRange: ['$100k', '$160k'], minScore: 45, badges: ['Intermediate Badge'], category: 'Community', description: 'Plan and execute community events, hackathons, and conference presence. Build strategic partnerships with other protocols and communities.', skills: ['Event Planning', 'Partnership Development', 'Negotiation', 'Project Management'] },

  // ── OPERATIONS ──
  { title: 'Operations Manager', type: 'Full-time', salaryRange: ['$110k', '$170k'], minScore: 50, badges: ['Intermediate Badge'], category: 'Operations', description: 'Oversee day-to-day operations including vendor management, budgeting, and cross-team coordination. Ensure organizational efficiency.', skills: ['Operations Management', 'Budgeting', 'Process Optimization', 'Project Management'] },
  { title: 'Chief of Staff', type: 'Full-time', salaryRange: ['$140k', '$210k'], minScore: 65, badges: ['Advanced Badge'], category: 'Operations', description: 'Support executive leadership with strategic planning, organizational design, and cross-functional project management. Drive key initiatives.', skills: ['Strategy', 'Project Management', 'Communication', 'Leadership'] },
  { title: 'People Operations Manager', type: 'Full-time', salaryRange: ['$100k', '$160k'], minScore: 45, badges: ['Beginner Badge'], category: 'Operations', description: 'Build HR processes for a remote-first Web3 team. Manage hiring pipelines, onboarding, compensation, and team culture initiatives.', skills: ['HR', 'Recruiting', 'Compensation', 'Culture Building'] },
  { title: 'Finance & Treasury Manager', type: 'Full-time', salaryRange: ['$120k', '$190k'], minScore: 60, badges: ['Intermediate Badge'], category: 'Operations', description: 'Manage corporate treasury and protocol-owned liquidity. Handle financial reporting, budgeting, and multi-sig operations.', skills: ['Finance', 'Treasury Management', 'DeFi', 'Financial Reporting'] },
  { title: 'Project Manager', type: 'Full-time', salaryRange: ['$95k', '$150k'], minScore: 40, badges: ['Beginner Badge'], category: 'Operations', description: 'Coordinate engineering and product teams across sprints and milestones. Track deliverables, manage dependencies, and facilitate communication.', skills: ['Project Management', 'Agile', 'Communication', 'Jira'] },
  { title: 'Executive Assistant', type: 'Full-time', salaryRange: ['$70k', '$110k'], minScore: 25, badges: [], category: 'Operations', description: 'Provide high-level administrative support to C-suite executives. Manage calendars, travel, communications, and special projects.', skills: ['Administration', 'Calendar Management', 'Communication', 'Organization'] },
  { title: 'Office Manager (Hybrid)', type: 'Full-time', salaryRange: ['$65k', '$100k'], minScore: 20, badges: [], category: 'Operations', description: 'Manage office facilities and hybrid work logistics. Coordinate team offsites, manage vendors, and maintain workplace culture.', skills: ['Office Management', 'Vendor Relations', 'Event Coordination', 'Budgeting'] },

  // ── BUSINESS DEVELOPMENT ──
  { title: 'Business Development Lead', type: 'Full-time', salaryRange: ['$130k', '$200k'], minScore: 60, badges: ['Intermediate Badge'], category: 'Business', description: 'Identify and close strategic partnerships with protocols, institutions, and enterprises. Drive integration deals and co-marketing opportunities.', skills: ['Business Development', 'Partnerships', 'Negotiation', 'Sales'] },
  { title: 'Strategic Partnerships Manager', type: 'Full-time', salaryRange: ['$120k', '$185k'], minScore: 55, badges: ['Intermediate Badge'], category: 'Business', description: 'Build and manage ecosystem partnerships. Negotiate integration agreements, coordinate co-development projects, and track partnership KPIs.', skills: ['Partnership Management', 'Negotiation', 'Relationship Building', 'Strategy'] },
  { title: 'Enterprise Sales Manager', type: 'Full-time', salaryRange: ['$130k', '$200k + commission'], minScore: 55, badges: ['Intermediate Badge'], category: 'Business', description: 'Sell blockchain infrastructure and enterprise solutions to Fortune 500 companies. Manage full sales cycle from prospecting to close.', skills: ['Enterprise Sales', 'CRM', 'Presentation Skills', 'Blockchain Knowledge'] },
  { title: 'Institutional Sales Associate', type: 'Full-time', salaryRange: ['$100k', '$160k + bonus'], minScore: 50, badges: ['Intermediate Badge'], category: 'Business', description: 'Engage institutional investors and asset managers interested in digital assets. Build relationships and coordinate onboarding processes.', skills: ['Institutional Sales', 'Finance', 'Relationship Management', 'Crypto Markets'] },
  { title: 'Account Manager', type: 'Full-time', salaryRange: ['$90k', '$140k'], minScore: 40, badges: ['Beginner Badge'], category: 'Business', description: 'Manage ongoing relationships with enterprise and protocol partners. Ensure client success, coordinate support, and identify upsell opportunities.', skills: ['Account Management', 'Client Relations', 'Communication', 'Problem Solving'] },
  { title: 'Revenue Operations Analyst', type: 'Full-time', salaryRange: ['$90k', '$140k'], minScore: 40, badges: ['Beginner Badge'], category: 'Business', description: 'Optimize sales and revenue processes. Build dashboards, manage CRM data, and analyze pipeline metrics to drive business growth.', skills: ['Revenue Operations', 'CRM', 'Analytics', 'Process Optimization'] },

  // ── LEGAL & COMPLIANCE ──
  { title: 'Crypto Legal Counsel', type: 'Full-time', salaryRange: ['$180k', '$280k'], minScore: 70, badges: ['Advanced Badge'], category: 'Legal', description: 'Provide legal guidance on token launches, securities compliance, and regulatory matters. Draft terms, policies, and partnership agreements.', skills: ['Crypto Law', 'Securities Regulation', 'Contract Drafting', 'Regulatory Compliance'] },
  { title: 'Compliance Officer', type: 'Full-time', salaryRange: ['$130k', '$200k'], minScore: 55, badges: ['Intermediate Badge'], category: 'Legal', description: 'Implement and maintain AML/KYC compliance programs. Monitor regulatory changes and ensure organizational compliance across jurisdictions.', skills: ['AML/KYC', 'Regulatory Compliance', 'Risk Management', 'Policy Development'] },
  { title: 'Regulatory Affairs Lead', type: 'Full-time', salaryRange: ['$140k', '$210k'], minScore: 60, badges: ['Intermediate Badge'], category: 'Legal', description: 'Navigate global regulatory landscape for crypto operations. Engage with regulators, prepare submissions, and advise on licensing requirements.', skills: ['Regulatory Affairs', 'Government Relations', 'Policy Analysis', 'Compliance'] },
  { title: 'Privacy & Data Protection Officer', type: 'Full-time', salaryRange: ['$130k', '$190k'], minScore: 55, badges: ['Intermediate Badge'], category: 'Legal', description: 'Ensure compliance with GDPR, CCPA, and emerging privacy regulations. Implement privacy-by-design principles in product development.', skills: ['Data Privacy', 'GDPR', 'Policy Development', 'Risk Assessment'] },
  { title: 'Paralegal (Crypto)', type: 'Full-time', salaryRange: ['$70k', '$110k'], minScore: 30, badges: ['Beginner Badge'], category: 'Legal', description: 'Support legal team with research, document preparation, and compliance tasks. Manage contracts and assist with regulatory filings.', skills: ['Legal Research', 'Document Management', 'Contract Review', 'Organization'] },

  // ── SECURITY ──
  { title: 'Security Researcher', type: 'Contract', salaryRange: ['$10k/mo', '$20k/mo'], minScore: 80, badges: ['Advanced Badge'], category: 'Security', description: 'Discover and report vulnerabilities in smart contracts and protocols. Conduct deep security research and publish findings.', skills: ['Security Research', 'Solidity', 'Vulnerability Assessment', 'Reverse Engineering'] },
  { title: 'Penetration Tester (Web3)', type: 'Contract', salaryRange: ['$8k/mo', '$16k/mo'], minScore: 75, badges: ['Advanced Badge'], category: 'Security', description: 'Perform penetration testing on Web3 applications and infrastructure. Test frontend, backend, and smart contract attack surfaces.', skills: ['Penetration Testing', 'Web3 Security', 'Network Security', 'Reporting'] },
  { title: 'Bug Bounty Hunter', type: 'Gig', salaryRange: ['$1k', '$100k+'], minScore: 70, badges: ['Advanced Badge'], category: 'Security', description: 'Find and responsibly disclose security vulnerabilities in live protocols. Earn rewards based on severity and impact of findings.', skills: ['Bug Hunting', 'Smart Contract Security', 'Web Security', 'Documentation'] },
  { title: 'Security Operations Engineer', type: 'Full-time', salaryRange: ['$130k', '$200k'], minScore: 60, badges: ['Intermediate Badge'], category: 'Security', description: 'Build and maintain security monitoring and incident response systems. Implement threat detection and manage security tools across infrastructure.', skills: ['Security Operations', 'Monitoring', 'Incident Response', 'Cloud Security'] },

  // ── DEFI SPECIFIC ──
  { title: 'DeFi Strategist', type: 'Full-time', salaryRange: ['$150k', '$220k'], minScore: 70, badges: ['Advanced Badge'], category: 'DeFi', description: 'Design and optimize DeFi yield strategies. Analyze protocol economics, manage liquidity positions, and research new financial primitives.', skills: ['DeFi Protocols', 'Financial Modeling', 'Risk Management', 'Tokenomics'] },
  { title: 'Tokenomics Advisor', type: 'Contract', salaryRange: ['$8k/mo', '$15k/mo'], minScore: 65, badges: ['Advanced Badge'], category: 'DeFi', description: 'Design token economics and incentive mechanisms for new protocols. Model emission schedules, governance structures, and value accrual.', skills: ['Tokenomics', 'Economic Modeling', 'Game Theory', 'Protocol Design'] },
  { title: 'Liquidity Manager', type: 'Full-time', salaryRange: ['$130k', '$200k'], minScore: 65, badges: ['Advanced Badge'], category: 'DeFi', description: 'Manage protocol liquidity across multiple DEXs and chains. Optimize market making strategies and treasury-owned liquidity positions.', skills: ['Liquidity Management', 'DeFi', 'Market Making', 'Multi-Chain'] },
  { title: 'MEV Researcher', type: 'Full-time', salaryRange: ['$180k', '$300k'], minScore: 85, badges: ['Advanced Badge'], category: 'DeFi', description: 'Research and develop MEV extraction and protection strategies. Analyze mempool dynamics and build searcher infrastructure.', skills: ['MEV', 'EVM', 'Rust', 'Financial Engineering'] },
  { title: 'Quantitative Trader (Crypto)', type: 'Full-time', salaryRange: ['$160k', '$300k + PnL'], minScore: 75, badges: ['Advanced Badge'], category: 'DeFi', description: 'Develop and execute quantitative trading strategies across crypto markets. Build automated systems for arbitrage and market making.', skills: ['Quantitative Finance', 'Python', 'Trading Systems', 'Statistics'] },
  { title: 'Risk Analyst (DeFi)', type: 'Full-time', salaryRange: ['$110k', '$175k'], minScore: 55, badges: ['Intermediate Badge'], category: 'DeFi', description: 'Assess and monitor risks in DeFi protocols. Analyze smart contract risks, oracle dependencies, and systemic vulnerabilities.', skills: ['Risk Analysis', 'DeFi', 'Financial Modeling', 'Smart Contract Analysis'] },

  // ── DAO ROLES ──
  { title: 'Governance Delegate', type: 'DAO', salaryRange: ['$3k/mo', '$7k/mo'], minScore: 50, badges: ['Intermediate Badge'], category: 'DAO', description: 'Represent token holders in governance proposals and votes. Research proposals, engage with community, and advocate for protocol improvements.', skills: ['Governance', 'Research', 'Communication', 'Protocol Knowledge'] },
  { title: 'Treasury Manager', type: 'DAO', salaryRange: ['$8k/mo', '$15k/mo'], minScore: 70, badges: ['Advanced Badge'], category: 'DAO', description: 'Manage DAO treasury assets and diversification strategy. Execute multi-sig transactions, report on treasury health, and propose budgets.', skills: ['Treasury Management', 'DeFi', 'Multi-Sig', 'Financial Reporting'] },
  { title: 'DAO Operations Lead', type: 'DAO', salaryRange: ['$6k/mo', '$11k/mo'], minScore: 55, badges: ['Intermediate Badge'], category: 'DAO', description: 'Coordinate daily DAO operations including contributor payments, tooling, and process optimization. Maintain organizational documentation.', skills: ['DAO Operations', 'Project Management', 'Tooling', 'Documentation'] },
  { title: 'Grants Program Manager', type: 'DAO', salaryRange: ['$5k/mo', '$10k/mo'], minScore: 50, badges: ['Intermediate Badge'], category: 'DAO', description: 'Manage grant application review process and funded project tracking. Coordinate with grantees, evaluate milestones, and report outcomes.', skills: ['Grants Management', 'Project Evaluation', 'Communication', 'Reporting'] },
  { title: 'Grants Reviewer', type: 'DAO', salaryRange: ['$2k/mo', '$5k/mo'], minScore: 40, badges: [], category: 'DAO', description: 'Evaluate grant applications for technical feasibility and alignment with DAO goals. Provide feedback and scoring for program decisions.', skills: ['Technical Review', 'Critical Thinking', 'Writing', 'Blockchain Knowledge'] },
  { title: 'DAO Council Member', type: 'DAO', salaryRange: ['$4k/mo', '$9k/mo'], minScore: 60, badges: ['Advanced Badge'], category: 'DAO', description: 'Serve on DAO governance council making strategic decisions. Participate in disputes resolution, budget approvals, and strategic direction.', skills: ['Governance', 'Strategy', 'Decision Making', 'Community Leadership'] },
  { title: 'Governance Analyst', type: 'DAO', salaryRange: ['$3k/mo', '$6k/mo'], minScore: 45, badges: ['Intermediate Badge'], category: 'DAO', description: 'Analyze governance proposals, voting patterns, and delegate behavior. Create reports on governance health and participation metrics.', skills: ['Governance Analysis', 'Data Analysis', 'Research', 'Writing'] },

  // ── COLLABORATION / HACKATHON ──
  { title: 'Hackathon Teammate: Frontend', type: 'Collaboration', salaryRange: ['Prize Pool', 'Share'], minScore: 25, badges: [], category: 'Collaboration', description: 'Join a hackathon team as the frontend developer. Build demo-ready UIs in 24-48 hours using React and Web3 libraries.', skills: ['React', 'Rapid Prototyping', 'UI Development', 'Teamwork'] },
  { title: 'Hackathon Teammate: Smart Contracts', type: 'Collaboration', salaryRange: ['Prize Pool', 'Share'], minScore: 35, badges: ['Beginner Badge'], category: 'Collaboration', description: 'Contribute smart contract development for hackathon projects. Write, test, and deploy contracts under time pressure.', skills: ['Solidity', 'Smart Contracts', 'Testing', 'Collaboration'] },
  { title: 'Hackathon Teammate: Design', type: 'Collaboration', salaryRange: ['Prize Pool', 'Share'], minScore: 20, badges: [], category: 'Collaboration', description: 'Provide design expertise for hackathon teams. Create wireframes, branding, and polished demos in fast-paced environments.', skills: ['UI Design', 'Rapid Prototyping', 'Branding', 'Teamwork'] },
  { title: 'Open Source Contributor', type: 'Collaboration', salaryRange: ['Bounty', '$500-$5k'], minScore: 20, badges: [], category: 'Collaboration', description: 'Contribute to open-source blockchain projects. Fix bugs, implement features, and participate in code reviews for protocol codebases.', skills: ['Open Source', 'Git', 'Code Review', 'Documentation'] },
  { title: 'Research Collaborator', type: 'Collaboration', salaryRange: ['Co-author', 'Credit'], minScore: 50, badges: ['Intermediate Badge'], category: 'Collaboration', description: 'Collaborate on blockchain research papers and reports. Contribute analysis, data collection, and writing for academic or industry publications.', skills: ['Research', 'Academic Writing', 'Data Analysis', 'Blockchain Theory'] },
  { title: 'Protocol Co-Builder', type: 'Collaboration', salaryRange: ['Equity', 'Tokens'], minScore: 60, badges: ['Advanced Badge'], category: 'Collaboration', description: 'Co-found or join early-stage protocol development. Contribute engineering, product, or strategy skills for equity/token compensation.', skills: ['Full-Stack Development', 'Protocol Design', 'Entrepreneurship', 'Strategy'] },
  { title: 'Side Project Partner', type: 'Collaboration', salaryRange: ['Revenue', 'Share'], minScore: 30, badges: [], category: 'Collaboration', description: 'Partner on side projects building Web3 tools and applications. Share workload and revenue from successful products.', skills: ['Full-Stack Development', 'Product Thinking', 'Self-Motivation', 'Collaboration'] },

  // ── GIG / FREELANCE ──
  { title: 'Logo & Brand Designer', type: 'Gig', salaryRange: ['$500', '$2k'], minScore: 15, badges: [], category: 'Gig', description: 'Design logos and brand identities for crypto projects and DAOs. Deliver brand guidelines, color palettes, and asset packages.', skills: ['Logo Design', 'Brand Identity', 'Adobe Creative Suite', 'Typography'] },
  { title: 'NFT Artist', type: 'Gig', salaryRange: ['$1k', '$10k'], minScore: 20, badges: [], category: 'Gig', description: 'Create original digital artwork for NFT collections. Design generative art systems, 1/1 pieces, or PFP collections.', skills: ['Digital Art', 'NFT Creation', 'Generative Art', 'Adobe Creative Suite'] },
  { title: 'Video Content Creator', type: 'Gig', salaryRange: ['$800', '$3k'], minScore: 25, badges: [], category: 'Gig', description: 'Produce educational and promotional video content for crypto projects. Script, shoot, edit, and optimize for social platforms.', skills: ['Video Production', 'Editing', 'Scriptwriting', 'Social Media'] },
  { title: 'Blockchain Educator', type: 'Gig', salaryRange: ['$2k', '$5k'], minScore: 30, badges: ['Beginner Badge'], category: 'Gig', description: 'Create and deliver blockchain education content. Build courses, write tutorials, and conduct workshops for various skill levels.', skills: ['Teaching', 'Content Creation', 'Blockchain Knowledge', 'Writing'] },
  { title: 'Smart Contract Freelance Auditor', type: 'Gig', salaryRange: ['$3k', '$15k'], minScore: 70, badges: ['Advanced Badge'], category: 'Gig', description: 'Perform independent security audits of smart contracts on a per-project basis. Deliver comprehensive audit reports with findings and recommendations.', skills: ['Solidity', 'Security Auditing', 'Report Writing', 'DeFi Knowledge'] },
  { title: 'Whitepaper Writer', type: 'Gig', salaryRange: ['$2k', '$8k'], minScore: 45, badges: ['Intermediate Badge'], category: 'Gig', description: 'Write comprehensive whitepapers for blockchain projects. Research technical details, explain tokenomics, and create compelling narratives.', skills: ['Technical Writing', 'Research', 'Tokenomics', 'Blockchain Knowledge'] },
  { title: 'Pitch Deck Designer', type: 'Gig', salaryRange: ['$500', '$3k'], minScore: 20, badges: [], category: 'Gig', description: 'Design investor-ready pitch decks for crypto startups. Create compelling visual narratives with clear data presentation and storytelling.', skills: ['Presentation Design', 'Data Visualization', 'Storytelling', 'Figma'] },
  { title: 'Newsletter Writer (Crypto)', type: 'Gig', salaryRange: ['$1k/mo', '$4k/mo'], minScore: 25, badges: [], category: 'Gig', description: 'Write weekly crypto newsletters covering market analysis, protocol updates, and industry trends. Build and grow subscriber base.', skills: ['Writing', 'Crypto Analysis', 'Email Marketing', 'Research'] },
  { title: 'Podcast Producer (Web3)', type: 'Gig', salaryRange: ['$1.5k', '$5k'], minScore: 30, badges: [], category: 'Gig', description: 'Produce and edit Web3 podcasts. Manage guest bookings, recording sessions, post-production, and distribution across platforms.', skills: ['Podcast Production', 'Audio Editing', 'Content Strategy', 'Communication'] },
  { title: 'Translation & Localization', type: 'Gig', salaryRange: ['$500', '$3k'], minScore: 15, badges: [], category: 'Gig', description: 'Translate and localize crypto documentation, interfaces, and marketing materials. Ensure cultural relevance and technical accuracy.', skills: ['Translation', 'Localization', 'Technical Writing', 'Crypto Terminology'] },

  // ── QA / TESTING ──
  { title: 'QA Engineer', type: 'Contract', salaryRange: ['$4k/mo', '$8k/mo'], minScore: 35, badges: [], category: 'QA', description: 'Design and execute test plans for Web3 applications. Perform manual and automated testing of smart contracts and frontend interfaces.', skills: ['QA Testing', 'Test Automation', 'Bug Reporting', 'Web3 Testing'] },
  { title: 'Smart Contract Test Engineer', type: 'Full-time', salaryRange: ['$120k', '$180k'], minScore: 55, badges: ['Intermediate Badge'], category: 'QA', description: 'Write comprehensive test suites for smart contracts using Foundry and Hardhat. Implement fuzz testing, invariant testing, and CI integration.', skills: ['Foundry', 'Hardhat', 'Testing', 'Solidity'] },

  // ── CONTENT & TECHNICAL WRITING ──
  { title: 'Technical Writer', type: 'Contract', salaryRange: ['$5k/mo', '$10k/mo'], minScore: 40, badges: ['Beginner Badge'], category: 'Content', description: 'Write clear, concise technical documentation for blockchain protocols and developer tools. Maintain API references and integration guides.', skills: ['Technical Writing', 'API Documentation', 'Markdown', 'Developer Experience'] },
  { title: 'Documentation Lead', type: 'Full-time', salaryRange: ['$100k', '$150k'], minScore: 45, badges: ['Beginner Badge'], category: 'Content', description: 'Lead documentation strategy and team. Define information architecture, manage contribution workflows, and ensure docs accuracy.', skills: ['Documentation', 'Information Architecture', 'Team Management', 'Technical Writing'] },
  { title: 'Research Analyst (Crypto)', type: 'Full-time', salaryRange: ['$100k', '$160k'], minScore: 50, badges: ['Intermediate Badge'], category: 'Content', description: 'Produce in-depth research reports on protocols, market trends, and emerging technologies. Support investment decisions with data-driven analysis.', skills: ['Research', 'Data Analysis', 'Writing', 'Crypto Markets'] },
  { title: 'Copywriter (Web3)', type: 'Contract', salaryRange: ['$3k/mo', '$7k/mo'], minScore: 30, badges: [], category: 'Content', description: 'Write compelling copy for landing pages, product interfaces, and marketing campaigns. Translate complex blockchain concepts into accessible language.', skills: ['Copywriting', 'Marketing', 'Brand Voice', 'Crypto Knowledge'] },

  // ── EXECUTIVE / LEADERSHIP ──
  { title: 'CTO (Early Stage)', type: 'Full-time', salaryRange: ['$200k', '$350k+'], minScore: 90, badges: ['Advanced Badge'], category: 'Executive', description: 'Lead technology strategy and engineering team for an early-stage Web3 company. Define architecture, hire talent, and deliver technical roadmap.', skills: ['Technical Leadership', 'Architecture', 'Team Building', 'Blockchain Systems'] },
  { title: 'VP of Engineering', type: 'Full-time', salaryRange: ['$180k', '$280k'], minScore: 85, badges: ['Advanced Badge'], category: 'Executive', description: 'Manage engineering organization and technical execution. Scale teams, define processes, and ensure delivery of product roadmap.', skills: ['Engineering Management', 'Team Scaling', 'Process Design', 'Technical Strategy'] },
  { title: 'Head of Growth', type: 'Full-time', salaryRange: ['$150k', '$230k'], minScore: 70, badges: ['Advanced Badge'], category: 'Executive', description: 'Drive user acquisition and protocol TVL growth. Lead cross-functional growth teams and develop data-driven acquisition strategies.', skills: ['Growth Strategy', 'Analytics', 'Team Leadership', 'DeFi Knowledge'] },
  { title: 'CFO (Crypto Native)', type: 'Full-time', salaryRange: ['$180k', '$300k'], minScore: 80, badges: ['Advanced Badge'], category: 'Executive', description: 'Manage financial operations spanning fiat and crypto. Oversee treasury, fundraising, financial reporting, and tax compliance across jurisdictions.', skills: ['Finance', 'Treasury', 'Fundraising', 'Crypto Accounting'] },
];

function generateJobs(): Job[] {
  const jobs: Job[] = [];
  const companyCount = COMPANIES.length;
  const templateCount = JOB_TEMPLATES.length;

  for (let i = 0; i < 500; i++) {
    const template = JOB_TEMPLATES[i % templateCount];
    const company = COMPANIES[i % companyCount];
    const salary = template.salaryRange[0] === 'Prize Pool' || template.salaryRange[0] === 'Bounty' || template.salaryRange[0] === 'Co-author' || template.salaryRange[0] === 'Equity' || template.salaryRange[0] === 'Revenue'
      ? `${template.salaryRange[0]} ${template.salaryRange[1]}`
      : `${template.salaryRange[0]} - ${template.salaryRange[1]}`;

    // Vary minScore slightly per listing
    const scoreVariation = ((i * 7) % 11) - 5;
    const adjustedMinScore = Math.max(10, Math.min(95, template.minScore + scoreVariation));

    jobs.push({
      id: String(i + 1),
      title: template.title,
      company,
      type: template.type,
      salary,
      description: template.description,
      requiredSkills: template.skills,
      minScore: adjustedMinScore,
      requiredBadges: template.badges,
    });
  }
  return jobs;
}

export const ALL_JOBS: Job[] = generateJobs();
