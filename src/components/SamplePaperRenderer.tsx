import { useState } from 'react';
import { Subject } from '@/types';
import { sanitizeText } from '@/lib/sanitize';

interface PaperQuestion {
  number: number;
  text: string;
  options?: string[];
  marks: number;
  type: string;
  hasChoice?: boolean;
  orQuestion?: string;
  answer?: string;
}

interface PaperSection {
  name: string;
  subtitle?: string;
  instruction?: string;
  questions: PaperQuestion[];
}

export interface PaperData {
  title: string;
  subject: string;
  class?: string;
  time: string;
  marks: string;
  instructions?: string[];
  sections: PaperSection[];
}

interface Props {
  paper: PaperData;
  subject: Subject;
  showAnswers: boolean;
}

const subjectColorClass: Record<Subject, string> = {
  accountancy: 'bg-[hsl(var(--subject-accountancy))]',
  business: 'bg-[hsl(var(--subject-business))]',
  economics: 'bg-[hsl(var(--subject-economics))]',
  english: 'bg-[hsl(var(--subject-english))]',
  marketing: 'bg-[hsl(var(--subject-marketing))]',
};

const subjectBorderClass: Record<Subject, string> = {
  accountancy: 'border-[hsl(var(--subject-accountancy))]',
  business: 'border-[hsl(var(--subject-business))]',
  economics: 'border-[hsl(var(--subject-economics))]',
  english: 'border-[hsl(var(--subject-english))]',
  marketing: 'border-[hsl(var(--subject-marketing))]',
};

export default function SamplePaperRenderer({ paper, subject, showAnswers }: Props) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  const selectOption = (qNum: number, optIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [qNum]: optIdx }));
  };

  return (
    <div className="space-y-6 print-content">
      {/* Paper Header */}
      <div className={`rounded-xl border-2 ${subjectBorderClass[subject]} overflow-hidden`}>
        <div className={`${subjectColorClass[subject]} text-white px-6 py-4 text-center`}>
          <p className="text-sm font-medium opacity-90">CBSE Board Examination 2024-25</p>
          <h2 className="text-xl font-bold mt-1">{paper.subject} — Class {paper.class || 'XII'}</h2>
        </div>
        <div className="bg-card px-6 py-3 flex justify-between text-sm font-medium">
          <span>⏱ Time Allowed: {paper.time}</span>
          <span>📝 Maximum Marks: {paper.marks}</span>
        </div>
      </div>

      {/* General Instructions */}
      {paper.instructions && paper.instructions.length > 0 && (
        <div className="rounded-xl bg-muted/50 border border-border p-5">
          <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">General Instructions</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            {paper.instructions.map((inst, i) => (
              <li key={i}>{inst}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Sections */}
      {paper.sections.map((section, sIdx) => (
        <div key={sIdx} className="rounded-xl border border-border overflow-hidden">
          <div className={`${subjectColorClass[subject]} text-white px-5 py-3`}>
            <h3 className="font-bold text-base">{section.name}</h3>
            {section.subtitle && <p className="text-sm opacity-90">{section.subtitle}</p>}
          </div>
          {section.instruction && (
            <div className="px-5 py-2 bg-muted/30 border-b border-border text-xs text-muted-foreground italic">
              {section.instruction}
            </div>
          )}
          <div className="divide-y divide-border">
            {section.questions.map((q) => (
              <div key={q.number} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {q.number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{sanitizeText(q.text)}</p>
                      <span className="flex-shrink-0 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                        [{q.marks} {q.marks === 1 ? 'mark' : 'marks'}]
                      </span>
                    </div>

                    {/* MCQ Options */}
                    {q.options && q.options.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {q.options.map((opt, oIdx) => {
                          const letter = String.fromCharCode(97 + oIdx);
                          const isSelected = selectedAnswers[q.number] === oIdx;
                          return (
                            <label
                              key={oIdx}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                                isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q-${q.number}`}
                                checked={isSelected}
                                onChange={() => selectOption(q.number, oIdx)}
                                className="accent-[hsl(var(--subject-accountancy))]"
                              />
                              <span>{letter}) {opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* OR question */}
                    {q.hasChoice && q.orQuestion && (
                      <div className="mt-4">
                        <div className="flex items-center gap-3 my-3">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 py-1 bg-muted rounded-full">OR</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{sanitizeText(q.orQuestion)}</p>
                      </div>
                    )}

                    {/* Answer (when shown) */}
                    {showAnswers && q.answer && (
                      <div className="mt-3 p-3 rounded-lg bg-[hsl(var(--success)/0.1)] border border-[hsl(var(--success)/0.3)]">
                        <p className="text-xs font-semibold text-[hsl(var(--success))] mb-1">✅ Answer</p>
                        <p className="text-sm whitespace-pre-wrap">{q.answer}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
