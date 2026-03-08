import React from 'react';
import { Award, CheckCircle, Star } from 'lucide-react';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Course } from '@/data/coursesData';

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
      <div className="relative mx-auto w-28 h-28">
        <div className={`absolute inset-0 bg-gradient-to-br ${course.badgeColor} rounded-full opacity-20 animate-pulse`} />
        <div className={`relative w-full h-full bg-gradient-to-br ${course.badgeColor} rounded-full flex items-center justify-center shadow-2xl`}>
          <div className="text-center">
            <span className="text-3xl block">{course.icon}</span>
            <CheckCircle size={16} className="text-white mx-auto mt-1" />
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-extrabold text-foreground">Course Completed!</h1>

      <p className="text-muted-foreground text-lg">
        You scored <strong className="text-foreground">{correctCount}/{quizTotal}</strong> on quizzes
        and earned <strong className="text-primary">+{course.points} points</strong>.
      </p>

      {/* Stats row */}
      <div className="flex justify-center gap-4">
        <div className="bg-card border border-border rounded-2xl px-5 py-3 text-center">
          <Star size={18} className="text-amber-400 mx-auto mb-1" />
          <span className="block text-xl font-bold text-foreground">{scorePercent}%</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Quiz Score</span>
        </div>
        <div className="bg-card border border-border rounded-2xl px-5 py-3 text-center">
          <Award size={18} className="text-primary mx-auto mb-1" />
          <span className="block text-xl font-bold text-foreground">+{course.points}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Points</span>
        </div>
      </div>

      {/* Earned badge */}
      <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r ${course.badgeColor} text-white font-bold shadow-lg`}>
        <span>{course.icon}</span>
        {course.level} Badge — {course.title}
        <CheckCircle size={14} />
      </div>

      <div>
        <ChoiceButton onClick={onBack} className="mt-4">Back to Education Center</ChoiceButton>
      </div>
    </div>
  );
};

export default LessonComplete;
