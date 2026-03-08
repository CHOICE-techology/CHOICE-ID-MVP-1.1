import React, { useState, useMemo } from 'react';
import { Target, Lock, CheckCircle, Zap, Gift, Bug, Users, Wallet, BookOpen, Shield, Globe, ArrowRight } from 'lucide-react';
import { ChoiceButton } from '@/components/ChoiceButton';
import { useWallet } from '@/contexts/WalletContext';
import { calculateReputation } from '@/services/reputationEngine';
import { grantReward } from '@/services/rewardService';
import { triggerRewardAnimation } from '@/components/RewardAnimation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BountyTask {
  id: string;
  title: string;
  description: string;
  reward: number;
  icon: React.ElementType;
  category: 'identity' | 'education' | 'community' | 'security';
  minScore: number;
  minBalance: number;
  type: string;
  reason: string;
}

const BOUNTY_TASKS: BountyTask[] = [
  {
    id: 'verify-professional',
    title: 'Verify Professional Identity',
    description: 'Connect LinkedIn or GitHub to verify your professional credentials and boost your trust score.',
    reward: 100,
    icon: Shield,
    category: 'identity',
    minScore: 0,
    minBalance: 0,
    type: 'bounty_reward',
    reason: 'bounty_verify_professional',
  },
  {
    id: 'complete-education',
    title: 'Complete 3 Education Modules',
    description: 'Finish at least 3 courses in the Education Center to demonstrate your Web3 knowledge.',
    reward: 50,
    icon: BookOpen,
    category: 'education',
    minScore: 10,
    minBalance: 0,
    type: 'bounty_reward',
    reason: 'bounty_education_3',
  },
  {
    id: 'multi-chain-wallet',
    title: 'Multi-Chain Wallet Verification',
    description: 'Connect wallets on 2+ chains to prove cross-chain activity and earn verification rewards.',
    reward: 30,
    icon: Wallet,
    category: 'identity',
    minScore: 0,
    minBalance: 0,
    type: 'bounty_reward',
    reason: 'bounty_multichain',
  },
  {
    id: 'invite-3-friends',
    title: 'Invite 3 Friends',
    description: 'Refer 3 friends who create CHOICE IDs. Community grows stronger together.',
    reward: 75,
    icon: Users,
    category: 'community',
    minScore: 30,
    minBalance: 25,
    type: 'bounty_reward',
    reason: 'bounty_invite_3',
  },
  {
    id: 'bug-report',
    title: 'Submit a Bug Report',
    description: 'Found something broken? Report it to help improve the platform. Verified reports earn rewards.',
    reward: 100,
    icon: Bug,
    category: 'security',
    minScore: 20,
    minBalance: 0,
    type: 'bounty_reward',
    reason: 'bounty_bug_report',
  },
  {
    id: 'beta-tester',
    title: 'Beta Feature Testing',
    description: 'Test upcoming features and provide structured feedback to the development team.',
    reward: 150,
    icon: Zap,
    category: 'security',
    minScore: 40,
    minBalance: 50,
    type: 'bounty_reward',
    reason: 'bounty_beta_test',
  },
  {
    id: 'global-identity',
    title: 'Achieve Global Identity',
    description: 'Reach 80+ Trust Score with credentials across all categories. The ultimate CHOICE achievement.',
    reward: 200,
    icon: Globe,
    category: 'identity',
    minScore: 60,
    minBalance: 100,
    type: 'bounty_reward',
    reason: 'bounty_global_identity',
  },
  {
    id: 'community-contribution',
    title: 'Community Contribution',
    description: 'Write a tutorial, create content, or help onboard new members to the CHOICE ecosystem.',
    reward: 150,
    icon: Gift,
    category: 'community',
    minScore: 30,
    minBalance: 50,
    type: 'bounty_reward',
    reason: 'bounty_community_contrib',
  },
];

const CATEGORY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  identity: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  education: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  community: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  security: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

const BountyBoardPage: React.FC = () => {
  const { userIdentity: identity } = useWallet();
  const { toast } = useToast();
  const [claimedIds, setClaimedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('choice_claimed_bounties');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const score = identity ? calculateReputation(identity.credentials)?.score ?? 0 : 0;
  const choiceBalance = 0; // We show tasks regardless; locking is visual

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return BOUNTY_TASKS;
    return BOUNTY_TASKS.filter(t => t.category === filter);
  }, [filter]);

  const getTaskStatus = (task: BountyTask): 'claimable' | 'locked' | 'completed' => {
    if (claimedIds.has(task.id)) return 'completed';
    if (score < task.minScore) return 'locked';
    return 'claimable';
  };

  const handleClaim = async (task: BountyTask) => {
    if (!identity) return;
    setClaimingId(task.id);
    try {
      const result = await grantReward(identity.address, task.type, task.reason, task.reward);
      if (result.success) {
        triggerRewardAnimation(task.reward, task.title);
        const newClaimed = new Set(claimedIds);
        newClaimed.add(task.id);
        setClaimedIds(newClaimed);
        localStorage.setItem('choice_claimed_bounties', JSON.stringify([...newClaimed]));
        toast({ title: 'Bounty Claimed!', description: `+${task.reward} CHOICE earned` });
      } else if (result.duplicate) {
        const newClaimed = new Set(claimedIds);
        newClaimed.add(task.id);
        setClaimedIds(newClaimed);
        localStorage.setItem('choice_claimed_bounties', JSON.stringify([...newClaimed]));
        toast({ title: 'Already Claimed', description: 'You already earned this reward.' });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to claim', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
    }
    setClaimingId(null);
  };

  const totalRewards = BOUNTY_TASKS.reduce((s, t) => s + t.reward, 0);
  const earnedRewards = BOUNTY_TASKS.filter(t => claimedIds.has(t.id)).reduce((s, t) => s + t.reward, 0);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2 tracking-tight">Bounty Board</h1>
          <p className="text-muted-foreground text-base md:text-lg">Complete tasks, grow your identity, earn <span className="text-primary font-bold">◈ CHOICE</span> rewards.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-card border border-border rounded-2xl px-4 py-3 text-center min-w-[80px]">
            <span className="block text-2xl font-extrabold text-primary">◈ {earnedRewards}</span>
            <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">/ {totalRewards} earned</span>
          </div>
          <div className="bg-card border border-border rounded-2xl px-4 py-3 text-center min-w-[80px]">
            <span className="block text-2xl font-extrabold text-foreground">{claimedIds.size}</span>
            <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">/ {BOUNTY_TASKS.length} done</span>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'identity', 'education', 'community', 'security'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all',
              filter === cat
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                : 'bg-card border border-border text-muted-foreground hover:bg-muted'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {!identity && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-800">
          <Zap size={20} />
          <span className="text-sm font-medium">Connect your CHOICE ID to claim bounties.</span>
        </div>
      )}

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map(task => {
          const status = getTaskStatus(task);
          const style = CATEGORY_STYLES[task.category];
          const Icon = task.icon;
          const isLocked = status === 'locked';
          const isCompleted = status === 'completed';

          return (
            <div
              key={task.id}
              className={cn(
                'relative rounded-2xl border p-5 md:p-6 transition-all overflow-hidden group',
                isCompleted
                  ? 'bg-card border-emerald-200 opacity-80'
                  : isLocked
                  ? 'bg-card/50 border-border opacity-60'
                  : 'bg-card border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'
              )}
            >
              {/* Glassmorphism overlay for locked */}
              {isLocked && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                  <div className="text-center">
                    <Lock size={24} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs font-bold text-muted-foreground">Unlock at score {task.minScore}+</p>
                    {task.minBalance > 0 && (
                      <p className="text-[10px] text-muted-foreground">and ◈ {task.minBalance} CHOICE</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={cn('p-3 rounded-xl border shrink-0', style.bg, style.border)}>
                  <Icon size={20} className={style.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground text-sm">{task.title}</h3>
                    {isCompleted && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-3">{task.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-black text-sm">◈ +{task.reward} CHOICE</span>
                    {status === 'claimable' && identity && (
                      <ChoiceButton
                        size="sm"
                        onClick={() => handleClaim(task)}
                        isLoading={claimingId === task.id}
                        className="text-xs"
                      >
                        Claim <ArrowRight size={12} className="ml-1" />
                      </ChoiceButton>
                    )}
                    {isCompleted && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">Completed</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Subtle glow on hover for claimable */}
              {status === 'claimable' && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary rounded-full blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BountyBoardPage;
