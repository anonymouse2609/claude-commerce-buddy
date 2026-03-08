import { useState } from 'react';
import { Subject, SUBJECT_LABELS } from '@/types';
import { getChaptersBySubject } from '@/lib/syllabus-data';
import { streamAI } from '@/lib/ai';
import { saveNotes } from '@/lib/store';
import { Loader2, Printer, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function RevisionNotes() {
  const [subject, setSubject] = useState<Subject>('accountancy');
  const [chapter, setChapter] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const chapters = getChaptersBySubject(subject);

  const handleGenerate = async () => {
    if (!chapter) return;
    setContent('');
    setSaved(false);
    setLoading(true);

    const chapterName = chapters.find(c => c.id === chapter)?.name || chapter;

    try {
      await streamAI({
        type: 'revision-notes',
        messages: [{
          role: 'user',
          content: `Create revision notes for Class 12 ${SUBJECT_LABELS[subject]} chapter: "${chapterName}". Include: chapter overview (3-4 lines), key concepts as bullet points, important definitions (highlighted with **bold**), formulas and their explanations (for Accountancy and Economics), common exam mistakes to avoid, PYQ trend analysis (what types of questions this chapter typically produces), and 5 most likely exam questions from this chapter. Make notes concise, printable, and CBSE exam focused.`,
        }],
        onDelta: (text) => setContent(prev => prev + text),
        onDone: () => setLoading(false),
      });
    } catch (e: any) {
      setContent(`Error: ${e.message}`);
      setLoading(false);
    }
  };

  const handleSave = () => {
    saveNotes({
      id: Date.now().toString(),
      subject,
      chapter: chapters.find(c => c.id === chapter)?.name || chapter,
      content,
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

      {content && (
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center gap-2 p-4 border-b border-border no-print">
            {!saved && (
              <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent">
                <Save className="h-4 w-4" /> Save
              </button>
            )}
            {saved && <span className="text-sm text-success font-medium">✓ Saved</span>}
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent">
              <Printer className="h-4 w-4" /> Print
            </button>
          </div>
          <div className="p-6 print-content prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
