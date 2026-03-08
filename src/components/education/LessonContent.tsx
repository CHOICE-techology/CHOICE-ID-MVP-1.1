import React from 'react';

interface LessonContentProps {
  content: string;
}

const LessonContent: React.FC<LessonContentProps> = ({ content }) => {
  return (
    <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
      {content.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h3 key={i} className="text-base font-bold text-foreground mt-6 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full inline-block" />
            {line.replace('### ', '')}
          </h3>;
        if (line.startsWith('```')) return null;
        if (line.startsWith('- '))
          return <li key={i} className="ml-4 mb-1.5 marker:text-primary">{line.replace('- ', '')}</li>;
        if (line.startsWith('| '))
          return <p key={i} className="font-mono text-xs bg-muted/50 border border-border px-3 py-1.5 rounded-lg mb-1">{line}</p>;
        if (line.match(/^[0-9]+\. /))
          return <li key={i} className="ml-4 mb-1.5 list-decimal marker:text-primary marker:font-bold">{line.replace(/^[0-9]+\. /, '')}</li>;
        if (line.startsWith('✅') || line.startsWith('🔴'))
          return <p key={i} className="mb-1.5 pl-1">{line}</p>;
        if (line.trim() === '') return <br key={i} />;
        return (
          <p key={i} className="mb-2">
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
