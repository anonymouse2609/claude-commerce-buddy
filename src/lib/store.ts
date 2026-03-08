import { ChapterProgress, SavedPaper, SavedWorksheet, SavedNotes, MCQSession, MCQPerformance } from '@/types';

const KEYS = {
  CHAPTER_PROGRESS: 'cbse-chapter-progress',
  SAVED_PAPERS: 'cbse-saved-papers',
  SAVED_WORKSHEETS: 'cbse-saved-worksheets',
  SAVED_NOTES: 'cbse-saved-notes',
  MCQ_SESSIONS: 'cbse-mcq-sessions',
  MCQ_PERFORMANCE: 'cbse-mcq-performance',
  EXAM_DATE: 'cbse-exam-date',
  DARK_MODE: 'cbse-dark-mode',
};

function get<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch { return fallback; }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Chapter Progress
export function getChapterProgress(): ChapterProgress[] {
  return get(KEYS.CHAPTER_PROGRESS, []);
}

export function setChapterStatus(chapterId: string, status: ChapterProgress['status']) {
  const progress = getChapterProgress();
  const idx = progress.findIndex(p => p.chapterId === chapterId);
  const entry: ChapterProgress = { chapterId, status, lastUpdated: new Date().toISOString() };
  if (idx >= 0) progress[idx] = entry;
  else progress.push(entry);
  set(KEYS.CHAPTER_PROGRESS, progress);
}

// Saved Papers
export function getSavedPapers(): SavedPaper[] {
  return get(KEYS.SAVED_PAPERS, []);
}

export function savePaper(paper: SavedPaper) {
  const papers = getSavedPapers();
  papers.unshift(paper);
  set(KEYS.SAVED_PAPERS, papers);
}

export function deletePaper(id: string) {
  set(KEYS.SAVED_PAPERS, getSavedPapers().filter(p => p.id !== id));
}

// Saved Worksheets
export function getSavedWorksheets(): SavedWorksheet[] {
  return get(KEYS.SAVED_WORKSHEETS, []);
}

export function saveWorksheet(ws: SavedWorksheet) {
  const items = getSavedWorksheets();
  items.unshift(ws);
  set(KEYS.SAVED_WORKSHEETS, items);
}

export function deleteWorksheet(id: string) {
  set(KEYS.SAVED_WORKSHEETS, getSavedWorksheets().filter(w => w.id !== id));
}

// Saved Notes
export function getSavedNotes(): SavedNotes[] {
  return get(KEYS.SAVED_NOTES, []);
}

export function saveNotes(notes: SavedNotes) {
  const items = getSavedNotes();
  items.unshift(notes);
  set(KEYS.SAVED_NOTES, items);
}

export function deleteNotes(id: string) {
  set(KEYS.SAVED_NOTES, getSavedNotes().filter(n => n.id !== id));
}

// MCQ
export function getMCQSessions(): MCQSession[] {
  return get(KEYS.MCQ_SESSIONS, []);
}

export function saveMCQSession(session: MCQSession) {
  const sessions = getMCQSessions();
  sessions.unshift(session);
  set(KEYS.MCQ_SESSIONS, sessions);
}

export function getMCQPerformance(): MCQPerformance[] {
  return get(KEYS.MCQ_PERFORMANCE, []);
}

export function updateMCQPerformance(chapterId: string, subject: string, score: number, total: number) {
  const perfs = getMCQPerformance();
  let perf = perfs.find(p => p.chapterId === chapterId);
  if (!perf) {
    perf = { chapterId, subject: subject as any, attempts: [] };
    perfs.push(perf);
  }
  perf.attempts.push({ date: new Date().toISOString(), score, total });
  set(KEYS.MCQ_PERFORMANCE, perfs);
}

// Exam Date
export function getExamDate(): string | null {
  return localStorage.getItem(KEYS.EXAM_DATE);
}

export function setExamDate(date: string) {
  localStorage.setItem(KEYS.EXAM_DATE, date);
}

// Dark Mode
export function getDarkMode(): boolean {
  return get(KEYS.DARK_MODE, false);
}

export function setDarkMode(dark: boolean) {
  set(KEYS.DARK_MODE, dark);
  document.documentElement.classList.toggle('dark', dark);
}

// Clear library
export function clearLibrary() {
  set(KEYS.SAVED_PAPERS, []);
  set(KEYS.SAVED_WORKSHEETS, []);
  set(KEYS.SAVED_NOTES, []);
  set(KEYS.MCQ_SESSIONS, []);
}
