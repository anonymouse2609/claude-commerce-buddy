import { useMemo } from 'react';
import { Subject, SUBJECT_LABELS, SUBJECT_ICONS } from '@/types';
import { getMCQPerformance, getChapterProgress } from '@/lib/store';
import { syllabusData, getChaptersBySubject } from '@/lib/syllabus-data';

export default function Analytics() {
  const performance = getMCQPerformance();
  const progress = getChapterProgress();

  const subjects: Subject[] = ['accountancy', 'business', 'economics', 'english', 'marketing', 'applied_math'];

  const weakChapters = useMemo(() => {
    return performance
      .map(p => {
        const avgScore = p.attempts.length > 0
          ? p.attempts.reduce((sum, a) => sum + (a.score / a.total) * 100, 0) / p.attempts.length
          : 0;
        const chapter = syllabusData.find(c => c.id === p.chapterId);
        return { ...p, avgScore, chapterName: chapter?.name || p.chapterId };
      })
      .sort((a, b) => a.avgScore - b.avgScore);
  }, [performance]);

  const strongChapters = [...weakChapters].reverse().filter(c => c.avgScore >= 80);

  const subjectStats = subjects.map(s => {
    const chapters = getChaptersBySubject(s);
    const completed = chapters.filter(ch => progress.find(p => p.chapterId === ch.id)?.status === 'completed').length;
    const totalAttempts = performance.filter(p => p.subject === s).reduce((sum, p) => sum + p.attempts.length, 0);
    return { subject: s, completed, total: chapters.length, attempts: totalAttempts };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">📊 Performance Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your progress and identify areas for improvement</p>
      </div>

      {/* Subject Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {subjectStats.map(ss => (
          <div key={ss.subject} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{SUBJECT_ICONS[ss.subject]}</span>
              <span className="font-semibold text-sm">{SUBJECT_LABELS[ss.subject]}</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Chapters: {ss.completed}/{ss.total} completed</p>
              <p>MCQ attempts: {ss.attempts}</p>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
              <div className="h-full bg-success rounded-full" style={{ width: `${ss.total > 0 ? (ss.completed / ss.total) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Weak Chapters */}
      {weakChapters.filter(c => c.avgScore < 60).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">⚠️ Needs Improvement</h2>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {weakChapters.filter(c => c.avgScore < 60).slice(0, 5).map(c => (
              <div key={c.chapterId} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{c.chapterName}</p>
                  <p className="text-xs text-muted-foreground">{SUBJECT_LABELS[c.subject]} • {c.attempts.length} attempts</p>
                </div>
                <span className="text-sm font-semibold text-destructive">{Math.round(c.avgScore)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strong Chapters */}
      {strongChapters.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">✅ Strong Areas</h2>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {strongChapters.slice(0, 5).map(c => (
              <div key={c.chapterId} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{c.chapterName}</p>
                  <p className="text-xs text-muted-foreground">{SUBJECT_LABELS[c.subject]} • {c.attempts.length} attempts</p>
                </div>
                <span className="text-sm font-semibold text-success">{Math.round(c.avgScore)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {performance.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">No MCQ data yet. Start practicing to see your analytics!</p>
        </div>
      )}
    </div>
  );
}
