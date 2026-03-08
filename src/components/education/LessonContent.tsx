import React from 'react';
import { Info, Code, AlertTriangle } from 'lucide-react';

interface LessonContentProps {
  content: string;
}

const LessonContent: React.FC<LessonContentProps> = ({ content }) => {
  return (
    <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed space-y-1">
      {content.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h3 key={i} className="text-base font-bold text-foreground mt-7 mb-3 flex items-center gap-2.5">
              <div className="w-1.5 h-6 bg-gradient-to-b from-primary to-secondary rounded-full" />
              {line.replace('### ', '')}
            </h3>
          );
        if (line.startsWith('```')) return null;
        if (line.startsWith('- '))
          return (
            <li key={i} className="ml-5 mb-2 list-none flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span>{line.replace('- ', '')}</span>
            </li>
          );
        if (line.startsWith('| '))
          return (
            <p key={i} className="font-mono text-xs bg-muted/50 border border-border px-4 py-2 rounded-lg mb-1.5 flex items-center gap-2">
              <Code size={12} className="text-primary shrink-0" />
              {line}
            </p>
          );
        if (line.match(/^[0-9]+\. /))
          return (
            <li key={i} className="ml-5 mb-2 list-none flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {line.match(/^([0-9]+)/)?.[1]}
              </span>
              <span>{line.replace(/^[0-9]+\. /, '')}</span>
            </li>
          );
        if (line.startsWith('✅'))
          return (
            <p key={i} className="mb-2 pl-1 flex items-start gap-2 text-emerald-400/90">
              <span className="shrink-0 mt-0.5">✅</span>
              <span>{line.replace('✅ ', '')}</span>
            </p>
          );
        if (line.startsWith('🔴'))
          return (
            <p key={i} className="mb-2 pl-1 flex items-start gap-2 text-red-400/90">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{line.replace('🔴 ', '')}</span>
            </p>
          );
        if (line.trim() === '') return <div key={i} className="h-2" />;
        return (
          <p key={i} className="mb-2.5 leading-relaxed">
            {line.split('**').map((part, j) =>
              j % 2 === 1 ? <strong key={j} className="text-foreground font-semibold">{part}</strong> : part
            )}
          </p>
        );
      })}
    </div>
  );
};

export default LessonContent;
