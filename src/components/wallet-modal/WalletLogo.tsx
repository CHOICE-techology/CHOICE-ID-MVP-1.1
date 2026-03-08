import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface WalletLogoProps {
  src: string;
  name: string;
  size?: number;
  className?: string;
}

/** Wallet logo with graceful initial-letter fallback */
export const WalletLogo: React.FC<WalletLogoProps> = ({ src, name, size = 32, className }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-muted text-foreground font-black text-xs shrink-0",
          className
        )}
        style={{ width: size, height: size }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={cn("object-contain rounded-lg shrink-0", className)}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
};
