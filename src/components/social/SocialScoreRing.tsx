import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SocialScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
  animate?: boolean;
}

const getRingColor = (score: number) => {
  if (score >= 80) return 'hsl(187 100% 50%)';   // primary cyan — elite
  if (score >= 60) return 'hsl(142 76% 50%)';     // emerald — high
  if (score >= 40) return 'hsl(47 96% 53%)';      // amber — medium
  return 'hsl(0 84% 60%)';                        // red — low
};

const getTier = (score: number) => {
  if (score >= 80) return { label: 'Elite', color: 'text-primary' };
  if (score >= 60) return { label: 'Strong', color: 'text-emerald-500' };
  if (score >= 40) return { label: 'Building', color: 'text-amber-500' };
  return { label: 'Starter', color: 'text-destructive' };
};

export const SocialScoreRing: React.FC<SocialScoreRingProps> = ({
  score,
  size = 140,
  strokeWidth = 10,
  label,
  className,
  animate = true,
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [offset, setOffset] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 100) * circumference;
  const color = getRingColor(score);
  const tier = getTier(score);

  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      setOffset(targetOffset);
      return;
    }
    let frame = 0;
    const total = 60;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / 900, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score * eased));
      setOffset(circumference - (score / 100) * circumference * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [score]);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
        />
        {/* Glow filter */}
        <defs>
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Score arc */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: animate ? 'stroke-dashoffset 0.05s linear' : 'none', filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-foreground tracking-tighter leading-none">{displayScore}</span>
        <span className={cn('text-[10px] font-black uppercase tracking-widest mt-0.5', tier.color)}>{tier.label}</span>
        {label && <span className="text-[9px] text-muted-foreground font-bold mt-0.5 uppercase tracking-wider">{label}</span>}
      </div>
    </div>
  );
};
