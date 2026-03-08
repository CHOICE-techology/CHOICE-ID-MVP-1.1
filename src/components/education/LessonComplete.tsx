import React from 'react';
import { Award, CheckCircle, Star, Sparkles } from 'lucide-react';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Course } from '@/data/coursesData';
import CourseIcon from '@/components/education/CourseIcon';

interface LessonCompleteProps {
  course: Course;
  correctCount: number;
  onBack: () => void;
}

const LessonComplete: React.FC<LessonCompleteProps> = ({ course, correctCount, onBack }) => {
  const quizTotal = course.lessons.length;
  const scorePercent = Math.round((correctCount / quizTotal) * 100);

  return (
    <div className="max-w-2xl mx-auto text-center py-12 animate-fade-in space-y-6">
      {/* Badge animation */}
      <div className="relative mx-auto w-32 h-32">
        {/* Outer glow ring */}
        <div className={`absolute -inset-3 bg-gradient-to-br ${course.badgeColor} rounded-full opacity-15 blur-xl animate-pulse`} />
        {/* Decorative ring */}
        <div className={`absolute -inset-1 bg-gradient-to-br ${course.badgeColor} rounded-full opacity-30`} />
        {/* Main badge */}
        <div className={`relative w-full h-full bg-gradient-to-br ${course.badgeColor} rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20`}>
          <div className="text-center">
            <CourseIcon courseId={course.id} size={36} className="text-white drop-shadow-lg mx-auto" />
            <div className="mt-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 inline-flex items-center gap-1">
              <CheckCircle size={10} className="text-white" />
              <span className="text-[9px] font-bold text-white uppercase tracking-wider">Verified</span>
            </div>
          </div>
        </div>
        {/* Sparkle accents */}
        <Sparkles size={14} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
        <Sparkles size={10} className="absolute -bottom-0 -left-2 text-primary animate-pulse delay-300" />
      </div>

      <h1 className="text-3xl font-extrabold text-foreground">Course Completed!</h1>

      <p className="text-muted-foreground text-lg">
        You scored <strong className="text-foreground">{correctCount}/{quizTotal}</strong> on quizzes
        and earned <strong className="text-primary">+{course.points} points</strong>.
      </p>

      {/* Stats row */}
      <div className="flex justify-center gap-4">
        <div className="bg-card border border-border rounded-2xl px-6 py-4 text-center">
          <Star size={20} className="text-amber-400 fill-amber-400 mx-auto mb-1.5" />
          <span className="block text-2xl font-extrabold text-foreground">{scorePercent}%</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Quiz Score</span>
        </div>
        <div className="bg-card border border-border rounded-2xl px-6 py-4 text-center">
          <Award size={20} className="text-primary mx-auto mb-1.5" />
          <span className="block text-2xl font-extrabold text-foreground">+{course.points}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Points</span>
        </div>
      </div>

      {/* Earned badge — redesigned */}
      <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-card border border-border shadow-lg">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${course.badgeColor} flex items-center justify-center shadow-md`}>
          <CourseIcon courseId={course.id} size={18} className="text-white" />
        </div>
        <div className="text-left">
          <span className="block text-sm font-bold text-foreground">{course.title}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{course.level} Badge Earned</span>
        </div>
        <CheckCircle size={18} className="text-emerald-400 ml-2" />
      </div>

      <div>
        <ChoiceButton onClick={onBack} className="mt-4">Back to Education Center</ChoiceButton>
      </div>
    </div>
  );
};

export default LessonComplete;
