import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Subject, SUBJECT_LABELS, SUBJECT_ICONS, ChapterStatus } from '@/types';
import { getChaptersBySubject } from '@/lib/syllabus-data';
import { getChapterProgress, setChapterStatus } from '@/lib/store';
import { Check, Circle, Clock, AlertTriangle } from 'lucide-react';

const statusConfig: Record<ChapterStatus, { label: string; icon: typeof Check; color: string }> = {
  'not-started': { label: 'Not Started', icon: Circle, color: 'text-muted-foreground' },
  'in-progress': { label: 'In Progress', icon: Clock, color: 'text-subject-english' },
  'completed': { label: 'Completed', icon: Check, color: 'text-success' },
  'needs-revision': { label: 'Needs Revision', icon: AlertTriangle, color: 'text-destructive' },
};

const statuses: ChapterStatus[] = ['not-started', 'in-progress', 'completed', 'needs-revision'];

export default function SyllabusTracker() {
  const [searchParams] = useSearchParams();
  const initialSubject = (searchParams.get('subject') as Subject) || 'accountancy';
  const [selectedSubject, setSelectedSubject] = useState<Subject>(initialSubject);
  const [progress, setProgress] = useState(getChapterProgress());

  const subjects: Subject[] = ['accountancy', 'business', 'economics', 'english', 'marketing'];
  const chapters = useMemo(() => getChaptersBySubject(selectedSubject), [selectedSubject]);

  const getStatus = (chapterId: string): ChapterStatus => {
    return progress.find(p => p.chapterId === chapterId)?.status || 'not-started';
  };

  const handleStatusChange = (chapterId: string, status: ChapterStatus) => {
    setChapterStatus(chapterId, status);
    setProgress(getChapterProgress());
  };

  const completed = chapters.filter(ch => getStatus(ch.id) === 'completed').length;
  const pct = chapters.length ? Math.round((completed / chapters.length) * 100) : 0;

  // Group chapters by unit
  const grouped = chapters.reduce((acc, ch) => {
    const unit = ch.unit || 'General';
    if (!acc[unit]) acc[unit] = [];
    acc[unit].push(ch);
    return acc;
  }, {} as Record<string, typeof chapters>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">📋 Syllabus Tracker</h1>
        <p className="text-muted-foreground mt-1">Track your progress across all subjects</p>
      </div>

      {/* Subject tabs */}
      <div className="flex flex-wrap gap-2">
        {subjects.map(s => (
          <button
            key={s}
            onClick={() => setSelectedSubject(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedSubject === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {SUBJECT_ICONS[s]} {SUBJECT_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex justify-between text-sm mb-2">
          <span>{completed}/{chapters.length} chapters completed</span>
          <span className="font-semibold">{pct}%</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-success rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Chapters by unit */}
      {Object.entries(grouped).map(([unit, chs]) => (
        <div key={unit}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{unit}</h3>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {chs.map(ch => {
              const status = getStatus(ch.id);
              const cfg = statusConfig[status];
              return (
                <div key={ch.id} className="px-4 py-3 flex items-center gap-3">
                  <cfg.icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ch.name}</p>
                    {ch.weightage && (
                      <p className="text-xs text-muted-foreground">Weightage: ~{ch.weightage} marks</p>
                    )}
                  </div>
                  <select
                    value={status}
                    onChange={e => handleStatusChange(ch.id, e.target.value as ChapterStatus)}
                    className="text-xs rounded-md border border-input bg-background px-2 py-1"
                  >
                    {statuses.map(s => (
                      <option key={s} value={s}>{statusConfig[s].label}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
