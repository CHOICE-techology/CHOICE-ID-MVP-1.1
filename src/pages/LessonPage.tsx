import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COURSES, Lesson } from '@/data/coursesData';
import { ChoiceButton } from '@/components/ChoiceButton';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Award } from 'lucide-react';
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
      const newIdentity = addCredential(identity, badgeVC);
      onUpdateIdentity(newIdentity);
      setCompleted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setCompleting(false);
    }
  };

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 animate-fade-in space-y-6">
        <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
          <Award size={40} className="text-emerald-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">Course Completed!</h1>
        <p className="text-muted-foreground text-lg">
          You scored <strong className="text-foreground">{correctCount}/{course.lessons.length}</strong> on quizzes and earned <strong className="text-primary">+{course.points} points</strong>.
        </p>
        <div className="bg-card border border-border rounded-2xl p-6 inline-block">
          <p className="text-sm text-muted-foreground mb-1">Badge Earned</p>
          <p className="text-xl font-bold text-foreground">{course.level} Badge — {course.title}</p>
        </div>
        <div>
          <ChoiceButton onClick={() => navigate('/education')} className="mt-4">Back to Education Center</ChoiceButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/education')} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{course.title}</p>
          <p className="text-sm text-muted-foreground">Lesson {currentLessonIdx + 1} of {course.lessons.length}</p>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${course.color} text-white`}>{course.level}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full mb-8 overflow-hidden">
        <div className={`h-full ${course.color} transition-all duration-500 rounded-full`} style={{ width: `${progress}%` }} />
      </div>

      {/* Lesson Content */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
        <h2 className="text-2xl font-extrabold text-foreground mb-6">{lesson.title}</h2>
        <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
          {lesson.content.split('\n').map((line, i) => {
            if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-foreground mt-6 mb-3">{line.replace('### ', '')}</h3>;
            if (line.startsWith('```')) return null;
            if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1">{line.replace('- ', '')}</li>;
            if (line.startsWith('| ')) return <p key={i} className="font-mono text-xs bg-muted px-3 py-1 rounded mb-1">{line}</p>;
            if (line.match(/^[0-9]+\. /)) return <li key={i} className="ml-4 mb-1 list-decimal">{line.replace(/^[0-9]+\. /, '')}</li>;
            if (line.startsWith('✅') || line.startsWith('🔴')) return <p key={i} className="mb-1">{line}</p>;
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} className="mb-2">{line.split('**').map((part, j) => j % 2 === 1 ? <strong key={j} className="text-foreground font-semibold">{part}</strong> : part)}</p>;
          })}
        </div>
      </div>

      {/* Quiz */}
      {lesson.quiz && (
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4">📝 Quiz</h3>
          <p className="text-foreground font-medium mb-4">{lesson.quiz.question}</p>
          <div className="space-y-2">
            {lesson.quiz.options.map((option, idx) => {
              const isCorrect = idx === lesson.quiz!.correctIndex;
              const isSelected = idx === selectedAnswer;
              let borderClass = 'border-border hover:border-primary';
              if (answered) {
                if (isCorrect) borderClass = 'border-emerald-500 bg-emerald-50';
                else if (isSelected && !isCorrect) borderClass = 'border-red-400 bg-red-50';
                else borderClass = 'border-border opacity-50';
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={answered}
                  className={`w-full text-left p-4 rounded-xl border-2 ${borderClass} transition-all flex items-center gap-3`}
                >
                  <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm font-medium text-foreground flex-1">{option}</span>
                  {answered && isCorrect && <CheckCircle size={20} className="text-emerald-500 shrink-0" />}
                  {answered && isSelected && !isCorrect && <XCircle size={20} className="text-red-400 shrink-0" />}
                </button>
              );
            })}
          </div>
          {answered && (
            <div className={`mt-4 p-3 rounded-xl text-sm font-medium ${selectedAnswer === lesson.quiz.correctIndex ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {selectedAnswer === lesson.quiz.correctIndex ? '✅ Correct! Well done.' : `❌ Incorrect. The correct answer is: ${lesson.quiz.options[lesson.quiz.correctIndex]}`}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <ChoiceButton
          variant="outline"
          onClick={() => { setCurrentLessonIdx(prev => prev - 1); setSelectedAnswer(null); setAnswered(false); }}
          disabled={currentLessonIdx === 0}
        >
          <ArrowLeft size={16} className="mr-2" /> Previous
        </ChoiceButton>
        <ChoiceButton
          onClick={handleNext}
          disabled={!answered && !!lesson.quiz}
          isLoading={completing}
        >
          {isLastLesson ? 'Complete & Earn Badge' : 'Next Lesson'} {!isLastLesson && <ArrowRight size={16} className="ml-2" />}
        </ChoiceButton>
      </div>
    </div>
  );
};

export default LessonPage;
