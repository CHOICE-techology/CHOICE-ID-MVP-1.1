import React, { useState, useEffect } from 'react';
import { Shield, Wallet, UserCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    icon: Shield,
    label: 'Click "Connect CHOICE ID"',
    desc: 'Find the button at the bottom of the sidebar.',
  },
  {
    icon: Wallet,
    label: 'Choose your method',
    desc: 'Wallet, social account, or email — your choice.',
  },
  {
    icon: UserCheck,
    label: 'You\'re verified!',
    desc: 'Your identity is created on-chain instantly.',
  },
];

export const ConnectGuideAnimation: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-500',
              i === activeStep ? 'w-8 bg-primary' : 'w-3 bg-muted-foreground/20'
            )}
          />
        ))}
      </div>

      {/* Animated cards */}
      <div className="relative h-44">
        {steps.map((step, i) => (
          <div
            key={i}
            className={cn(
              'absolute inset-0 flex flex-col items-center text-center transition-all duration-500 ease-out',
              i === activeStep
                ? 'opacity-100 translate-y-0 scale-100'
                : i < activeStep
                  ? 'opacity-0 -translate-y-6 scale-95 pointer-events-none'
                  : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
            )}
          >
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-500',
              i === activeStep ? 'bg-primary/10 border border-primary/20' : 'bg-muted'
            )}>
              <step.icon
                size={28}
                className={cn(
                  'transition-colors duration-500',
                  i === activeStep ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">{step.label}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Step numbers */}
      <div className="flex items-center justify-center gap-3 mt-4">
        {steps.map((_, i) => (
          <React.Fragment key={i}>
            <button
              onClick={() => setActiveStep(i)}
              className={cn(
                'w-8 h-8 rounded-full text-xs font-black flex items-center justify-center transition-all duration-300',
                i === activeStep
                  ? 'bg-primary text-primary-foreground scale-110 shadow-lg'
                  : i < activeStep
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {i + 1}
            </button>
            {i < steps.length - 1 && (
              <ArrowRight size={14} className={cn(
                'transition-colors duration-300',
                i < activeStep ? 'text-primary' : 'text-muted-foreground/30'
              )} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
