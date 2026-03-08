import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COURSES } from '@/data/coursesData';
import { ChoiceButton } from '@/components/ChoiceButton';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Award, BookOpen, Zap } from 'lucide-react';
import { VerifiableCredential } from '@/types';
import { addCredential } from '@/services/storageService';
import { mockUploadToIPFS } from '@/services/cryptoService';
import { useWallet } from '@/contexts/WalletContext';
import LessonContent from '@/components/education/LessonContent';
import LessonQuiz from '@/components/education/LessonQuiz';
import LessonComplete from '@/components/education/LessonComplete';

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
    return <LessonComplete course={course} correctCount={correctCount} onBack={() => navigate('/education')} />;
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-10">
      {/* Course header with badge color accent */}
      <div className={`bg-gradient-to-r ${course.badgeColor} rounded-2xl p-4 mb-6`}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/education')} className="text-white/80 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="text-2xl">{course.icon}</span>
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
        <div className="flex justify-between mt-2 px-1">
          {course.lessons.map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-2.5 h-2.5 rounded-full transition-all ${
                i < currentLessonIdx ? 'bg-emerald-400' :
                i === currentLessonIdx ? `bg-gradient-to-r ${course.badgeColor} ring-2 ring-primary/30` :
                'bg-muted-foreground/20'
              }`} />
              <span className={`text-[9px] font-medium ${i === currentLessonIdx ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Lesson Content Card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6 shadow-sm">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/30">
          <BookOpen size={18} className="text-primary" />
          <h2 className="text-lg font-extrabold text-foreground">{lesson.title}</h2>
        </div>
        <div className="p-6 md:p-8">
          <LessonContent content={lesson.content} />
        </div>
      </div>

      {/* Quiz */}
      {lesson.quiz && (
        <LessonQuiz
          quiz={lesson.quiz}
          selectedAnswer={selectedAnswer}
          answered={answered}
          onAnswer={handleAnswer}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
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
