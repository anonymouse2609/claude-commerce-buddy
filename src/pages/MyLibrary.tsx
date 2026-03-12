import { useState } from 'react';
import { SUBJECT_LABELS, Subject } from '@/types';
import { getSavedPapers, getSavedWorksheets, getSavedNotes, getMCQSessions, deletePaper, deleteWorksheet, deleteNotes, clearLibrary } from '@/lib/store';
import { Trash2, FileText, StickyNote, PenTool, HelpCircle, Printer } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import RevisionNotesRenderer, { type NotesData } from '@/components/RevisionNotesRenderer';

type Tab = 'papers' | 'worksheets' | 'notes' | 'mcq';

export default function MyLibrary() {
  const [tab, setTab] = useState<Tab>('papers');
  const [viewContent, setViewContent] = useState<string | null>(null);
  const [viewNotes, setViewNotes] = useState<{ notes: NotesData; subject: Subject } | null>(null);
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate(n => n + 1);

  const papers = getSavedPapers();
  const worksheets = getSavedWorksheets();
  const notes = getSavedNotes();
  const mcqSessions = getMCQSessions();

  const tabs: { key: Tab; label: string; icon: typeof FileText; count: number }[] = [
    { key: 'papers', label: 'Papers', icon: FileText, count: papers.length },
    { key: 'worksheets', label: 'Worksheets', icon: PenTool, count: worksheets.length },
    { key: 'notes', label: 'Notes', icon: StickyNote, count: notes.length },
    { key: 'mcq', label: 'MCQ Sessions', icon: HelpCircle, count: mcqSessions.length },
  ];

  if (viewNotes) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={() => setViewNotes(null)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent ml-auto"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 print-content">
          <RevisionNotesRenderer notes={viewNotes.notes} subject={viewNotes.subject} />
        </div>
      </div>
    );
  }

  if (viewContent) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-2 no-print">
          <button onClick={() => setViewContent(null)} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent ml-auto">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 print-content prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{viewContent}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📚 My Library</h1>
          <p className="text-muted-foreground mt-1">All your saved study materials</p>
        </div>
        <button onClick={() => { if (confirm('Clear all saved items?')) { clearLibrary(); refresh(); } }} className="text-xs text-destructive hover:underline">
          Clear All
        </button>
      </div>

      <div className="flex gap-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === 'papers' && (
        <div className="space-y-2">
          {papers.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No saved papers yet</p>}
          {papers.map(p => (
            <div key={p.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
              <div className="cursor-pointer flex-1" onClick={() => setViewContent(p.content + (p.answerKey ? '\n\n---\n\n## Answer Key\n\n' + p.answerKey : ''))}>
                <p className="font-medium text-sm">{SUBJECT_LABELS[p.subject]} — {p.marks} marks — {p.difficulty}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()} • {p.chapters.join(', ')}</p>
              </div>
              <button onClick={() => { deletePaper(p.id); refresh(); }} className="p-2 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'worksheets' && (
        <div className="space-y-2">
          {worksheets.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No saved worksheets yet</p>}
          {worksheets.map(w => (
            <div key={w.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
              <div className="cursor-pointer flex-1" onClick={() => setViewContent(w.content)}>
                <p className="font-medium text-sm">{SUBJECT_LABELS[w.subject]} — {w.chapter}</p>
                <p className="text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()} • {w.questionTypes.join(', ')}</p>
              </div>
              <button onClick={() => { deleteWorksheet(w.id); refresh(); }} className="p-2 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'notes' && (
        <div className="space-y-2">
          {notes.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No saved notes yet</p>}
          {notes.map(n => (
            <div key={n.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
              <div
                className="cursor-pointer flex-1"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(n.content) as NotesData;
                    setViewNotes({ notes: parsed, subject: n.subject });
                  } catch {
                    // Fallback: still never show raw JSON; show a friendly message instead.
                    setViewContent('Unable to open these notes (invalid saved format). Try regenerating and saving again.');
                  }
                }}
              >
                <p className="font-medium text-sm">{SUBJECT_LABELS[n.subject]} — {n.chapter}</p>
                <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => { deleteNotes(n.id); refresh(); }} className="p-2 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'mcq' && (
        <div className="space-y-2">
          {mcqSessions.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No MCQ sessions yet</p>}
          {mcqSessions.map(s => (
            <div key={s.id} className="bg-card rounded-xl border border-border p-4">
              <p className="font-medium text-sm">{SUBJECT_LABELS[s.subject]} — {s.chapter}</p>
              <p className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()} • Score: {s.score}/{s.total} ({Math.round((s.score / s.total) * 100)}%)</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
