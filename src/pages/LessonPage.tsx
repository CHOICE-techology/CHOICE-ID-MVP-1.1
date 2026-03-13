import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COURSES } from '@/data/coursesData';
import { ChoiceButton } from '@/components/ChoiceButton';
import { ArrowLeft, ArrowRight, BookOpen, Zap, Layers } from 'lucide-react';
import { VerifiableCredential } from '@/types';
import { addCredential } from '@/services/storageService';
import { mockUploadToIPFS } from '@/services/cryptoService';
import { useWallet } from '@/contexts/WalletContext';



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
      {/* Course header with badge color accent */}
      <div className={`glass border-white/10 rounded-[2rem] p-5 mb-8 shadow-2xl relative overflow-hidden group transition-all hover:bg-white/5`}>
        <div className={`absolute inset-0 bg-gradient-to-r ${course.badgeColor} opacity-20 group-hover:opacity-30 transition-opacity`} />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => navigate('/education')} className="text-white/80 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">{course.title}</p>
            <p className="text-white/70 text-xs">Lesson {currentLessonIdx + 1} of {course.lessons.length} · {course.level}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
            <span className="text-white text-xs font-bold">+{course.points} pts</span>
          </div>
        </div>
      </div>

      {/* Progress bar with lesson markers */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Zap size={12} className="text-primary" /> Progress
          </span>
          <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="relative w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${course.badgeColor} transition-all duration-500 rounded-full`} style={{ width: `${progress}%` }} />
        </div>
        {/* Lesson dots */}
        <div className="flex justify-between mt-3 px-1">
          {course.lessons.map((l, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full transition-all border-2 ${
                i < currentLessonIdx ? 'bg-emerald-400 border-emerald-400 shadow-sm shadow-emerald-400/30' :
                i === currentLessonIdx ? `bg-gradient-to-r ${course.badgeColor} border-transparent ring-2 ring-primary/30 shadow-sm` :
                'bg-transparent border-muted-foreground/20'
              }`} />
              <span className={`text-[9px] font-bold ${i === currentLessonIdx ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Lesson Content Card */}
      <div className="glass-dark border-white/5 rounded-3xl overflow-hidden mb-8 shadow-2xl transition-all hover:bg-white/5 group">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5 bg-white/5">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${course.badgeColor} flex items-center justify-center`}>
            <BookOpen size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-foreground">{lesson.title}</h2>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1">
              <Layers size={10} /> Lesson {currentLessonIdx + 1} of {course.lessons.length}
            </p>
          </div>
        </div>
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
