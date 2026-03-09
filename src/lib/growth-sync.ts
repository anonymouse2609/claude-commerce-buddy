import { getMCQPerformance } from '@/lib/store';
import { SUBJECT_LABELS, type Subject } from '@/types';

export interface GrowthEvent {
  id: number;
  timestamp: string;
  type: string;
  subject: string;
  chapter: string;
  activity: string;
  score?: number | null;
  totalQuestions?: number;
  percentage?: number;
  duration?: number | null;
  difficulty?: string | null;
  year?: string;
  marks?: number;
  synced: boolean;
}

const SYNC_KEY = 'growth_sync_data';
const GROWTH_URL_KEY = 'growth_app_url';

export function syncToGrowth(event: Partial<GrowthEvent>) {
  const existing: GrowthEvent[] = JSON.parse(localStorage.getItem(SYNC_KEY) || '[]');
  existing.push({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    type: event.type || 'unknown',
    subject: event.subject || '',
    chapter: event.chapter || '',
    activity: event.activity || '',
    score: event.score ?? null,
    totalQuestions: event.totalQuestions,
    percentage: event.percentage,
    duration: event.duration ?? null,
    difficulty: event.difficulty ?? null,
    year: event.year,
    marks: event.marks,
    synced: false,
  });
  localStorage.setItem(SYNC_KEY, JSON.stringify(existing));
  writeDailySummary();
}

export function getPendingSyncEvents(): GrowthEvent[] {
  const all: GrowthEvent[] = JSON.parse(localStorage.getItem(SYNC_KEY) || '[]');
  return all.filter(e => !e.synced);
}

export function markAllSynced() {
  const all: GrowthEvent[] = JSON.parse(localStorage.getItem(SYNC_KEY) || '[]');
  all.forEach(e => (e.synced = true));
  localStorage.setItem(SYNC_KEY, JSON.stringify(all));
}

export function getGrowthUrl(): string {
  return localStorage.getItem(GROWTH_URL_KEY) || '';
}

export function setGrowthUrl(url: string) {
  localStorage.setItem(GROWTH_URL_KEY, url);
}

export function addToRevision(subject: string, chapter: string, difficulty: string) {
  syncToGrowth({
    type: 'add_to_revision',
    subject,
    chapter,
    activity: 'Revision Scheduler',
    difficulty,
  });
  const growthUrl = getGrowthUrl();
  if (growthUrl) {
    window.open(
      `${growthUrl}?action=add_revision&subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}&difficulty=${encodeURIComponent(difficulty)}`,
      '_blank'
    );
  }
}

// Daily summary
function writeDailySummary() {
  const today = new Date().toISOString().slice(0, 10);
  const all: GrowthEvent[] = JSON.parse(localStorage.getItem(SYNC_KEY) || '[]');
  const todayEvents = all.filter(e => e.timestamp.startsWith(today));

  const subjects = new Set(todayEvents.map(e => e.subject));
  const chapters = new Set(todayEvents.map(e => e.chapter));
  const mcqEvents = todayEvents.filter(e => e.type === 'mcq_completed' && e.percentage != null);
  const totalQuestions = todayEvents.reduce((sum, e) => sum + (e.totalQuestions || 0), 0);
  const avgMcq = mcqEvents.length > 0
    ? Math.round(mcqEvents.reduce((s, e) => s + (e.percentage || 0), 0) / mcqEvents.length)
    : null;

  const summary = {
    date: today,
    totalSubjects: subjects.size,
    totalQuestionsAttempted: totalQuestions,
    averageMCQScore: avgMcq,
    chaptersCovered: Array.from(chapters),
    totalActivities: todayEvents.length,
  };

  localStorage.setItem(`growth_daily_summary_${today}`, JSON.stringify(summary));
}

// Chapter strength analysis
export interface ChapterStrength {
  chapterId: string;
  subject: Subject;
  chapterName: string;
  avgScore: number;
  attempts: number;
  status: 'weak' | 'strong' | 'needs-practice' | 'unknown';
}

export function getChapterStrengths(): ChapterStrength[] {
  const perfs = getMCQPerformance();
  return perfs.map(p => {
    const totalAttempts = p.attempts.length;
    const avg = totalAttempts > 0
      ? Math.round(p.attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / totalAttempts)
      : 0;
    let status: ChapterStrength['status'] = 'unknown';
    if (totalAttempts >= 3 && avg < 60) status = 'weak';
    else if (totalAttempts >= 2 && avg >= 80) status = 'strong';
    else if (totalAttempts >= 1 && avg < 70) status = 'needs-practice';

    return {
      chapterId: p.chapterId,
      subject: p.subject,
      chapterName: p.chapterId, // will be resolved by consumer
      avgScore: avg,
      attempts: totalAttempts,
      status,
    };
  });
}

export function getWeakChapters(): ChapterStrength[] {
  return getChapterStrengths().filter(c => c.status === 'weak' || c.status === 'needs-practice');
}
