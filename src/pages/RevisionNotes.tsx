import { useState } from 'react';
import { Subject, SUBJECT_LABELS } from '@/types';
import { getChaptersBySubject } from '@/lib/syllabus-data';
import { generateJSON } from '@/lib/ai';
import { saveNotes } from '@/lib/store';
import { syncToGrowth, addToRevision } from '@/lib/growth-sync';
import { Loader2, Printer, Save, Sprout } from 'lucide-react';
import RevisionNotesRenderer, { NotesData } from '@/components/RevisionNotesRenderer';
import { printRevisionNotes } from '@/lib/print';

export default function RevisionNotes() {
  const [subject, setSubject] = useState<Subject>('accountancy');
  const [chapter, setChapter] = useState('');
  const [notes, setNotes] = useState<NotesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const chapters = getChaptersBySubject(subject);

  const handlePrint = () => {
    if (notes) printRevisionNotes(notes, subject);
  };


  const handleGenerate = async () => {
    if (!chapter) return;
    setNotes(null);
    setSaved(false);
    setError('');
    setLoading(true);

    const chapterName = chapters.find(c => c.id === chapter)?.name || chapter;

    try {
      const data = await generateJSON('revision-notes', [{
        role: 'user',
        content: `Create revision notes for Class 12 ${SUBJECT_LABELS[subject]} chapter: "${chapterName}". Include all sections: overview, key concepts, definitions, formulas (if applicable for ${subject}), common mistakes, PYQ trends, and 5 most likely exam questions.`,
      }]);
      setNotes(data);
      syncToGrowth({
        type: 'notes_viewed',
        subject: SUBJECT_LABELS[subject],
        chapter: chapterName,
        activity: 'Revision Notes',
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!notes) return;
    saveNotes({
      id: Date.now().toString(),
      subject,
      chapter: chapters.find(c => c.id === chapter)?.name || chapter,
      content: JSON.stringify(notes),
      createdAt: new Date().toISOString(),
    });
    setSaved(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">🗒️ Revision Notes</h1>
        <p className="text-muted-foreground mt-1">AI-generated concise revision notes per chapter</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Subject</label>
            <select value={subject} onChange={e => { setSubject(e.target.value as Subject); setChapter(''); }} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {(['accountancy', 'business', 'economics', 'english', 'marketing'] as Subject[]).map(s => (
                <option key={s} value={s}>{SUBJECT_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Chapter</label>
            <select value={chapter} onChange={e => setChapter(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select chapter...</option>
              {chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !chapter}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Generating...' : 'Generate Notes'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[hsl(var(--destructive)/0.3)] bg-[hsl(var(--destructive)/0.05)] p-4 text-sm text-[hsl(var(--destructive))]">
          {error}
        </div>
      )}

      {notes && (
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center gap-2 p-4 border-b border-border no-print">
            {!saved && (
              <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent">
                <Save className="h-4 w-4" /> Save
              </button>
            )}
            {saved && <span className="text-sm font-medium text-[hsl(var(--success))]">✓ Saved</span>}
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent">
              <Printer className="h-4 w-4" /> Print
            </button>
          </div>
          <div className="p-6">
            <RevisionNotesRenderer notes={notes} subject={subject} />
          </div>
        </div>
      )}
    </div>
  );
}
