import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COURSES } from '@/data/coursesData';
import { ChoiceButton } from '@/components/ChoiceButton';
import { ArrowLeft, ArrowRight, BookOpen, Zap, Layers } from 'lucide-react';
import { VerifiableCredential } from '@/types';
import { addCredential } from '@/services/storageService';
import { mockUploadToIPFS } from '@/services/cryptoService';
import { useWallet } from '@/contexts/WalletContext';
import { grantReward } from '@/services/rewardService';


const LessonPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { userIdentity: identity, updateIdentity: onUpdateIdentity } = useWallet();

  const course = COURSES.find(c => c.id === courseId);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!course) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-4">Course Not Found</h1>
        <ChoiceButton onClick={() => navigate('/education')}>Back to Education</ChoiceButton>
      </div>
    );
  }

  const lesson = course.lessons[currentLessonIdx];
  const isLastLesson = currentLessonIdx === course.lessons.length - 1;
  const progress = ((currentLessonIdx + (answered ? 1 : 0)) / course.lessons.length) * 100;

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    if (lesson.quiz && idx === lesson.quiz.correctIndex) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (isLastLesson) {
      handleComplete();
    } else {
      setCurrentLessonIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  const handleComplete = async () => {
    if (!identity) return;
    setCompleting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const badgeVC: VerifiableCredential = {
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential', 'EducationCredential'],
        issuer: 'did:web:choice.love/education',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: identity.did,
          courseName: course.title,
          level: course.level,
          badge: `${course.level} Badge`,
          points: course.points,
          quizScore: `${correctCount}/${course.lessons.length}`
        }
      };
      await mockUploadToIPFS(badgeVC);
      const newIdentity = await addCredential(identity, badgeVC);
      await onUpdateIdentity(newIdentity);
      setCompleted(true);

    } catch (e) {
      console.error(e);
    } finally {
      setCompleting(false);
    }
  };

  const renderInlineMarkdown = (text: string) => {
    const chunks = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    return chunks.map((chunk, index) => {
      const isBold = chunk.startsWith('**') && chunk.endsWith('**') && chunk.length > 4;
      if (isBold) {
        return <strong key={`bold-${index}`} className="text-foreground font-bold">{chunk.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={`text-${index}`}>{chunk}</React.Fragment>;
    });
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-10">
...
        <div className="p-6 md:p-8">
          <div className="prose max-w-none">
            {lesson.content.split('\n').map((line, i) => {
              if (line.startsWith('###')) {
                return <h3 key={i} className="text-xl font-bold mt-6 mb-3 text-foreground">{line.replace('###', '').trim()}</h3>;
              }
              if (line.startsWith('-')) {
                return <li key={i} className="text-muted-foreground ml-4 mb-2">{renderInlineMarkdown(line.replace('-', '').trim())}</li>;
              }
              if (line.startsWith('✅') || line.startsWith('🔴')) {
                return <div key={i} className="flex gap-2 items-start mb-4 p-3 rounded-lg bg-muted/30 border border-border/50 text-sm">{renderInlineMarkdown(line)}</div>;
              }
              if (line.trim() === '') return <div key={i} className="h-4" />;
              return <p key={i} className="text-muted-foreground leading-relaxed mb-4">{renderInlineMarkdown(line)}</p>;
            })}
          </div>
        </div>
      </div>

      {/* Quiz Section */}
      {lesson.quiz && (
        <div className={`glass-dark border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl transition-all ${answered ? 'opacity-100' : 'opacity-90'} hover:bg-white/5 group`}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">?</div>
            <h3 className="text-lg font-bold text-foreground">Knowledge Check</h3>
          </div>
          
          <p className="text-foreground font-medium mb-6">{lesson.quiz.question}</p>
          
          <div className="space-y-3">
            {lesson.quiz.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = idx === lesson.quiz?.correctIndex;
              const showResult = answered;
              
              let variantClass = "border-border hover:border-primary/50 hover:bg-muted/50";
              if (showResult) {
                if (isCorrect) variantClass = "border-emerald-500 bg-emerald-500/10 text-emerald-500";
                else if (isSelected) variantClass = "border-destructive bg-destructive/10 text-destructive";
                else variantClass = "opacity-50 border-border";
              } else if (isSelected) {
                variantClass = "border-primary bg-primary/10 text-primary";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={answered}
                  className={`w-full text-left p-4 rounded-xl border-2 font-medium transition-all flex items-center justify-between ${variantClass}`}
                >
                  <span>{option}</span>
                  {showResult && isCorrect && <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</div>}
                  {showResult && isSelected && !isCorrect && <div className="w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center text-[10px]">✕</div>}
                </button>
              );
            })}
          </div>
          
          {answered && (
            <div className={`mt-6 p-4 rounded-xl border ${selectedAnswer === lesson.quiz.correctIndex ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-destructive/5 border-destructive/20 text-destructive'} animate-in fade-in slide-in-from-top-2`}>
              <p className="text-sm font-bold">
                {selectedAnswer === lesson.quiz.correctIndex ? '✨ Correct! Well done.' : 'Oops! That\'s not quite right.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Success Modal / Screen */}
      {completed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/40 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="glass-dark border-white/10 rounded-[3rem] p-10 max-w-sm w-full shadow-[0_0_100px_rgba(var(--primary),0.2)] text-center animate-in zoom-in duration-300">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${course.badgeColor} mx-auto mb-6 flex items-center justify-center text-3xl shadow-lg shadow-primary/20`}>
              🏆
            </div>
            <h2 className="text-2xl font-bold mb-2">Course Completed!</h2>
            <p className="text-muted-foreground mb-8">
              Congratulations! You've earned the <strong>{course.title}</strong> badge and <strong>{course.points} Reputation Points</strong>.
            </p>
            <ChoiceButton className="w-full" onClick={() => navigate('/education')}>
              Back to Academy
            </ChoiceButton>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <ChoiceButton
          variant="outline"
          onClick={() => { setCurrentLessonIdx(prev => prev - 1); setSelectedAnswer(null); setAnswered(false); }}
          disabled={currentLessonIdx === 0}
          className="rounded-xl px-6"
        >
          <ArrowLeft size={16} className="mr-2" /> Previous
        </ChoiceButton>
        <ChoiceButton
          onClick={handleNext}
          disabled={!answered && !!lesson.quiz}
          isLoading={completing}
          className="rounded-xl px-8"
        >
          {isLastLesson ? 'Claim Your Badge' : 'Continue'} {!isLastLesson && <ArrowRight size={16} className="ml-2" />}
        </ChoiceButton>
      </div>
    </div>
  );
};

export default LessonPage;
