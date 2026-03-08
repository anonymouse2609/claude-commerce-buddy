import { useState } from 'react';
import { Subject, SUBJECT_LABELS } from '@/types';
import { getChaptersBySubject } from '@/lib/syllabus-data';
import { streamAI } from '@/lib/ai';
import { savePaper, getSavedPapers } from '@/lib/store';
import { Loader2, Printer, Save, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function SamplePaper() {
  const [subject, setSubject] = useState<Subject>('accountancy');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');
  const [marks, setMarks] = useState(80);
  const [content, setContent] = useState('');
  const [answerKey, setAnswerKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [saved, setSaved] = useState(false);

  const chapters = getChaptersBySubject(subject);
  const allSelected = selectedChapters.length === 0;

  const handleGenerate = async () => {
    setContent('');
    setAnswerKey('');
    setShowAnswers(false);
    setSaved(false);
    setLoading(true);

    const chapNames = allSelected
      ? 'Full Syllabus'
      : chapters.filter(c => selectedChapters.includes(c.id)).map(c => c.name).join(', ');

    try {
      await streamAI({
        type: 'sample-paper',
        messages: [{
          role: 'user',
          content: `Generate a Class 12 ${SUBJECT_LABELS[subject]} sample paper covering ${chapNames} for ${marks} marks at ${difficulty} difficulty following CBSE 2024-25 board format with sections A (MCQs, 1 mark each), B (Short answer, 3-4 marks), C (Long answer, 6-8 marks) and D (Case study questions). Include proper header with subject name, time allowed (3 hours), maximum marks (${marks}), and general instructions.`,
        }],
        onDelta: (text) => setContent(prev => prev + text),
        onDone: () => setLoading(false),
      });
    } catch (e: any) {
      setContent(`Error: ${e.message}`);
      setLoading(false);
    }
  };

  const handleShowAnswers = async () => {
    setLoadingAnswers(true);
    setAnswerKey('');
    try {
      await streamAI({
        type: 'answer-key',
        messages: [
          { role: 'user', content: `Here is a CBSE sample paper:\n\n${content}\n\nGenerate a detailed answer key with step-by-step solutions and marking scheme for every question.` },
        ],
        onDelta: (text) => setAnswerKey(prev => prev + text),
        onDone: () => { setLoadingAnswers(false); setShowAnswers(true); },
      });
    } catch (e: any) {
      setAnswerKey(`Error: ${e.message}`);
      setLoadingAnswers(false);
    }
  };

  const handleSave = () => {
    savePaper({
      id: Date.now().toString(),
      subject,
      chapters: allSelected ? ['Full Syllabus'] : selectedChapters,
      difficulty,
      marks,
      content,
      answerKey: answerKey || undefined,
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
          {loading ? 'Generating...' : 'Generate Sample Paper'}
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
            {!showAnswers && !loadingAnswers && (
              <button onClick={handleShowAnswers} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent">
                <Eye className="h-4 w-4" /> Show Answer Key
              </button>
            )}
            {loadingAnswers && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Generating answers...
              </span>
            )}
          </div>
          <div className="p-6 print-content prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
          {answerKey && (
            <div className="border-t border-border p-6 print-content prose prose-sm max-w-none dark:prose-invert">
              <h2>Answer Key</h2>
              <ReactMarkdown>{answerKey}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
