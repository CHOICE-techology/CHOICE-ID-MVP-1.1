import React, { useState } from 'react';
import { Job, JobMatchResult, UserIdentity } from '@/types';
import { ChoiceButton } from '@/components/ChoiceButton';
import { calculateIdentityScore, calculateReputationBreakdown } from '@/services/scoreEngine';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  FileText, Sparkles, Send, CheckCircle, ArrowRight, ArrowLeft, User, Briefcase, GraduationCap, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

type JobWithMatch = Job & { matchResult?: JobMatchResult };

interface JobApplicationDialogProps {
  job: JobWithMatch | null;
  identity: UserIdentity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplicationSent: (jobId: string) => void;
}

type Step = 'description' | 'generate-cv' | 'optimize' | 'cover-letter' | 'preview' | 'sent';

const STEPS: { key: Step; label: string }[] = [
  { key: 'description', label: 'Description' },
  { key: 'generate-cv', label: 'Generate CV' },
  { key: 'optimize', label: 'Optimize' },
  { key: 'cover-letter', label: 'Cover Letter' },
  { key: 'preview', label: 'Preview CV' },
];

export const JobApplicationDialog: React.FC<JobApplicationDialogProps> = ({
  job, identity, open, onOpenChange, onApplicationSent
}) => {
  const [step, setStep] = useState<Step>('description');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const score = calculateIdentityScore(identity.credentials);
  const breakdown = calculateReputationBreakdown(identity.credentials);

  const socialCreds = identity.credentials.filter(vc => {
    const t = Array.isArray(vc.type) ? vc.type : [vc.type];
    return t.includes('SocialCredential');
  });
  const educationCreds = identity.credentials.filter(vc => {
    const t = Array.isArray(vc.type) ? vc.type : [vc.type];
    return t.includes('EducationCredential');
  });

  const currentStepIndex = step === 'sent' ? 5 : STEPS.findIndex(s => s.key === step);

  const handleNext = async () => {
    const idx = STEPS.findIndex(s => s.key === step);
    if (step === 'description') {
      setStep('generate-cv');
      setIsGenerating(true);
      await new Promise(r => setTimeout(r, 1500));
      setIsGenerating(false);
    } else if (step === 'generate-cv') {
      setStep('optimize');
      setIsGenerating(true);
      await new Promise(r => setTimeout(r, 1200));
      setIsGenerating(false);
    } else if (step === 'optimize') {
      setStep('cover-letter');
      setIsGenerating(true);
      await new Promise(r => setTimeout(r, 1000));
      setIsGenerating(false);
    } else if (step === 'cover-letter') {
      setStep('preview');
    }
  };

  const handleBack = () => {
    const idx = STEPS.findIndex(s => s.key === step);
    if (idx > 0) setStep(STEPS[idx - 1].key);
  };

  const handleSend = async () => {
    if (!job) return;
    setIsSending(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsSending(false);
    setStep('sent');
    onApplicationSent(job.id);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => setStep('description'), 300);
  };

  if (!job) return null;

  const mr = job.matchResult;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {step === 'sent' ? 'Application Sent!' : `Apply: ${job.title}`}
          </DialogTitle>
          <DialogDescription>
            {step === 'sent'
              ? `Your verified CHOICE ID profile has been sent to ${job.company}.`
              : `${job.company} — ${job.type}`}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        {step !== 'sent' && (
          <div className="flex items-center gap-1 mb-4">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.key}>
                <div className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all',
                  i === currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : i < currentStepIndex
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {i < currentStepIndex && <CheckCircle size={10} />}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </div>
                {i < STEPS.length - 1 && <div className="w-4 h-px bg-border" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Step: Description */}
        {step === 'description' && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-foreground text-base">{job.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((s, i) => {
                  const matched = mr?.matchingSkills?.includes(s);
                  return (
                    <span key={i} className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium',
                      matched ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                    )}>{s}</span>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-[9px] font-black text-muted-foreground uppercase">Match</p>
                <p className="text-lg font-black text-primary">{job.matchScore}%</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-[9px] font-black text-muted-foreground uppercase">Trust</p>
                <p className="text-lg font-black text-foreground">{score}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-[9px] font-black text-muted-foreground uppercase">Type</p>
                <p className="text-sm font-bold text-foreground">{job.type}</p>
              </div>
            </div>
            <ChoiceButton onClick={handleNext} className="w-full">
              Generate CV from CHOICE ID <ArrowRight size={14} className="ml-2" />
            </ChoiceButton>
          </div>
        )}

        {/* Step: Generate CV */}
        {step === 'generate-cv' && (
          <div className="space-y-4">
            {isGenerating ? (
              <div className="text-center py-8">
                <div className="animate-spin bg-primary/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 border-t-4 border-primary" />
                <p className="text-muted-foreground font-medium animate-pulse">Generating CV from your credentials...</p>
              </div>
            ) : (
              <>
                <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-primary" />
                    <h3 className="font-bold text-foreground">Generated CV</h3>
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Professional Summary</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      Verified Web3 professional with a Trust Score of {score}/100. Active across {socialCreds.length} social platforms
                      with {educationCreds.length} completed education modules. Experienced in blockchain technology and decentralized systems.
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Verified Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {mr?.matchingSkills?.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 rounded text-[11px] font-medium">{s}</span>
                      ))}
                      {(mr?.matchingSkills?.length || 0) === 0 && (
                        <span className="text-xs text-muted-foreground">Connect more credentials to show skills</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted rounded-lg p-2.5">
                      <p className="text-[8px] font-black text-muted-foreground uppercase">Education</p>
                      <p className="text-sm font-bold text-foreground">{educationCreds.length} modules</p>
                    </div>
                    <div className="bg-muted rounded-lg p-2.5">
                      <p className="text-[8px] font-black text-muted-foreground uppercase">Social Proof</p>
                      <p className="text-sm font-bold text-foreground">{socialCreds.length} verified</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <ChoiceButton variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft size={14} className="mr-2" /> Back
                  </ChoiceButton>
                  <ChoiceButton onClick={handleNext} className="flex-1">
                    Optimize CV <Sparkles size={14} className="ml-2" />
                  </ChoiceButton>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step: Optimize */}
        {step === 'optimize' && (
          <div className="space-y-4">
            {isGenerating ? (
              <div className="text-center py-8">
                <div className="animate-spin bg-primary/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 border-t-4 border-primary" />
                <p className="text-muted-foreground font-medium animate-pulse">AI optimizing CV for {job.company}...</p>
              </div>
            ) : (
              <>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-600" />
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">AI Optimization Complete</p>
                  </div>
                  <ul className="space-y-2 text-sm text-emerald-700 dark:text-emerald-300">
                    <li className="flex items-start gap-2"><CheckCircle size={12} className="mt-0.5 shrink-0" /> Tailored summary for {job.company}'s {job.title} role</li>
                    <li className="flex items-start gap-2"><CheckCircle size={12} className="mt-0.5 shrink-0" /> Highlighted {mr?.matchingSkills?.length || 0} matching skills</li>
                    {mr?.missingSkills && mr.missingSkills.length > 0 && (
                      <li className="flex items-start gap-2"><CheckCircle size={12} className="mt-0.5 shrink-0" /> Added transferable skills to cover gaps in {mr.missingSkills.slice(0, 2).join(', ')}</li>
                    )}
                    <li className="flex items-start gap-2"><CheckCircle size={12} className="mt-0.5 shrink-0" /> Trust Score and on-chain verification included</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <ChoiceButton variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft size={14} className="mr-2" /> Back
                  </ChoiceButton>
                  <ChoiceButton onClick={handleNext} className="flex-1">
                    Generate Cover Letter <ArrowRight size={14} className="ml-2" />
                  </ChoiceButton>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step: Cover Letter */}
        {step === 'cover-letter' && (
          <div className="space-y-4">
            {isGenerating ? (
              <div className="text-center py-8">
                <div className="animate-spin bg-primary/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 border-t-4 border-primary" />
                <p className="text-muted-foreground font-medium animate-pulse">Generating cover letter...</p>
              </div>
            ) : (
              <>
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} className="text-primary" />
                    <h3 className="font-bold text-foreground">Cover Letter</h3>
                  </div>
                  <div className="text-sm text-foreground leading-relaxed space-y-3">
                    <p>Dear Hiring Team at <strong>{job.company}</strong>,</p>
                    <p>
                      I am excited to apply for the <strong>{job.title}</strong> position. With a verified Trust Score of {score}/100
                      on the CHOICE Identity platform, I bring a unique combination of verified credentials and on-chain experience.
                    </p>
                    <p>
                      My profile demonstrates expertise in {mr?.matchingSkills?.slice(0, 3).join(', ') || 'blockchain technology'},
                      backed by {educationCreds.length} completed education module{educationCreds.length !== 1 ? 's' : ''} and
                      {socialCreds.length > 0 ? ` ${socialCreds.length} verified social presence${socialCreds.length !== 1 ? 's' : ''}` : ' growing professional network'}.
                    </p>
                    <p>
                      I look forward to discussing how my verified credentials and passion for Web3 can contribute to {job.company}'s mission.
                    </p>
                    <p className="text-muted-foreground italic">— Verified via CHOICE Identity Protocol</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <ChoiceButton variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft size={14} className="mr-2" /> Back
                  </ChoiceButton>
                  <ChoiceButton onClick={handleNext} className="flex-1">
                    Preview Full CV <ArrowRight size={14} className="ml-2" />
                  </ChoiceButton>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step: Full CV Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* CV Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                    <User size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{identity.displayName || identity.address.slice(0, 8) + '...'}</h3>
                    <p className="text-slate-400 text-xs font-mono">{identity.did}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="bg-primary/20 text-primary text-[9px] font-bold px-2 py-0.5 rounded uppercase">Score: {score}</span>
                      <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Match: {job.matchScore}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CV Body */}
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Applying For</p>
                  <p className="font-bold text-foreground">{job.title} at {job.company}</p>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <Award size={14} className="mx-auto text-primary mb-1" />
                    <p className="text-[8px] font-black text-muted-foreground uppercase">Social</p>
                    <p className="text-sm font-bold text-foreground">{breakdown.categories.social}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <GraduationCap size={14} className="mx-auto text-primary mb-1" />
                    <p className="text-[8px] font-black text-muted-foreground uppercase">Education</p>
                    <p className="text-sm font-bold text-foreground">{breakdown.categories.education}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <FileText size={14} className="mx-auto text-primary mb-1" />
                    <p className="text-[8px] font-black text-muted-foreground uppercase">Physical</p>
                    <p className="text-sm font-bold text-foreground">{breakdown.categories.physical}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <Briefcase size={14} className="mx-auto text-primary mb-1" />
                    <p className="text-[8px] font-black text-muted-foreground uppercase">Finance</p>
                    <p className="text-sm font-bold text-foreground">{breakdown.categories.finance}</p>
                  </div>
                </div>

                {mr?.matchingSkills && mr.matchingSkills.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Matching Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {mr.matchingSkills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 rounded text-[11px] font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {educationCreds.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Education</p>
                    <div className="space-y-1">
                      {educationCreds.slice(0, 4).map((vc, i) => {
                        const sub = vc.credentialSubject as any;
                        return (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <GraduationCap size={12} className="text-muted-foreground" />
                            <span className="text-foreground font-medium">{sub.courseName || 'Course'}</span>
                            {sub.badge && <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{sub.badge}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <ChoiceButton variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft size={14} className="mr-2" /> Back
              </ChoiceButton>
              <ChoiceButton onClick={handleSend} isLoading={isSending} className="flex-1">
                <Send size={14} className="mr-2" /> Send Application
              </ChoiceButton>
            </div>
          </div>
        )}

        {/* Step: Sent confirmation */}
        {step === 'sent' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground mb-1">Application Sent Successfully!</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Your verified CHOICE ID profile, optimized CV, and cover letter have been sent to <strong className="text-foreground">{job.company}</strong> for the <strong className="text-foreground">{job.title}</strong> role.
              </p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 inline-flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Match Score:</span>
              <span className="font-bold text-primary">{job.matchScore}%</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">Trust Score:</span>
              <span className="font-bold text-foreground">{score}</span>
            </div>
            <ChoiceButton variant="outline" onClick={handleClose} className="w-full">
              Close
            </ChoiceButton>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
