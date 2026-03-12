import { Subject } from '@/types';
import { sanitizeText } from '@/lib/sanitize';

export interface NotesData {
  chapter: string;
  subject: string;
  overview: string;
  key_concepts: { title: string; explanation: string }[];
  definitions: { term: string; definition: string }[];
  formulas?: { name: string; formula: string; explanation: string }[];
  common_mistakes: string[];
  pyq_trends: string;
  likely_questions: string[];
}

interface Props {
  notes: NotesData;
  subject: Subject;
}

const subjectBg: Record<Subject, string> = {
  accountancy: 'bg-[hsl(var(--subject-accountancy)/0.1)]',
  business: 'bg-[hsl(var(--subject-business)/0.1)]',
  economics: 'bg-[hsl(var(--subject-economics)/0.1)]',
  english: 'bg-[hsl(var(--subject-english)/0.1)]',
  marketing: 'bg-[hsl(var(--subject-marketing)/0.1)]',
  applied_math: 'bg-[hsl(var(--subject-applied-math)/0.1)]',
};

const subjectText: Record<Subject, string> = {
  accountancy: 'text-[hsl(var(--subject-accountancy))]',
  business: 'text-[hsl(var(--subject-business))]',
  economics: 'text-[hsl(var(--subject-economics))]',
  english: 'text-[hsl(var(--subject-english))]',
  marketing: 'text-[hsl(var(--subject-marketing))]',
  applied_math: 'text-[hsl(var(--subject-applied-math))]',
};

const subjectBorder: Record<Subject, string> = {
  accountancy: 'border-[hsl(var(--subject-accountancy)/0.3)]',
  business: 'border-[hsl(var(--subject-business)/0.3)]',
  economics: 'border-[hsl(var(--subject-economics)/0.3)]',
  english: 'border-[hsl(var(--subject-english)/0.3)]',
  marketing: 'border-[hsl(var(--subject-marketing)/0.3)]',
  applied_math: 'border-[hsl(var(--subject-applied-math)/0.3)]',
};

export default function RevisionNotesRenderer({ notes, subject }: Props) {
  return (
    <div className="space-y-6 print-content">
      {/* Chapter Header */}
      <div className={`rounded-xl ${subjectBg[subject]} border ${subjectBorder[subject]} p-6`}>
        <p className={`text-sm font-medium ${subjectText[subject]} uppercase tracking-wide`}>{sanitizeText(notes.subject)}</p>
        <h2 className="text-2xl font-bold mt-1">{sanitizeText(notes.chapter)}</h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{sanitizeText(notes.overview)}</p>
      </div>

      {/* Key Concepts */}
      {notes.key_concepts?.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">📚 Key Concepts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notes.key_concepts.map((c, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 question-card">
                <h4 className={`font-semibold text-sm ${subjectText[subject]}`}>{sanitizeText(c.title)}</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{sanitizeText(c.explanation)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Definitions */}
      {notes.definitions?.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">📖 Important Definitions</h3>
          <div className="rounded-xl border border-border overflow-hidden">
            {notes.definitions.map((d, i) => (
              <div key={i} className={`flex gap-4 px-5 py-3 text-sm ${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}`}>
                <span className={`font-semibold min-w-[140px] ${subjectText[subject]}`}>{sanitizeText(d.term)}</span>
                <span className="text-muted-foreground">{sanitizeText(d.definition)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulas */}
      {notes.formulas && notes.formulas.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">🔢 Formulas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notes.formulas.map((f, i) => (
              <div key={i} className={`rounded-xl border ${subjectBorder[subject]} ${subjectBg[subject]} p-4 question-card`}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{sanitizeText(f.name)}</p>
                <p className="font-mono text-base font-bold mt-1">{sanitizeText(f.formula)}</p>
                <p className="text-xs text-muted-foreground mt-2">{sanitizeText(f.explanation)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Mistakes */}
      {notes.common_mistakes?.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">⚠️ Common Mistakes</h3>
          <div className="space-y-2">
            {notes.common_mistakes.map((m, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-[hsl(var(--destructive)/0.3)] bg-[hsl(var(--destructive)/0.05)] px-4 py-3 question-card">
                <span className="text-[hsl(var(--destructive))] font-bold text-sm mt-0.5">⚠️</span>
                <p className="text-sm">{sanitizeText(m)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PYQ Trends */}
      {notes.pyq_trends && (
        <div className="rounded-xl border border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.05)] p-5 question-card">
          <h3 className="text-base font-bold flex items-center gap-2 mb-2">📊 PYQ Trends</h3>
          <p className="text-sm leading-relaxed">{sanitizeText(notes.pyq_trends)}</p>
        </div>
      )}

      {/* Likely Questions */}
      {notes.likely_questions?.length > 0 && (
        <div className="rounded-xl border border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.05)] p-5 question-card">
          <h3 className="text-base font-bold flex items-center gap-2 mb-3">🎯 Most Likely Exam Questions</h3>
          <ol className="list-decimal list-inside space-y-2">
            {notes.likely_questions.map((q, i) => (
              <li key={i} className="text-sm leading-relaxed">{sanitizeText(q)}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
