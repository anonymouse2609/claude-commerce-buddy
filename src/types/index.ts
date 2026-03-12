export type Subject = 'accountancy' | 'business' | 'economics' | 'english' | 'marketing' | 'applied_math';

export type ChapterStatus = 'not-started' | 'in-progress' | 'completed' | 'needs-revision';

export interface Chapter {
  id: string;
  name: string;
  subject: Subject;
  unit?: string;
  weightage?: number;
}

export interface ChapterProgress {
  chapterId: string;
  status: ChapterStatus;
  lastUpdated: string;
}

export interface SavedPaper {
  id: string;
  subject: Subject;
  chapters: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  marks: number;
  content: string;
  answerKey?: string;
  createdAt: string;
  attempted: boolean;
}

export interface SavedWorksheet {
  id: string;
  subject: Subject;
  chapter: string;
  questionTypes: string[];
  content: string;
  answerKey?: string;
  createdAt: string;
}

export interface SavedNotes {
  id: string;
  subject: Subject;
  chapter: string;
  content: string;
  createdAt: string;
}

export interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  type: 'regular' | 'assertion-reason';
}

export interface MCQSession {
  id: string;
  subject: Subject;
  chapter: string;
  questions: MCQQuestion[];
  answers: Record<number, number>;
  score: number;
  total: number;
  createdAt: string;
}

export interface MCQPerformance {
  chapterId: string;
  subject: Subject;
  attempts: { date: string; score: number; total: number }[];
}

export interface StudySchedule {
  examDate: string;
  weeklyPlan: { week: number; chapters: string[]; subject: Subject }[];
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  accountancy: 'Accountancy',
  business: 'Business Studies',
  economics: 'Economics',
  english: 'English',
  marketing: 'Marketing',
  applied_math: 'Applied Mathematics',
};

export const SUBJECT_ICONS: Record<Subject, string> = {
  accountancy: '📊',
  business: '💼',
  economics: '📈',
  english: '📚',
  marketing: '🎯',
  applied_math: '🧮',
};
