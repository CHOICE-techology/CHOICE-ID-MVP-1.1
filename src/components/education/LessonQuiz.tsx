import React from 'react';
import { CheckCircle, XCircle, HelpCircle, Lightbulb } from 'lucide-react';

interface LessonQuizProps {
  quiz: { question: string; options: string[]; correctIndex: number };
  selectedAnswer: number | null;
  answered: boolean;
  onAnswer: (idx: number) => void;
}

const LessonQuiz: React.FC<LessonQuizProps> = ({ quiz, selectedAnswer, answered, onAnswer }) => {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-gradient-to-r from-amber-500/5 to-orange-500/5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <HelpCircle size={16} className="text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Knowledge Check</h3>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Test your understanding</p>
        </div>
      </div>

      <div className="p-6">
        <p className="text-foreground font-semibold mb-5 text-base leading-relaxed">{quiz.question}</p>
        <div className="space-y-3">
          {quiz.options.map((option, idx) => {
            const isCorrect = idx === quiz.correctIndex;
            const isSelected = idx === selectedAnswer;

            let containerClasses = 'border-border hover:border-primary/40 hover:bg-primary/5';
            let letterClasses = 'border-muted-foreground/30 text-muted-foreground';

            if (answered) {
              if (isCorrect) {
                containerClasses = 'border-emerald-500 bg-emerald-500/10 shadow-sm shadow-emerald-500/10';
                letterClasses = 'border-emerald-500 text-emerald-400 bg-emerald-500/10';
              } else if (isSelected && !isCorrect) {
                containerClasses = 'border-red-400 bg-red-500/10 shadow-sm shadow-red-500/10';
                letterClasses = 'border-red-400 text-red-400 bg-red-500/10';
              } else {
                containerClasses = 'border-border opacity-30';
                letterClasses = 'border-muted-foreground/20 text-muted-foreground/40';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => onAnswer(idx)}
                disabled={answered}
                className={`w-full text-left p-4 rounded-xl border-2 ${containerClasses} transition-all duration-200 flex items-center gap-4 group`}
              >
                <span className={`w-8 h-8 rounded-lg border-2 ${letterClasses} flex items-center justify-center text-xs font-bold shrink-0 transition-all`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm font-medium text-foreground flex-1">{option}</span>
                {answered && isCorrect && <CheckCircle size={20} className="text-emerald-400 shrink-0" />}
                {answered && isSelected && !isCorrect && <XCircle size={20} className="text-red-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Result feedback */}
        {answered && (
          <div className={`mt-5 p-4 rounded-xl text-sm font-medium flex items-start gap-3 ${
            selectedAnswer === quiz.correctIndex
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              selectedAnswer === quiz.correctIndex ? 'bg-emerald-500/20' : 'bg-red-500/20'
            }`}>
              {selectedAnswer === quiz.correctIndex
                ? <CheckCircle size={16} className="text-emerald-400" />
                : <Lightbulb size={16} className="text-red-400" />
              }
            </div>
            <div>
              <span className={`block font-bold text-sm mb-0.5 ${
                selectedAnswer === quiz.correctIndex ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {selectedAnswer === quiz.correctIndex ? 'Correct!' : 'Not quite right'}
              </span>
              <span className="text-muted-foreground text-xs">
                {selectedAnswer === quiz.correctIndex
                  ? 'Great job — you nailed this one.'
                  : `The correct answer is: ${quiz.options[quiz.correctIndex]}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonQuiz;
