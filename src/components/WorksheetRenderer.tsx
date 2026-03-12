import { useState } from 'react';
import { sanitizeText } from '@/lib/sanitize';
import { Subject } from '@/types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface WorksheetQuestion {
  number: number;
  text: string;
  marks: number;
  word_limit?: string;
  hint?: string;
  options?: string[];
  answer?: string;
  explanation?: string;
}

interface WorksheetSection {
  name: string;
  instruction?: string;
  marks_each?: number;
  questions: WorksheetQuestion[];
}

export interface WorksheetData {
  subject: string;
  chapter: string;
  total_marks?: number;
  total_questions?: number;
  sections: WorksheetSection[];
}

interface Props {
  data: WorksheetData;
  subject: Subject;
  showAnswers: boolean;
}

const subjectColorClass: Record<Subject, string> = {
  accountancy: 'bg-[hsl(var(--subject-accountancy))]',
  business: 'bg-[hsl(var(--subject-business))]',
  economics: 'bg-[hsl(var(--subject-economics))]',
  english: 'bg-[hsl(var(--subject-english))]',
  marketing: 'bg-[hsl(var(--subject-marketing))]',
  applied_math: 'bg-[hsl(var(--subject-applied-math))]',
};

const subjectBorderClass: Record<Subject, string> = {
  accountancy: 'border-[hsl(var(--subject-accountancy))]',
  business: 'border-[hsl(var(--subject-business))]',
  economics: 'border-[hsl(var(--subject-economics))]',
  english: 'border-[hsl(var(--subject-english))]',
  marketing: 'border-[hsl(var(--subject-marketing))]',
  applied_math: 'border-[hsl(var(--subject-applied-math))]',
};

export default function WorksheetRenderer({ data, subject, showAnswers }: Props) {
  const [expandedAnswers, setExpandedAnswers] = useState<Record<number, boolean>>({});

  const totalMarks = data.total_marks || data.sections.reduce((sum, sec) => sec.questions.reduce((s, q) => s + q.marks, sum), 0);
  const totalQuestions = data.total_questions || data.sections.reduce((sum, sec) => sum + sec.questions.length, 0);

  const toggleAnswer = (qNum: number) => {
    setExpandedAnswers(prev => ({ ...prev, [qNum]: !prev[qNum] }));
  };

  return (
    <div className="space-y-6 print-content">
      {/* Worksheet Header */}
      <div className={`rounded-xl border-2 ${subjectBorderClass[subject]} overflow-hidden`}>
        <div className={`${subjectColorClass[subject]} text-white px-6 py-4 text-center`}>
          <p className="text-sm font-medium opacity-90">CBSE Class XII — Chapter Worksheet</p>
          <h2 className="text-xl font-bold mt-1">{sanitizeText(data.subject)} — {sanitizeText(data.chapter)}</h2>
        </div>
        <div className="bg-card px-6 py-3 flex justify-between text-sm font-medium">
          <span>📝 Total Questions: {totalQuestions}</span>
          <span>📊 Total Marks: {totalMarks}</span>
        </div>
      </div>

      {/* Sections */}
      {data.sections.map((section, sIdx) => (
        <div key={sIdx} className="rounded-xl border border-border overflow-hidden">
          <div className={`${subjectColorClass[subject]} text-white px-5 py-3`}>
            <h3 className="font-bold text-base">{sanitizeText(section.name)}</h3>
            {section.instruction && (
              <p className="text-sm opacity-90 mt-0.5">{sanitizeText(section.instruction)}</p>
            )}
          </div>

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
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {q.word_limit && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {q.word_limit}
                          </span>
                        )}
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                          [{q.marks} {q.marks === 1 ? 'mark' : 'marks'}]
                        </span>
                      </div>
                    </div>

                    {/* Hint */}
                    {q.hint && (
                      <p className="text-xs text-muted-foreground mt-2 italic">💡 Hint: {sanitizeText(q.hint)}</p>
                    )}

                    {/* MCQ Options */}
                    {q.options && q.options.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {q.options.map((opt, oIdx) => (
                          <label
                            key={oIdx}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm hover:bg-muted/50"
                          >
                            <input type="radio" name={`ws-q-${q.number}`} className="accent-primary" />
                            <span>{sanitizeText(opt)}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Answer toggle */}
                    {q.answer && (
                      <div className="mt-3">
                        {showAnswers || expandedAnswers[q.number] ? (
                          <div>
                            <button
                              onClick={() => toggleAnswer(q.number)}
                              className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-2 hover:text-foreground"
                            >
                              <ChevronUp className="h-3 w-3" /> Hide Answer
                            </button>
                            <div className="p-3 rounded-lg bg-[hsl(var(--success)/0.1)] border border-[hsl(var(--success)/0.3)]">
                              <p className="text-xs font-semibold text-[hsl(var(--success))] mb-1">✅ Model Answer</p>
                              <p className="text-sm whitespace-pre-wrap">{sanitizeText(q.answer)}</p>
                              {q.explanation && (
                                <p className="text-xs text-muted-foreground mt-2 italic">📖 {sanitizeText(q.explanation)}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleAnswer(q.number)}
                            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            <ChevronDown className="h-3 w-3" /> Show Answer
                          </button>
                        )}
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
