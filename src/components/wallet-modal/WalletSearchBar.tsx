import React from 'react';
import { Search, X } from 'lucide-react';

interface WalletSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const WalletSearchBar: React.FC<WalletSearchBarProps> = ({ value, onChange }) => (
  <div className="relative mb-4">
    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search wallets..."
      className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 transition-colors"
    />
    {value && (
      <button
        onClick={() => onChange('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X size={14} />
      </button>
    )}
  </div>
);
