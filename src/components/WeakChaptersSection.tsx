import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { getChapterStrengths, type ChapterStrength } from '@/lib/growth-sync';
import { getChaptersBySubject } from '@/lib/syllabus-data';
import { SUBJECT_LABELS, type Subject } from '@/types';

export default function WeakChaptersSection() {
  const strengths = getChapterStrengths();
  
  if (strengths.length === 0) return null;

  // Resolve chapter names
  const resolved = strengths.map(s => {
    const chapters = getChaptersBySubject(s.subject);
    const ch = chapters.find(c => c.id === s.chapterId);
    return { ...s, chapterName: ch?.name || s.chapterId };
  });

  const weak = resolved.filter(c => c.status === 'weak' || c.status === 'needs-practice');
  const strong = resolved.filter(c => c.status === 'strong');

  if (weak.length === 0 && strong.length === 0) return null;

  return (
    <div className="space-y-4">
      {weak.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning))]" />
            Your Weak Chapters
          </h2>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {weak.map(ch => (
              <div key={ch.chapterId} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{ch.chapterName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] font-medium">
                      {ch.status === 'weak' ? 'Needs more practice ⚠️' : 'Below average'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {SUBJECT_LABELS[ch.subject]} · Avg: {ch.avgScore}% · {ch.attempts} attempts
                  </p>
                </div>
                <Link
                  to={`/worksheet?subject=${ch.subject}&chapter=${ch.chapterId}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent shrink-0"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Practice
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {strong.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
            Strong Chapters
          </h2>
          <div className="flex flex-wrap gap-2">
            {strong.map(ch => (
              <span key={ch.chapterId} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] text-sm font-medium">
                ✅ {ch.chapterName}
                <span className="text-xs opacity-75">({ch.avgScore}%)</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
