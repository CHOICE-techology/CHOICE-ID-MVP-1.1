import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface LessonQuizProps {
  quiz: { question: string; options: string[]; correctIndex: number };
  selectedAnswer: number | null;
  answered: boolean;
  onAnswer: (idx: number) => void;
}

const LessonQuiz: React.FC<LessonQuizProps> = ({ quiz, selectedAnswer, answered, onAnswer }) => {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6 shadow-sm">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-amber-500/5">
        <span className="text-base">📝</span>
        <h3 className="text-sm font-bold text-foreground">Knowledge Check</h3>
      </div>
      <div className="p-6">
        <p className="text-foreground font-medium mb-4">{quiz.question}</p>
        <div className="space-y-2">
          {quiz.options.map((option, idx) => {
            const isCorrect = idx === quiz.correctIndex;
            const isSelected = idx === selectedAnswer;
            let classes = 'border-border hover:border-primary/50 hover:bg-muted/30';
            if (answered) {
              if (isCorrect) classes = 'border-emerald-500 bg-emerald-500/10';
              else if (isSelected && !isCorrect) classes = 'border-red-400 bg-red-500/10';
              else classes = 'border-border opacity-40';
            }
            return (
              <button
                key={idx}
                onClick={() => onAnswer(idx)}
                disabled={answered}
                className={`w-full text-left p-4 rounded-xl border-2 ${classes} transition-all flex items-center gap-3`}
              >
                <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm font-medium text-foreground flex-1">{option}</span>
                {answered && isCorrect && <CheckCircle size={18} className="text-emerald-400 shrink-0" />}
                {answered && isSelected && !isCorrect && <XCircle size={18} className="text-red-400 shrink-0" />}
              </button>
            );
          })}
        </div>
        {answered && (
          <div className={`mt-4 p-3 rounded-xl text-sm font-medium ${
            selectedAnswer === quiz.correctIndex
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {selectedAnswer === quiz.correctIndex
              ? '✅ Correct! Well done.'
              : `❌ Incorrect. The correct answer is: ${quiz.options[quiz.correctIndex]}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonQuiz;
