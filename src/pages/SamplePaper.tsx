import { useState, useRef, useCallback } from 'react';
import { Subject, SUBJECT_LABELS } from '@/types';
import { getChaptersBySubject } from '@/lib/syllabus-data';
import { generateSamplePaper, validatePaper } from '@/lib/ai';
import { savePaper } from '@/lib/store';
import { syncToGrowth } from '@/lib/growth-sync';
import { Loader2, Printer, Save, Eye, EyeOff, AlertTriangle, RefreshCw } from 'lucide-react';
import SamplePaperRenderer, { PaperData } from '@/components/SamplePaperRenderer';
import { printSamplePaper } from '@/lib/print';

export default function SamplePaper() {
  const [subject, setSubject] = useState<Subject>('accountancy');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');
  const [marks, setMarks] = useState(80);
  const [paper, setPaper] = useState<PaperData | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [showAnswers, setShowAnswers] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const chapters = getChaptersBySubject(subject);
  const allSelected = selectedChapters.length === 0;

  const chapNames = allSelected
    ? 'Full Syllabus'
    : chapters.filter(c => selectedChapters.includes(c.id)).map(c => c.name).join(', ');

  const handlePrint = () => {
    if (paper) printSamplePaper(paper, subject);
  };

  const handleGenerate = useCallback(async () => {
    setPaper(null);
    setShowAnswers(false);
    setSaved(false);
    setError('');
    setLoading(true);
    setProgressMsg('Starting generation...');

    try {
      const data = await generateSamplePaper(
        subject,
        chapNames,
        marks,
        difficulty,
        setProgressMsg,
      );
      setPaper(data);
      setProgressMsg('');
      syncToGrowth({
        type: 'paper_attempted',
        subject: SUBJECT_LABELS[subject],
        chapter: chapNames,
        activity: 'Sample Paper',
        marks,
      });
    } catch (e: any) {
      setError(e.message || 'Generation failed — please try again.');
      setProgressMsg('');
    } finally {
      setLoading(false);
    }
  }, [subject, chapNames, marks, difficulty]);

  const handleSave = () => {
    if (!paper) return;
    savePaper({
      id: Date.now().toString(),
      subject,
      chapters: allSelected ? ['Full Syllabus'] : selectedChapters,
      difficulty,
      marks,
      content: JSON.stringify(paper),
      createdAt: new Date().toISOString(),
      attempted: false,
    });
    setSaved(true);
  };

  const toggleChapter = (id: string) => {
    setSelectedChapters(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const validation = paper ? validatePaper(paper) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">📝 Sample Paper Generator</h1>
        <p className="text-muted-foreground mt-1">Generate CBSE format sample papers with AI</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Subject</label>
            <select value={subject} onChange={e => { setSubject(e.target.value as Subject); setSelectedChapters([]); }} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {(['accountancy', 'business', 'economics', 'english', 'marketing'] as Subject[]).map(s => (
                <option key={s} value={s}>{SUBJECT_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Total Marks</label>
            <select value={marks} onChange={e => setMarks(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value={40}>40 Marks</option>
              <option value={60}>60 Marks</option>
              <option value={80}>80 Marks</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Chapters (leave unchecked for full syllabus)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
            {chapters.map(ch => (
              <label key={ch.id} className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1 rounded hover:bg-accent">
                <input type="checkbox" checked={selectedChapters.includes(ch.id)} onChange={() => toggleChapter(ch.id)} className="rounded" />
                {ch.name}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? progressMsg || 'Generating...' : 'Generate Sample Paper'}
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

      {paper && (
        <div className="bg-card rounded-xl border border-border">
          {/* Toolbar */}
          <div className="flex items-center gap-2 p-4 border-b border-border no-print flex-wrap">
            {!saved && (
              <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent">
                <Save className="h-4 w-4" /> Save
              </button>
            )}
            {saved && <span className="text-sm font-medium text-[hsl(var(--success))]">✓ Saved</span>}
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent"
            >
              {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showAnswers ? 'Hide Answers' : 'Show Answers'}
            </button>

            {/* Marks summary */}
            {validation && (
              <div className="ml-auto flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">
                  {validation.totalQuestions} questions · {validation.totalMarks} marks
                </span>
                {validation.totalMarks !== marks && (
                  <span className="flex items-center gap-1 text-[hsl(var(--warning))]">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Expected {marks} marks
                  </span>
                )}
                {validation.missing.length > 0 && (
                  <span className="flex items-center gap-1 text-[hsl(var(--warning))]">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Missing Q{validation.missing.join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="p-6">
            <SamplePaperRenderer paper={paper} subject={subject} showAnswers={showAnswers} />
          </div>
        </div>
      )}
    </div>
  );
}
