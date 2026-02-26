import React from 'react';
import { cn } from '@/lib/utils';

interface ChoiceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const ChoiceButton: React.FC<ChoiceButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-5 py-2.5 rounded-xl",
    lg: "px-6 py-3.5 text-lg rounded-2xl"
  };

  const variants = {
    primary: "bg-primary hover:brightness-110 text-primary-foreground shadow-glow-primary border border-transparent",
    secondary: "bg-background text-secondary border-2 border-secondary hover:bg-secondary hover:text-secondary-foreground shadow-sm",
    outline: "border-2 border-border hover:border-primary hover:text-primary text-muted-foreground bg-transparent",
    ghost: "bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground",
    danger: "bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20"
  };

  return (
    <button
      className={cn(
        "font-bold transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95",
        sizeStyles[size],
        variants[variant],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : children}
    </button>
  );
};
