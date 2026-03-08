import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, TrendingUp, BookOpen, FileText } from 'lucide-react';
import { Subject, SUBJECT_LABELS, SUBJECT_ICONS } from '@/types';
import { syllabusData, getChaptersBySubject } from '@/lib/syllabus-data';
import { getChapterProgress, getExamDate, setExamDate, getSavedPapers, getSavedWorksheets, getSavedNotes } from '@/lib/store';
import { differenceInDays } from 'date-fns';

const subjectColorClasses: Record<Subject, { bg: string; text: string; border: string }> = {
  accountancy: { bg: 'bg-subject-accountancy/10', text: 'text-subject-accountancy', border: 'border-subject-accountancy' },
  business: { bg: 'bg-subject-business/10', text: 'text-subject-business', border: 'border-subject-business' },
  economics: { bg: 'bg-subject-economics/10', text: 'text-subject-economics', border: 'border-subject-economics' },
  english: { bg: 'bg-subject-english/10', text: 'text-subject-english', border: 'border-subject-english' },
  marketing: { bg: 'bg-subject-marketing/10', text: 'text-subject-marketing', border: 'border-subject-marketing' },
};

export default function Dashboard() {
  const [examDate, setExamDateState] = useState(getExamDate() || '');
  const progress = getChapterProgress();
  const papers = getSavedPapers();
  const worksheets = getSavedWorksheets();
  const notes = getSavedNotes();

  const daysLeft = useMemo(() => {
    if (!examDate) return null;
    return differenceInDays(new Date(examDate), new Date());
  }, [examDate]);

  const handleSetExamDate = (date: string) => {
    setExamDateState(date);
    setExamDate(date);
  };

  const getSubjectProgress = (subject: Subject) => {
    const chapters = getChaptersBySubject(subject);
    const completed = chapters.filter(ch => {
      const p = progress.find(pr => pr.chapterId === ch.id);
      return p?.status === 'completed';
    }).length;
    return { completed, total: chapters.length, pct: chapters.length > 0 ? Math.round((completed / chapters.length) * 100) : 0 };
  };

  const subjects: Subject[] = ['accountancy', 'business', 'economics', 'english', 'marketing'];

  const recentItems = [...papers.slice(0, 2).map(p => ({ type: 'Paper', subject: p.subject, date: p.createdAt })),
    ...worksheets.slice(0, 2).map(w => ({ type: 'Worksheet', subject: w.subject, date: w.createdAt })),
    ...notes.slice(0, 2).map(n => ({ type: 'Notes', subject: n.subject, date: n.createdAt })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Welcome back! 👋</h1>
        <p className="text-muted-foreground mt-1">Your CBSE Class 12 Commerce study dashboard</p>
      </div>

      {/* Exam countdown + date picker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">Board Exam Countdown</span>
          </div>
          {daysLeft !== null && daysLeft > 0 ? (
            <div>
              <span className="text-4xl font-bold">{daysLeft}</span>
              <span className="text-muted-foreground ml-2 text-lg">days remaining</span>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Set your exam date to see the countdown</p>
          )}
          <input
            type="date"
            value={examDate}
            onChange={e => handleSetExamDate(e.target.value)}
            className="mt-3 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">Overall Progress</span>
          </div>
          {(() => {
            const total = syllabusData.length;
            const completed = progress.filter(p => p.status === 'completed').length;
            const pct = Math.round((completed / total) * 100);
            return (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{completed}/{total} chapters completed</span>
                  <span className="font-semibold">{pct}%</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Subject Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Subjects</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map(subject => {
            const sp = getSubjectProgress(subject);
            const colors = subjectColorClasses[subject];
            return (
              <Link
                key={subject}
                to={`/syllabus?subject=${subject}`}
                className={`${colors.bg} border-l-4 ${colors.border} rounded-xl p-4 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{SUBJECT_ICONS[subject]}</span>
                  <span className={`font-semibold ${colors.text}`}>{SUBJECT_LABELS[subject]}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{sp.completed}/{sp.total} chapters</span>
                  <span>{sp.pct}%</span>
                </div>
                <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${subject === 'accountancy' ? 'subject-accountancy' : subject === 'business' ? 'subject-business' : subject === 'economics' ? 'subject-economics' : subject === 'english' ? 'subject-english' : 'subject-marketing'}`} style={{ width: `${sp.pct}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Generate Paper', path: '/sample-paper', icon: FileText },
            { label: 'Practice MCQs', path: '/mcq', icon: BookOpen },
            { label: 'Revision Notes', path: '/revision-notes', icon: FileText },
            { label: 'My Library', path: '/library', icon: BookOpen },
          ].map(a => (
            <Link key={a.path} to={a.path} className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition-shadow">
              <a.icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <span className="text-sm font-medium">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {recentItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {recentItems.map((item, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{item.type}</span>
                  <span className="text-muted-foreground ml-2">{SUBJECT_LABELS[item.subject]}</span>
                </div>
                <span className="text-muted-foreground text-xs">{new Date(item.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
