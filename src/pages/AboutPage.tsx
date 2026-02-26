import React from 'react';
import { Heart, Globe, CheckCircle, Users } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <header className="text-center space-y-4 max-w-2xl mx-auto pt-10">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
          <Heart className="text-primary fill-primary" size={32} />
        </div>
        <h1 className="text-5xl font-extrabold text-foreground tracking-tight">About Choice.love</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          We are building the trust layer for the decentralized internet. Our mission is to empower individuals with self-sovereign identity tools.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-card p-8 rounded-3xl border border-border shadow-xl">
          <CheckCircle className="text-secondary mb-4" size={40} />
          <h3 className="text-xl font-bold text-foreground mb-2">Privacy First</h3>
          <p className="text-muted-foreground">Your data belongs to you. We use Zero-Knowledge proofs to verify facts without revealing sensitive information.</p>
        </div>
        <div className="bg-card p-8 rounded-3xl border border-border shadow-xl">
          <Globe className="text-accent mb-4" size={40} />
          <h3 className="text-xl font-bold text-foreground mb-2">Universal Access</h3>
          <p className="text-muted-foreground">Choice iD works across borders and blockchains, providing a unified reputation score for the global web.</p>
        </div>
        <div className="bg-card p-8 rounded-3xl border border-border shadow-xl">
          <Users className="text-primary mb-4" size={40} />
          <h3 className="text-xl font-bold text-foreground mb-2">Community Driven</h3>
          <p className="text-muted-foreground">We believe in open-source collaboration. Our tools are built to help communities thrive securely.</p>
        </div>
      </div>

      <div className="bg-dark rounded-3xl p-10 text-center">
        <h2 className="text-3xl font-bold mb-4 text-white">Join the Movement</h2>
        <p className="text-slate-300 max-w-xl mx-auto mb-8">
          Be part of the future of digital identity. Secure your wallet, connect your social, and build your trust score today.
        </p>
        <div className="flex justify-center gap-4">
          <a href="https://www.choice.love" target="_blank" rel="noreferrer"
            className="px-6 py-3 bg-white text-foreground font-bold rounded-xl hover:bg-muted transition-colors">
            Visit Choice.love
          </a>
          <a href="https://www.choice.love/choice-id" target="_blank" rel="noreferrer"
            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 transition-all">
            Choice iD Details
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
