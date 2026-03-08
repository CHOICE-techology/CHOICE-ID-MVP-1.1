import { Job, JobMatchResult, VerifiableCredential, UserIdentity } from '../types';
import { calculateReputation } from './reputationEngine';

// Skills the user implicitly has based on credentials
function deriveUserSkills(credentials: VerifiableCredential[]): string[] {
  const skills = new Set<string>();
  
  credentials.forEach(vc => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];
    const subj = vc.credentialSubject as any;

    if (types.includes('WalletHistoryCredential')) {
      skills.add('Blockchain Knowledge');
      skills.add('DeFi Protocols');
      skills.add('Web3');
      skills.add('Crypto Knowledge');
      skills.add('Crypto Native');
      const txCount = Number(subj?.txCount) || 0;
      if (txCount > 300) { skills.add('DeFi'); skills.add('On-Chain Data'); }
      const expertises = subj?.expertises as string[] || [];
      expertises.forEach((e: string) => {
        if (e.includes('DeFi')) { skills.add('DeFi Protocols'); skills.add('DeFi'); skills.add('Financial Modeling'); }
        if (e.includes('NFT')) { skills.add('NFT Creation'); skills.add('Digital Art'); }
        if (e.includes('OG')) { skills.add('Crypto Markets'); skills.add('Protocol Knowledge'); }
      });
    }

    if (types.includes('WalletCreatedCredential')) {
      skills.add('Crypto Knowledge');
      skills.add('Web3');
    }

    if (types.includes('SocialCredential')) {
      skills.add('Social Media');
      skills.add('Community Building');
      skills.add('Communication');
      skills.add('Content Creation');
      skills.add('Community Engagement');
      const platform = (subj?.platform as string || '').toLowerCase();
      if (platform === 'x' || platform === 'twitter') { skills.add('Content Strategy'); skills.add('Brand Building'); }
      if (platform === 'linkedin') { skills.add('Relationship Management'); skills.add('Networking'); skills.add('Professional Networking'); }
      if (platform === 'github') { skills.add('Open Source'); skills.add('Git'); skills.add('Code Review'); skills.add('Developer Advocacy'); }
      if (platform === 'discord' || platform === 'telegram') { skills.add('Moderation'); skills.add('Community Building'); skills.add('Discord'); skills.add('Telegram'); }
      if (platform === 'farcaster') { skills.add('Crypto Native'); skills.add('Web3'); }
      if (platform === 'youtube') { skills.add('Video Production'); skills.add('Content Strategy'); }
      if (platform === 'instagram') { skills.add('Brand Design'); skills.add('Visual Content'); }
    }

    if (types.includes('EducationCredential')) {
      const courseName = (subj?.courseName as string || '').toLowerCase();
      skills.add('Blockchain Knowledge');
      if (courseName.includes('defi')) { skills.add('DeFi Protocols'); skills.add('DeFi'); skills.add('Financial Modeling'); }
      if (courseName.includes('solidity') || courseName.includes('smart contract')) { skills.add('Solidity'); skills.add('Smart Contracts'); skills.add('EVM'); }
      if (courseName.includes('security')) { skills.add('Security Auditing'); skills.add('Web3 Security'); }
      if (courseName.includes('tokenomics') || courseName.includes('game theory')) { skills.add('Tokenomics'); skills.add('Game Theory'); skills.add('Economic Modeling'); }
      if (courseName.includes('dao') || courseName.includes('governance')) { skills.add('Governance'); skills.add('DAO Operations'); }
      if (courseName.includes('identity') || courseName.includes('did')) { skills.add('Self-Sovereign Identity'); }
      if (courseName.includes('nft') || courseName.includes('creator')) { skills.add('NFT Creation'); }
      if (courseName.includes('web3')) { skills.add('Web3'); skills.add('Crypto Knowledge'); }
      const badge = subj?.badge as string || '';
      if (badge.includes('Advanced')) { skills.add('Protocol Design'); skills.add('Architecture'); }
    }

    if (types.includes('PhysicalCredential')) {
      const docType = (subj?.documentType as string || '').toLowerCase();
      if (docType.includes('diploma') || docType.includes('degree')) { skills.add('Research'); skills.add('Academic Writing'); skills.add('Data Analysis'); }
      if (docType.includes('certification') || docType.includes('certificate')) { skills.add('Professional Development'); }
      if (docType.includes('id') || docType.includes('passport')) { skills.add('Identity Verification'); }
    }
  });

  return Array.from(skills);
}

function fuzzySkillMatch(userSkill: string, requiredSkill: string): boolean {
  const u = userSkill.toLowerCase();
  const r = requiredSkill.toLowerCase();
  if (u === r) return true;
  if (u.includes(r) || r.includes(u)) return true;

  // Common synonyms / related terms
  const synonyms: Record<string, string[]> = {
    'community building': ['community strategy', 'community engagement', 'community management', 'community leadership'],
    'social media': ['content creation', 'content strategy', 'brand building'],
    'communication': ['writing', 'public speaking', 'presentation skills'],
    'blockchain knowledge': ['crypto knowledge', 'web3', 'blockchain theory', 'protocol knowledge'],
    'defi protocols': ['defi', 'financial modeling', 'liquidity management'],
    'solidity': ['smart contracts', 'evm'],
    'security auditing': ['vulnerability assessment', 'web3 security', 'penetration testing'],
    'data analysis': ['analytics', 'data visualization', 'sql'],
    'project management': ['agile', 'jira', 'process optimization'],
    'team leadership': ['team management', 'engineering management', 'leadership'],
    'content creation': ['content strategy', 'writing', 'copywriting'],
    'relationship management': ['client relations', 'partnership management', 'account management'],
    'git': ['open source', 'code review'],
    'figma': ['ui design', 'prototyping', 'wireframing'],
    'product management': ['product strategy', 'roadmapping', 'product leadership'],
    'governance': ['governance analysis', 'dao operations', 'decision making'],
    'research': ['academic writing', 'research', 'critical thinking'],
    'marketing strategy': ['digital marketing', 'growth hacking', 'campaign management'],
  };

  for (const [key, values] of Object.entries(synonyms)) {
    const allRelated = [key, ...values];
    if (allRelated.includes(u) && allRelated.includes(r)) return true;
  }

  return false;
}

export function calculateJobMatch(job: Job, identity: UserIdentity): JobMatchResult {
  const reputation = calculateReputation(identity.credentials);
  const score = reputation.score;
  const userSkills = deriveUserSkills(identity.credentials);

  let totalPoints = 0;
  const reasons: string[] = [];
  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];
  const recommendations: string[] = [];

  // ── 1. Trust Score Component (0-30 pts) ──
  if (score >= job.minScore) {
    const surplus = score - job.minScore;
    const pts = 22 + Math.min(surplus * 0.4, 8);
    totalPoints += pts;
    reasons.push(`Trust Score (${score}) exceeds minimum (${job.minScore})`);
  } else {
    const deficit = job.minScore - score;
    const ratio = score / job.minScore;
    totalPoints += Math.floor(ratio * 22);
    if (deficit <= 10) {
      recommendations.push(`Increase Trust Score by ${deficit} points to meet the minimum requirement`);
    } else if (deficit <= 25) {
      recommendations.push(`Your Trust Score is ${deficit} points below the minimum — add more credentials to improve`);
    } else {
      recommendations.push(`Significantly boost your Trust Score (need ${deficit} more points) by connecting wallets, socials, and completing courses`);
    }
  }

  // ── 2. Skills Component (0-35 pts) ──
  const requiredSkills = job.requiredSkills || [];
  if (requiredSkills.length > 0) {
    let matched = 0;
    requiredSkills.forEach(reqSkill => {
      const found = userSkills.some(us => fuzzySkillMatch(us, reqSkill));
      if (found) {
        matched++;
        matchingSkills.push(reqSkill);
      } else {
        missingSkills.push(reqSkill);
      }
    });
    const skillRatio = matched / requiredSkills.length;
    const skillPts = Math.round(skillRatio * 35);
    totalPoints += skillPts;

    if (matched > 0 && matched < requiredSkills.length) {
      reasons.push(`${matched}/${requiredSkills.length} required skills matched`);
    } else if (matched === requiredSkills.length) {
      reasons.push('All required skills matched');
    }

    if (missingSkills.length > 0 && missingSkills.length <= 2) {
      recommendations.push(`Develop skills in ${missingSkills.join(' and ')} to become a stronger candidate`);
    } else if (missingSkills.length > 2) {
      recommendations.push(`Key skill gaps: ${missingSkills.slice(0, 2).join(', ')} and ${missingSkills.length - 2} more`);
    }
  } else {
    totalPoints += 20; // No specific skills required
  }

  // ── 3. Education Badge Component (0-15 pts) ──
  const userBadges = identity.credentials
    .filter(vc => {
      const t = Array.isArray(vc.type) ? vc.type : [vc.type];
      return t.includes('EducationCredential');
    })
    .map(vc => (vc.credentialSubject as any)?.badge as string)
    .filter(Boolean);

  if (job.requiredBadges.length === 0) {
    totalPoints += 8;
  } else {
    const found = job.requiredBadges.filter(b => userBadges.includes(b)).length;
    totalPoints += Math.round((found / job.requiredBadges.length) * 15);
    if (found > 0) reasons.push('Has required Education Badges');
    if (found === 0) {
      const needed = job.requiredBadges[0];
      recommendations.push(`Complete courses to earn the "${needed}" in CHOICE Academy`);
    }
  }

  // ── 4. Wallet History (0-10 pts) ──
  const walletVC = identity.credentials.find(vc => {
    const t = Array.isArray(vc.type) ? vc.type : [vc.type];
    return t.includes('WalletHistoryCredential');
  });
  if (walletVC) {
    const years = new Date().getFullYear() - new Date((walletVC.credentialSubject as any)?.firstTxDate as string).getFullYear();
    if (years > 3) { totalPoints += 10; reasons.push(`${years} years verified on-chain activity`); }
    else if (years > 1) { totalPoints += 6; reasons.push(`${years} years on-chain history`); }
    else { totalPoints += 3; reasons.push('Recent on-chain activity'); }
  } else {
    recommendations.push('Connect and verify your wallet history for a better match');
  }

  // ── 5. Social Reputation (0-10 pts) ──
  const socialCount = identity.credentials.filter(vc => {
    const t = Array.isArray(vc.type) ? vc.type : [vc.type];
    return t.includes('SocialCredential');
  }).length;
  if (socialCount >= 4) { totalPoints += 10; reasons.push('Strong social presence verified'); }
  else if (socialCount >= 2) { totalPoints += 6; reasons.push(`${socialCount} social accounts verified`); }
  else if (socialCount === 1) { totalPoints += 3; }
  else {
    recommendations.push('Verify social accounts to improve your match score');
  }

  // Clamp and finalize
  const finalScore = Math.min(Math.max(Math.round(totalPoints), 0), 100);

  return {
    score: finalScore,
    reason: reasons.join('. ') || 'Partial match based on profile.',
    matchingSkills,
    missingSkills,
    recommendations: recommendations.slice(0, 3),
  };
}
