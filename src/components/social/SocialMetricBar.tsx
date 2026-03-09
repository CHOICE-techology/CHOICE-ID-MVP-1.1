import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SocialMetricBarProps {
  label: string;
  value: number; // 0-100
  color: string; // tailwind bg class
  icon?: React.ReactNode;
  delay?: number;
}

export const SocialMetricBar: React.FC<SocialMetricBarProps> = ({ label, value, color, icon, delay = 0 }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay + 100);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon && <span className="opacity-70">{icon}</span>}
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-xs font-black text-foreground">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-border/60 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', color)}
          style={{ width: `${width}%`, transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
};
