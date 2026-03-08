import { useState } from 'react';
import { Subject, SUBJECT_LABELS } from '@/types';
import { getChaptersBySubject } from '@/lib/syllabus-data';
import { generateJSON } from '@/lib/ai';
import { Loader2, Printer, RefreshCw } from 'lucide-react';
import PYQRenderer, { PYQData } from '@/components/PYQRenderer';

const years = ['2024', '2023', '2022', '2021', '2020', '2019', '2018'];

export default function PYQSection() {
  const [subject, setSubject] = useState<Subject>('accountancy');
  const [chapter, setChapter] = useState('');
  const [year, setYear] = useState('2024');
  const [data, setData] = useState<PYQData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chapters = getChaptersBySubject(subject);

  const handleGenerate = async () => {
    if (!chapter) return;
    setData(null);
    setError('');
    setLoading(true);

    const chapterName = chapters.find(c => c.id === chapter)?.name || chapter;

    try {
      const result = await generateJSON('pyq', [{
        role: 'user',
        content: `Generate Previous Year Questions in the exact style and pattern of CBSE Class 12 ${SUBJECT_LABELS[subject]} board exam ${year} for chapter "${chapterName}". Include 6-8 questions of varying marks (1, 3, 4, 6 marks). For numerical questions include given_data array and required field. Include step-by-step answers with marking scheme for each question.`,
      }]);
      setData(result);
    } catch (e: any) {
      setError(e.message || 'Generation failed — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">📜 Previous Year Questions</h1>
        <p className="text-muted-foreground mt-1">Practice CBSE board-style PYQs by year and chapter</p>
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
            <label className="text-sm font-medium mb-1 block">Year</label>
            <select value={year} onChange={e => setYear(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
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
          {loading ? 'Generating...' : 'Generate PYQs'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[hsl(var(--destructive)/0.3)] bg-[hsl(var(--destructive)/0.05)] p-4 flex items-center justify-between">
          <span className="text-sm text-[hsl(var(--destructive))]">{error}</span>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--destructive)/0.1)] text-sm font-medium text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.2)]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {data && (
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center gap-2 p-4 border-b border-border no-print">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent">
              🖨️ Save as PDF / Print
            </button>
          </div>
          <div className="p-6">
            <PYQRenderer data={data} subject={subject} />
          </div>
        </div>
      )}
    </div>
  );
}
