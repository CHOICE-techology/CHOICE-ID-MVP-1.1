export type CredentialType =
  | 'government_id'
  | 'professional'
  | 'education'
  | 'social'
  | 'self_attested'
  | 'PhysicalCredential'
  | 'SocialCredential'
  | 'EducationCredential'
  | 'WalletHistoryCredential';

export interface VerifiableCredential {
  id: string;
  type: string | string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    title?: string;
    [key: string]: unknown;
  };
  proof?: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
  };
  ipfsCid?: string;
}

export interface UserIdentity {
  address: string;
  did: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  credentials: VerifiableCredential[];
  reputationScore: number;
  lastAnchorHash?: string;
  lastAnchorTimestamp?: number;
}

export interface ReputationProof {
  address: string;
  score: number;
  timestamp: number;
  hash: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  type: 'Full-time' | 'Contract' | 'DAO' | 'Collaboration' | 'Gig';
  salary: string;
  minScore: number;
  requiredBadges: string[];
  matchScore?: number;
  matchReason?: string;
}

export interface GeneratedCV {
  summary: string;
  skills: string[];
  experience: { role: string; company: string; duration: string }[];
  education: { degree: string; institution: string; year: string }[];
}
