import { useState } from 'react';
import { Subject, SUBJECT_LABELS, MCQQuestion } from '@/types';
import { getChaptersBySubject } from '@/lib/syllabus-data';
import { generateMCQs } from '@/lib/ai';
import { saveMCQSession, updateMCQPerformance } from '@/lib/store';
import { syncToGrowth, addToRevision } from '@/lib/growth-sync';
import { Loader2, Check, X, RotateCcw, Sprout } from 'lucide-react';

export default function MCQPractice() {
  const [subject, setSubject] = useState<Subject>('accountancy');
  const [chapter, setChapter] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  const chapters = getChaptersBySubject(subject);

  const handleGenerate = async () => {
    if (!chapter) return;
    setLoading(true);
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers({});
    setFinished(false);
    setShowResult(null);

    const chapterName = chapters.find(c => c.id === chapter)?.name || chapter;

    try {
      const raw = await generateMCQs([{
        role: 'user',
        content: `Generate ${numQuestions} MCQs for Class 12 ${SUBJECT_LABELS[subject]} chapter "${chapterName}". Mix regular MCQs and assertion-reason format. Return ONLY a JSON array.`,
      }]);

      // Extract JSON from response
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as MCQQuestion[];
        setQuestions(parsed.map((q, i) => ({ ...q, id: i })));
      } else {
        throw new Error("Failed to parse MCQ response");
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (optionIdx: number) => {
    if (showResult !== null) return;
    setAnswers(prev => ({ ...prev, [currentIdx]: optionIdx }));
    setShowResult(optionIdx);
  };

  const handleNext = () => {
    setShowResult(null);
    if (currentIdx >= questions.length - 1) {
      const score = Object.entries(answers).filter(
        ([qIdx, aIdx]) => questions[Number(qIdx)]?.correctAnswer === aIdx
      ).length;

      const chapterName = chapters.find(c => c.id === chapter)?.name || chapter;

      saveMCQSession({
        id: Date.now().toString(),
        subject,
        chapter: chapterName,
        questions,
        answers,
        score,
        total: questions.length,
        createdAt: new Date().toISOString(),
      });

      updateMCQPerformance(chapter, subject, score, questions.length);

      syncToGrowth({
        type: 'mcq_completed',
        subject: SUBJECT_LABELS[subject],
        chapter: chapterName,
        activity: 'MCQ Practice',
        score,
        totalQuestions: questions.length,
        percentage: Math.round((score / questions.length) * 100),
      });

      setFinished(true);
    } else {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const retryWrong = () => {
    const wrongQs = questions.filter((q, i) => answers[i] !== q.correctAnswer);
    setQuestions(wrongQs.map((q, i) => ({ ...q, id: i })));
    setCurrentIdx(0);
    setAnswers({});
    setFinished(false);
    setShowResult(null);
  };

  const score = Object.entries(answers).filter(
    ([qIdx, aIdx]) => questions[Number(qIdx)]?.correctAnswer === aIdx
  ).length;

  const currentQ = questions[currentIdx];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">❓ MCQ Practice</h1>
        <p className="text-muted-foreground mt-1">Practice CBSE pattern MCQs with instant feedback</p>
      </div>

      {questions.length === 0 && !loading && (
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
              <label className="text-sm font-medium mb-1 block">Questions</label>
              <select value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n} questions</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!chapter}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50"
          >
            Start Practice
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-card rounded-xl border border-border p-12 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Generating questions...</p>
        </div>
      )}

      {currentQ && !finished && (
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <span>Score: {score}/{Object.keys(answers).length}</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
          </div>

          {currentQ.type === 'assertion-reason' && (
            <span className="inline-block px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground font-medium">
              Assertion-Reason
            </span>
          )}

          <p className="text-base font-medium whitespace-pre-wrap">{currentQ.question}</p>

          <div className="space-y-2">
            {currentQ.options.map((opt, i) => {
              const isSelected = showResult !== null && answers[currentIdx] === i;
              const isCorrect = i === currentQ.correctAnswer;
              let optionClass = 'bg-secondary hover:bg-accent cursor-pointer';
              if (showResult !== null) {
                if (isCorrect) optionClass = 'bg-success/15 border-success';
                else if (isSelected && !isCorrect) optionClass = 'bg-destructive/15 border-destructive';
                else optionClass = 'bg-secondary opacity-60';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={showResult !== null}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${optionClass}`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                  {showResult !== null && isCorrect && <Check className="inline ml-2 h-4 w-4 text-success" />}
                  {showResult !== null && isSelected && !isCorrect && <X className="inline ml-2 h-4 w-4 text-destructive" />}
                </button>
              );
            })}
          </div>

          {showResult !== null && (
            <div className="bg-muted rounded-lg p-3 text-sm">
              <strong>Explanation:</strong> {currentQ.explanation}
            </div>
          )}

          {showResult !== null && (
            <button onClick={handleNext} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90">
              {currentIdx >= questions.length - 1 ? 'Finish' : 'Next Question'}
            </button>
          )}
        </div>
      )}

      {finished && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-xl font-bold">Results</h2>
          <div className="text-4xl font-bold">{score}/{questions.length}</div>
          <p className="text-muted-foreground">
            {score / questions.length >= 0.8 ? '🎉 Excellent work!' :
              score / questions.length >= 0.5 ? '👍 Good effort, keep practicing!' :
                '📚 Needs more practice. Review the chapter and try again.'}
          </p>

          {questions.filter((q, i) => answers[i] !== q.correctAnswer).length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Wrong Answers</h3>
              <div className="space-y-3">
                {questions.filter((q, i) => answers[i] !== q.correctAnswer).map((q, i) => (
                  <div key={i} className="bg-muted rounded-lg p-3 text-sm">
                    <p className="font-medium">{q.question}</p>
                    <p className="text-success mt-1">Correct: {q.options[q.correctAnswer]}</p>
                    <p className="text-muted-foreground mt-0.5">{q.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={retryWrong} disabled={score === questions.length} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent disabled:opacity-50">
              <RotateCcw className="h-4 w-4" /> Retry Wrong Questions
            </button>
            <button onClick={() => { setQuestions([]); setChapter(''); }} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
              New Practice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
