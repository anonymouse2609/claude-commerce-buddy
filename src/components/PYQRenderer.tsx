import { useState } from 'react';
import { Subject } from '@/types';
import { sanitizeText } from '@/lib/sanitize';

interface AnswerStep {
  step: number;
  description: string;
  working: string;
  marks: number;
}

interface PYQAnswer {
  steps: AnswerStep[];
  final_answer: string;
}

export interface PYQQuestion {
  number: number;
  marks: number;
  type: string;
  text: string;
  given_data?: string[];
  required?: string;
  options?: string[];
  answer: PYQAnswer | string;
}

export interface PYQData {
  subject: string;
  year: string;
  questions: PYQQuestion[];
}

interface Props {
  data: PYQData;
  subject: Subject;
}

const subjectColor: Record<Subject, string> = {
  accountancy: 'bg-[hsl(var(--subject-accountancy))]',
  business: 'bg-[hsl(var(--subject-business))]',
  economics: 'bg-[hsl(var(--subject-economics))]',
  english: 'bg-[hsl(var(--subject-english))]',
  marketing: 'bg-[hsl(var(--subject-marketing))]',
};

const subjectText: Record<Subject, string> = {
  accountancy: 'text-[hsl(var(--subject-accountancy))]',
  business: 'text-[hsl(var(--subject-business))]',
  economics: 'text-[hsl(var(--subject-economics))]',
  english: 'text-[hsl(var(--subject-english))]',
  marketing: 'text-[hsl(var(--subject-marketing))]',
};

export default function PYQRenderer({ data, subject }: Props) {
  const [shownAnswers, setShownAnswers] = useState<Record<number, boolean>>({});

  const toggleAnswer = (num: number) => {
    setShownAnswers(prev => ({ ...prev, [num]: !prev[num] }));
  };

  return (
    <div className="space-y-6 print-content">
      {/* Header */}
      <div className={`${subjectColor[subject]} text-white rounded-xl px-6 py-4 text-center`}>
        <p className="text-sm font-medium opacity-90">CBSE Board Examination</p>
        <h2 className="text-xl font-bold mt-1">{sanitizeText(data.subject)} — {data.year}</h2>
        <p className="text-sm opacity-80 mt-1">{data.questions.length} Questions</p>
      </div>

      {/* Questions */}
      {data.questions.map((q) => (
        <div key={q.number} className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Question header */}
          <div className="flex items-start gap-3 px-5 py-4">
            <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              {q.number}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{sanitizeText(q.text)}</p>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <span className="text-xs font-medium uppercase text-muted-foreground bg-muted px-2 py-1 rounded">
                    {q.type}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                    [{q.marks} {q.marks === 1 ? 'mark' : 'marks'}]
                  </span>
                </div>
              </div>

              {/* MCQ options */}
              {q.options && q.options.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {q.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-muted/50">
                      <span className="font-medium text-muted-foreground">{String.fromCharCode(97 + i)})</span>
                      <span>{sanitizeText(opt)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Given data */}
              {q.given_data && q.given_data.length > 0 && (
                <div className="mt-3 rounded-lg bg-[hsl(var(--info)/0.05)] border border-[hsl(var(--info)/0.2)] p-3">
                  <p className="text-xs font-semibold text-[hsl(var(--info))] mb-1.5">📋 Given Information</p>
                  <ul className="space-y-1">
                    {q.given_data.map((d, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>{sanitizeText(d)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Required */}
              {q.required && (
                <p className={`mt-3 text-sm font-semibold ${subjectText[subject]}`}>
                  📌 {sanitizeText(q.required)}
                </p>
              )}

              {/* Show/Hide Answer */}
              <button
                onClick={() => toggleAnswer(q.number)}
                className="mt-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors no-print"
              >
                {shownAnswers[q.number] ? '▼ Hide Answer' : '▶ Show Answer'}
              </button>

              {/* Answer */}
              {shownAnswers[q.number] && q.answer && (
                <div className="mt-3 space-y-3">
                  {typeof q.answer === 'string' ? (
                    <div className="p-3 rounded-lg bg-[hsl(var(--success)/0.05)] border border-[hsl(var(--success)/0.2)]">
                      <p className="text-sm whitespace-pre-wrap">{sanitizeText(q.answer)}</p>
                    </div>
                  ) : (
                    <>
                      {/* Steps table */}
                      {q.answer.steps && q.answer.steps.length > 0 && (
                        <div className="rounded-lg border border-border overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="px-3 py-2 text-left font-semibold w-12">Step</th>
                                <th className="px-3 py-2 text-left font-semibold">Description</th>
                                <th className="px-3 py-2 text-left font-semibold">Working</th>
                                <th className="px-3 py-2 text-right font-semibold w-16">Marks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {q.answer.steps.map((step) => (
                                <tr key={step.step}>
                                  <td className="px-3 py-2">
                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                      {step.step}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 font-medium">{sanitizeText(step.description)}</td>
                                  <td className="px-3 py-2">
                                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                      {sanitizeText(step.working)}
                                    </code>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                                      {step.marks}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Final answer */}
                      {q.answer.final_answer && (
                        <div className="rounded-lg bg-[hsl(var(--success)/0.08)] border border-[hsl(var(--success)/0.3)] p-3">
                          <p className="text-xs font-semibold text-[hsl(var(--success))] mb-1">✅ Final Answer</p>
                          <p className="text-sm font-medium">{sanitizeText(q.answer.final_answer)}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
