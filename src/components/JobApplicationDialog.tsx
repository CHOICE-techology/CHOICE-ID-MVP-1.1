import React, { useState, useEffect } from 'react';
import { Job, JobMatchResult, GeneratedCV, UserIdentity } from '@/types';
import { mockGenerateCV, mockGenerateBio } from '@/services/cryptoService';
import { calculateReputation } from '@/services/reputationEngine';
import { ChoiceButton } from '@/components/ChoiceButton';
import {
  Briefcase, Target, Sparkles, FileCheck, PenTool, CheckCircle, Eye, FileText, Download, Send
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';

interface JobWithMatchResult extends Job {
  matchResult: JobMatchResult;
}

interface JobApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobWithMatchResult | null;
  identity: UserIdentity;
  onUpdateIdentity?: (identity: UserIdentity) => void;
}

export const JobApplicationDialog: React.FC<JobApplicationDialogProps> = ({
  open, onOpenChange, job, identity, onUpdateIdentity,
}) => {
  const [cv, setCv] = useState<GeneratedCV | null>(null);
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [optimizedCV, setOptimizedCV] = useState<GeneratedCV | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [cvViewOpen, setCvViewOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [applicationSent, setApplicationSent] = useState(false);

  const reputation = calculateReputation(identity.credentials);
  const score = reputation?.score ?? 0;
  const tier = score >= 80 ? 'Grand Master' : score >= 60 ? 'Expert Verified' : score >= 30 ? 'Verified Identity' : 'New Entrant';

  const displayCV = optimizedCV || cv;

  const handleGenerateCV = async () => {
    setIsGeneratingCV(true);
    try {
      const generated = await mockGenerateCV(identity);
      setCv(generated);
      setOptimizedCV(null);
      setCoverLetter(null);
      if (!identity.bio && onUpdateIdentity) {
        const newBio = await mockGenerateBio(identity);
        onUpdateIdentity({ ...identity, bio: newBio });
      }
    } catch (e) { console.error(e); }
    finally { setIsGeneratingCV(false); }
  };

  const handleOptimizeForJob = async () => {
    if (!cv || !job) return;
    const fakeJD = `${job.title} at ${job.company}. ${job.description}. Skills: ${job.requiredSkills.join(', ')}`;
    setIsOptimizing(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const jdLower = fakeJD.toLowerCase();
      const prioritizedSkills = [...cv.skills].sort((a, b) => {
        const aMatch = jdLower.includes(a.toLowerCase()) ? -1 : 1;
        const bMatch = jdLower.includes(b.toLowerCase()) ? -1 : 1;
        return aMatch - bMatch;
      });
      setOptimizedCV({
        ...cv,
        summary: `Tailored professional with verified credentials for ${job.title} at ${job.company}. ${cv.summary}`,
        skills: prioritizedSkills,
      });
    } catch (e) { console.error(e); }
    finally { setIsOptimizing(false); }
  };

  const handleGenerateCoverLetter = async () => {
    if (!cv || !job) return;
    setIsGeneratingCover(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      const topSkills = cv.skills.slice(0, 4).join(', ');
      const letter = `Dear Hiring Manager at ${job.company},

I am writing to express my strong interest in the ${job.title} position. As a verified Web3 professional with a CHOICE Trust Score of ${score}/100 (${tier}), I bring a unique combination of on-chain credentials and real-world expertise.

My verified profile demonstrates proficiency in ${topSkills}, backed by cryptographic proofs anchored on-chain. ${cv.experience.length > 0 ? `With experience as ${cv.experience[0].role} at ${cv.experience[0].company}, I have a proven track record of delivering results in the decentralized ecosystem.` : ''}

${cv.education.length > 0 ? `My education includes ${cv.education[0].degree} from ${cv.education[0].institution}, complementing my practical blockchain experience.` : ''}

I am excited about the opportunity to contribute to ${job.company}'s mission and would welcome the chance to discuss how my verified credentials align with your team's needs.

Best regards,
${identity.displayName || 'CHOICE ID Holder'}
DID: ${identity.did}`;
      setCoverLetter(letter);
    } catch (e) { console.error(e); }
    finally { setIsGeneratingCover(false); }
  };

  if (!job) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase size={20} className="text-primary" /> {job.title}
            </DialogTitle>
            <DialogDescription>{job.company} · {job.type} · {job.salary}</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-5">
            {/* Match score */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
              job.matchResult.score >= 70 ? 'bg-emerald-100 text-emerald-700' :
              job.matchResult.score >= 40 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-600'
            }`}>
              <Target size={14} />
              {job.matchResult.score}% Match
            </div>

            {/* Job Description */}
            <div className="bg-muted rounded-2xl p-5 border border-border">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Job Description</h4>
              <p className="text-foreground text-sm leading-relaxed">{job.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.requiredSkills.map((skill, i) => (
                  <span key={i} className="bg-foreground/10 text-foreground px-2 py-0.5 rounded-lg text-[10px] font-semibold">{skill}</span>
                ))}
              </div>
            </div>

            {/* Match details */}
            {job.matchResult.reason && (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-sm text-foreground">
                <span className="font-bold text-primary text-xs uppercase tracking-wider">AI Insight: </span>
                {job.matchResult.reason}
              </div>
            )}

            {/* Quick actions */}
            {!cv ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-3">Generate your CV first to optimize for this role.</p>
                <ChoiceButton onClick={handleGenerateCV} isLoading={isGeneratingCV}>
                  <Sparkles size={16} className="mr-2" /> Generate CV
                </ChoiceButton>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <ChoiceButton size="sm" onClick={handleOptimizeForJob} isLoading={isOptimizing} className="flex-1">
                    <FileCheck size={14} className="mr-1" /> Optimize CV for this Role
                  </ChoiceButton>
                  <ChoiceButton size="sm" variant="outline" onClick={handleGenerateCoverLetter} isLoading={isGeneratingCover} className="flex-1">
                    <PenTool size={14} className="mr-1" /> Generate Cover Letter
                  </ChoiceButton>
                </div>

                {optimizedCV && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-700">
                    <CheckCircle size={14} />
                    <span className="font-semibold">CV optimized for {job.title}</span>
                  </div>
                )}

                {coverLetter && (
                  <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                        <PenTool size={12} className="text-accent" /> Cover Letter
                      </h4>
                      <button onClick={() => navigator.clipboard.writeText(coverLetter)} className="text-[10px] font-bold text-primary hover:underline">Copy</button>
                    </div>
                    <pre className="text-foreground text-xs leading-relaxed whitespace-pre-wrap font-sans bg-muted p-3 rounded-xl border border-border max-h-40 overflow-y-auto">
                      {coverLetter}
                    </pre>
                  </div>
                )}

                <button onClick={() => { setCvViewOpen(true); onOpenChange(false); }} className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mx-auto">
                  <Eye size={12} /> View Full CV
                </button>

                {/* Send Application Button */}
                <div className="pt-3 border-t border-border">
                  {applicationSent ? (
                    <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-5 py-3 text-sm font-bold">
                      <CheckCircle size={16} /> Application Sent Successfully!
                    </div>
                  ) : (
                    <ChoiceButton
                      className="w-full"
                      onClick={() => {
                        setIsSending(true);
                        setTimeout(() => {
                          setIsSending(false);
                          setApplicationSent(true);
                        }, 1500);
                      }}
                      isLoading={isSending}
                    >
                      <Send size={16} className="mr-2" /> Send Application
                    </ChoiceButton>
                  )}
                  <p className="text-[10px] text-muted-foreground text-center mt-2">Your CHOICE CV and Trust Score will be securely shared.</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full CV Dialog */}
      <Dialog open={cvViewOpen} onOpenChange={setCvViewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={20} className="text-primary" /> Professional CHOICE CV
            </DialogTitle>
            <DialogDescription>Your aggregated proof of on-chain and off-chain reputation.</DialogDescription>
          </DialogHeader>

          {displayCV && (
            <div className="space-y-6 mt-4">
              <div className="bg-muted p-5 rounded-2xl border border-border space-y-5">
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 border-b border-border pb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div> Summary
                    {optimizedCV && <span className="text-primary text-[9px] bg-primary/10 px-1.5 py-0.5 rounded ml-auto">JD-Optimized</span>}
                  </h4>
                  <p className="text-foreground leading-relaxed text-sm">{displayCV.summary}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 border-b border-border pb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div> Experience
                  </h4>
                  <div className="space-y-2">
                    {displayCV.experience.map((exp, i) => (
                      <div key={i} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-3 rounded-xl shadow-sm border border-border">
                        <div>
                          <div className="font-bold text-foreground text-sm">{exp.role}</div>
                          <div className="text-xs text-primary font-semibold">{exp.company}</div>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-1 rounded border border-border mt-1 md:mt-0">{exp.duration}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 border-b border-border pb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full"></div> Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {displayCV.skills.map((skill, i) => (
                      <span key={i} className="bg-foreground text-background px-2.5 py-1 rounded-lg text-xs font-bold shadow-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <ChoiceButton variant="outline" size="sm" onClick={() => alert("Downloading PDF...")}>
                  <Download size={14} className="mr-1" /> Download PDF
                </ChoiceButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
