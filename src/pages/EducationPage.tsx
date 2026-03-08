import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Award, CheckCircle, Lock, PlayCircle, Star, Trophy, Zap, Sparkles } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { COURSES } from '@/data/coursesData';
import CourseIcon from '@/components/education/CourseIcon';

const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Beginner: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Intermediate: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  Advanced: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

const EducationPage: React.FC = () => {
  const { userIdentity: identity } = useWallet();
  const navigate = useNavigate();

  const hasBadge = (courseTitle: string) =>
    identity?.credentials.some(vc => vc.type.includes('EducationCredential') && vc.credentialSubject.courseName === courseTitle);

  const completedCourses = COURSES.filter(c => hasBadge(c.title));
  const totalPoints = COURSES.reduce((sum, c) => sum + c.points, 0);
  const earnedPoints = completedCourses.reduce((sum, c) => sum + c.points, 0);
  const completionPercent = Math.round((completedCourses.length / COURSES.length) * 100);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header with stats */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2 tracking-tight">Education Center</h1>
          <p className="text-muted-foreground text-base md:text-lg">Earn badges and boost your Trust Score by mastering Web3 skills.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-card border border-border rounded-2xl px-4 py-3 text-center min-w-[80px]">
            <span className="block text-2xl font-extrabold text-primary">{earnedPoints}</span>
            <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">/ {totalPoints} pts</span>
          </div>
          <div className="bg-card border border-border rounded-2xl px-4 py-3 text-center min-w-[80px]">
            <span className="block text-2xl font-extrabold text-foreground">{completedCourses.length}</span>
            <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">/ {COURSES.length} done</span>
          </div>
          <div className="bg-card border border-border rounded-2xl px-4 py-3 text-center min-w-[80px]">
            <span className="block text-2xl font-extrabold text-accent">{completionPercent}%</span>
            <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Complete</span>
          </div>
        </div>
      </header>

      {/* Global progress bar */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground flex items-center gap-2"><Zap size={14} className="text-primary" /> Overall Progress</span>
          <span className="text-xs font-bold text-muted-foreground">{completionPercent}%</span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700" style={{ width: `${completionPercent}%` }} />
        </div>
      </div>

      {/* Earned Badges Showcase — Redesigned */}
      {completedCourses.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" /> Earned Badges
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {completedCourses.map(course => (
              <div
                key={course.id}
                className="group relative flex flex-col items-center text-center p-4 rounded-2xl border border-border bg-muted/20 hover:bg-muted/40 transition-all duration-300"
              >
                {/* Glow ring behind the badge */}
                <div className={`relative w-16 h-16 mb-3`}>
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${course.badgeColor} opacity-20 blur-md group-hover:opacity-40 transition-opacity`} />
                  <div className={`relative w-full h-full rounded-full bg-gradient-to-br ${course.badgeColor} flex items-center justify-center shadow-lg border-2 border-white/10`}>
                    <CourseIcon courseId={course.id} size={24} className="text-white drop-shadow-md" />
                  </div>
                  {/* Checkmark overlay */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center shadow-sm">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                </div>
                <span className="text-xs font-bold text-foreground leading-tight mb-1">{course.title}</span>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${LEVEL_STYLES[course.level].text}`}>
                  {course.level}
                </span>
                <div className="flex items-center gap-1 mt-1.5">
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  <span className="text-[10px] font-bold text-muted-foreground">+{course.points} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COURSES.map((course) => {
          const isCompleted = hasBadge(course.title);
          const level = LEVEL_STYLES[course.level];
          return (
            <div key={course.id} className={`bg-card border rounded-3xl p-6 shadow-xl flex flex-col relative overflow-hidden group transition-all duration-300 hover:shadow-2xl ${isCompleted ? 'border-emerald-500/30' : 'border-border'}`}>
              {/* Top color bar */}
              <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${course.badgeColor}`} />

              {/* Icon + Level + Status */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${course.badgeColor} flex items-center justify-center shadow-md`}>
                    <CourseIcon courseId={course.id} size={18} className="text-white" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${level.bg} ${level.text} ${level.border}`}>
                    {course.level}
                  </span>
                </div>
                {isCompleted ? (
                  <div className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-full border border-emerald-500/20">
                    <CheckCircle size={18} />
                  </div>
                ) : (
                  <div className="bg-muted text-muted-foreground/30 p-1.5 rounded-full">
                    <Lock size={18} />
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-foreground mb-2">{course.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 flex-1 leading-relaxed">{course.description}</p>

              {/* Meta info */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 font-medium">
                <span className="flex items-center gap-1"><PlayCircle size={13} /> {course.duration}</span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1"><Star size={13} className="text-amber-400 fill-amber-400" /> +{course.points} pts</span>
                <span className="text-border">•</span>
                <span>{course.lessons.length} lessons</span>
              </div>

              {/* Progress indicator */}
              <div className="mb-4">
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${course.badgeColor}`}
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  {isCompleted ? '✓ Completed' : 'Not started'}
                </span>
              </div>

              <ChoiceButton
                onClick={() => navigate(`/education/${course.id}`)}
                disabled={!identity}
                variant={isCompleted ? 'outline' : 'primary'}
                className="w-full"
              >
                {isCompleted ? 'Review Course' : 'Start Lesson'}
              </ChoiceButton>
            </div>
          );
        })}
      </div>

      {/* Gamified banner */}
      <div className="bg-gradient-to-r from-primary to-purple-600 rounded-3xl p-6 md:p-10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Award size={32} className="text-amber-300" />
            <h2 className="text-xl md:text-2xl font-bold text-white">Gamified Reputation</h2>
          </div>
          <p className="text-white/90 text-lg leading-relaxed mb-6">
            Every badge you earn is a Verifiable Credential stored in your wallet. Complete all {COURSES.length} courses to maximize your Trust Score.
          </p>
          <div className="flex gap-4">
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30">
              <span className="block text-2xl font-bold text-white">30%</span>
              <span className="text-xs uppercase tracking-wider text-white/80">Score Weight</span>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30">
              <span className="block text-2xl font-bold text-white">{COURSES.length}</span>
              <span className="text-xs uppercase tracking-wider text-white/80">Courses</span>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30">
              <span className="block text-2xl font-bold text-white">{totalPoints}</span>
              <span className="text-xs uppercase tracking-wider text-white/80">Total Points</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationPage;
