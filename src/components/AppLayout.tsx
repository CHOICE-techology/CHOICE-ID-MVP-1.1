import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, FileBadge, BookOpen, Briefcase, PlusCircle, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WalletModal } from './WalletModal';
import { useWallet } from '@/contexts/WalletContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { address, isConnecting, isConnected, disconnect } = useWallet();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isConnecting) setStatus('Connecting...');
    else if (isConnected) {
      setStatus('Connected!');
      const timer = setTimeout(() => setStatus('Transaction Analysis Complete'), 2000);
      const hideTimer = setTimeout(() => setStatus(null), 5000);
      return () => { clearTimeout(timer); clearTimeout(hideTimer); };
    }
  }, [isConnecting, isConnected]);

  const navSections = [
    {
      title: 'PERSONAL',
      items: [
        { name: 'My Identity', href: '/', icon: User },
        { name: 'Credentials', href: '/credentials', icon: FileBadge },
      ]
    },
    {
      title: 'GROWTH',
      items: [
        { name: 'Education', href: '/education', icon: BookOpen },
        { name: 'Jobs & Gigs', href: '/jobs', icon: Briefcase },
      ]
    },
    {
      title: 'FINANCE',
      items: [
        { name: 'Create Wallet', href: '/wallet/create', icon: PlusCircle },
      ]
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-40 px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tighter flex items-center">
            CHOICE<span className="text-primary ml-0.5">iD</span>
          </span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-dark/40 backdrop-blur-sm z-50 animate-fade-in" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-background border-r border-border flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 overflow-y-auto",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col min-h-full p-8">
          <div className="lg:hidden flex justify-end mb-4">
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <X size={24} />
            </button>
          </div>

          <Link to="/" className="flex items-center gap-2 mb-12" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="text-xl font-black tracking-tighter flex items-center">
              CHOICE<span className="text-primary ml-0.5">iD</span>
            </span>
          </Link>

          <nav className="flex-1 space-y-10">
            {navSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-5">
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all",
                        isActive(item.href)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon size={20} className={isActive(item.href) ? "text-primary" : "text-muted-foreground"} />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-border">
            {address ? (
              <div className="bg-muted rounded-3xl p-5 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CONNECTED</span>
                </div>
                <div className="text-[11px] font-mono text-muted-foreground truncate mb-5">{address}</div>
                <button
                  onClick={() => { disconnect(); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-2 text-xs font-black text-accent hover:opacity-70 transition-opacity uppercase tracking-wider"
                >
                  <LogOut size={14} strokeWidth={3} /> Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl shadow-glow-primary hover:opacity-90 transition-all transform active:scale-95 uppercase text-xs tracking-widest flex items-center justify-center gap-2"
              >
                <PlusCircle size={18} /> Connect CHOICE iD
              </button>
            )}
          </div>
        </div>
      </aside>

      <WalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />

      <main className="flex-1 lg:ml-64 min-h-screen pt-16 lg:pt-0 flex flex-col">
        {status && (
          <div className="fixed top-20 lg:top-4 right-4 lg:right-8 z-[60] animate-slide-in-right">
            <div className="bg-dark text-background px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-border/10 backdrop-blur-xl">
              <div className={cn(
                "w-2 h-2 rounded-full",
                status === 'Connecting...' ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
              )} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{status}</span>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-16 flex-1">
          {children}
        </div>

        <footer className="max-w-6xl mx-auto px-6 md:px-12 py-8 border-t border-border w-full">
          <div className="flex flex-col md:flex-row justify-between items-center gap-y-6 md:gap-6">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-3">
              <a href="https://www.choice.love" target="_blank" rel="noreferrer" className="text-[10px] md:text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
                www.choice.love
              </a>
              <Link to="/about" className="text-[10px] md:text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
                About Us
              </Link>
              <a href="https://www.choice.love/choice-id" target="_blank" rel="noreferrer" className="text-[10px] md:text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
                About Choice iD
              </a>
            </div>
            <div className="text-[10px] md:text-xs font-bold text-muted-foreground/50 uppercase tracking-[0.2em] text-center md:text-right">
              © 2026 Choice.love
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};
