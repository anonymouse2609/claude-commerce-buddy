import { useState } from 'react';
import { Subject, SUBJECT_LABELS } from '@/types';
import { getChaptersBySubject } from '@/lib/syllabus-data';
import { streamAI } from '@/lib/ai';
import { saveWorksheet } from '@/lib/store';
import { Loader2, Printer, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const questionTypes = [
  'Definitions', 'Short Answer', 'Long Answer', 'Numerical Problems',
  'Match the Following', 'Fill in the Blanks', 'True/False with Reasoning',
  'Case Study', 'Diagram Based',
];

export default function ChapterWorksheet() {
  const [subject, setSubject] = useState<Subject>('accountancy');
  const [chapter, setChapter] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['Short Answer', 'Definitions']);
  const [numQuestions, setNumQuestions] = useState(10);
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
        type: 'worksheet',
        messages: [{
          role: 'user',
          content: `Generate a focused worksheet for Class 12 ${SUBJECT_LABELS[subject]}, chapter: "${chapterName}". Include ${numQuestions} questions of these types: ${selectedTypes.join(', ')}. ${subject === 'accountancy' ? 'Include proper journal entries, ledger problems, balance sheet problems with realistic numbers where applicable.' : ''} ${subject === 'economics' ? 'Include diagram-based questions and numerical problems where applicable.' : ''} At the end, provide a complete answer key.`,
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
    saveWorksheet({
      id: Date.now().toString(),
      subject,
      chapter: chapters.find(c => c.id === chapter)?.name || chapter,
      questionTypes: selectedTypes,
      content,
      createdAt: new Date().toISOString(),
    });
    setSaved(true);
  };

  const toggleType = (t: string) => {
    setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">📄 Chapter Worksheet</h1>
        <p className="text-muted-foreground mt-1">Generate focused worksheets for any chapter</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div>
            <label className="text-sm font-medium mb-1 block">Number of Questions</label>
            <select value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} questions</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Question Types</label>
          <div className="flex flex-wrap gap-2">
            {questionTypes.map(t => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedTypes.includes(t)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !chapter}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Generating...' : 'Generate Worksheet'}
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
