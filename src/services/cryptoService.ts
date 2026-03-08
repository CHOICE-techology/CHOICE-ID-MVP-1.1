import { VerifiableCredential, Job, UserIdentity, GeneratedCV } from '../types';
import { calculateReputation } from './reputationEngine';

export const sha256 = async (message: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hashHex;
};

export const generateDID = (address: string): string => {
  return `did:ethr:${address.toLowerCase()}`;
};

export const calculateReputationScore = (credentials: VerifiableCredential[]): number => {
  return calculateReputation(credentials).score;
};

export const generateReputationHash = async (address: string, score: number): Promise<string> => {
  const payload = `${score}:${address.toLowerCase()}`;
  return await sha256(payload);
};

export const mockUploadToIPFS = async (data: unknown): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const hash = await sha256(JSON.stringify(data));
  return `Qm${hash.substring(2, 48)}`;
};

export const mockVerifyPhysicalDocument = async (_file?: File) => {
  await new Promise(resolve => setTimeout(resolve, 3000));
  return { verified: true, issuer: 'CHOICE AI Verifier', confidence: 0.98 };
};

export const mockAnalyzeWalletHistory = async (address: string) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const seed = address.charCodeAt(address.length - 1) + address.charCodeAt(2);
  const yearsOld = (seed % 6) + 1;
  const txCount = (seed * 25) + 100;
  const date = new Date();
  date.setFullYear(date.getFullYear() - yearsOld);

  const expertises = [];
  if (txCount > 500) expertises.push('DeFi Power User');
  if (yearsOld > 3) expertises.push('OG Holder');
  if (address.includes('b')) expertises.push('NFT Collector');

  const assetsValue = (seed * 150) + Math.random() * 5000;
  const assetCount = Math.floor((seed % 20) + 5);

  return {
    firstTxDate: date.toISOString(),
    txCount,
    totalVolumeEth: parseFloat((seed * 0.8).toFixed(2)),
    gasSpentEth: parseFloat((seed * 0.05).toFixed(3)),
    protocols: ['Uniswap', 'Aave', 'OpenSea', 'Curve', 'GMX'],
    expertises: expertises.length > 0 ? expertises : ['DeFi Novice'],
    assetsValueUsd: parseFloat(assetsValue.toFixed(2)),
    assetCount
  };
};

export const mockConnectSocial = async (platform: string, handle: string) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const baseFollowers = Math.floor(Math.random() * 8000) + 500;
  const posts = Math.floor(Math.random() * 1200) + 50;
  const comments = Math.floor(posts * (Math.random() * 5 + 1));
  const engagement = ((comments + posts * 2) / baseFollowers * 100).toFixed(2) + '%';

  const sectors = ['Web3 Development', 'Digital Art & NFT', 'DeFi Finance', 'Blockchain Marketing', 'AI Research', 'Community Management'];
  const sector = sectors[Math.floor(Math.random() * sectors.length)];

  const missions = [
    "Building the decentralized future of finance",
    "Scaling Ethereum for the next billion users",
    "Advocating for digital privacy and sovereignty",
  ];

  return {
    platform, handle, verified: true,
    followers: baseFollowers, posts, comments, sector,
    mission: missions[Math.floor(Math.random() * missions.length)],
    engagementRate: engagement,
    botProbability: (Math.random() * 5).toFixed(1) + '%',
    behaviorScore: "Organic / High Authority"
  };
};

// calculateJobMatch has been moved to jobMatchingService.ts

export const mockGenerateCV = async (identity: UserIdentity): Promise<GeneratedCV> => {
  await new Promise(resolve => setTimeout(resolve, 2000));

  const walletVC = identity.credentials.find(vc => vc.type.includes('WalletHistoryCredential'));
  const socialVCs = identity.credentials.filter(vc => vc.type.includes('SocialCredential'));
  const eduVCs = identity.credentials.filter(vc => vc.type.includes('EducationCredential'));
  const realWorldVCs = identity.credentials.filter(vc => vc.type.includes('PhysicalCredential'));

  const skills = [
    ...(walletVC?.credentialSubject.expertises as string[] || []),
    ...eduVCs.map(vc => vc.credentialSubject.courseName as string),
    "Self-Sovereign Identity",
    "Community Building"
  ];

  const experience = [];
  if (walletVC) {
    experience.push({
      role: "Active DeFi Participant",
      company: "Ethereum Network",
      duration: `${new Date(walletVC.credentialSubject.firstTxDate as string).getFullYear()} - Present`
    });
  }
  socialVCs.forEach(vc => {
    experience.push({
      role: `Content Creator / Influencer`,
      company: vc.credentialSubject.platform as string,
      duration: "Verified Account"
    });
  });

  const education = [
    ...realWorldVCs.map(vc => ({
      degree: vc.credentialSubject.documentType as string,
      institution: (vc.credentialSubject.issuer as string) || "External Authority",
      year: "Verified"
    })),
    ...eduVCs.map(vc => ({
      degree: (vc.credentialSubject.level as string) + " Certificate",
      institution: "CHOICE Academy",
      year: "2026"
    }))
  ];

  return {
    summary: identity.bio || "A verified Web3 professional with on-chain history and real-world credentials.",
    skills: skills.slice(0, 8),
    experience,
    education
  };
};

export const mockGenerateBio = async (identity: UserIdentity): Promise<string> => {
  const docs = identity.credentials.filter(vc => vc.type.includes('PhysicalCredential')).map(vc => vc.credentialSubject.documentType as string);
  const socials = identity.credentials.filter(vc => vc.type.includes('SocialCredential')).map(vc => vc.credentialSubject.platform as string);

  let intro = "I am a Web3 enthusiast";
  if (docs.includes('Diploma')) intro = "I am a university graduate and Web3 professional";
  if (docs.includes('Certification')) intro = "I am a certified expert";

  return `${intro} active on ${socials.join(', ') || 'multiple platforms'}. My verified CHOICE ID score reflects my commitment to building a trusted reputation in the digital economy.`;
};
