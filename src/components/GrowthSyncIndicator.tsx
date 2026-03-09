import { useState, useEffect } from 'react';
import { Sprout, X, ExternalLink, Settings2, Check } from 'lucide-react';
import { getPendingSyncEvents, markAllSynced, getGrowthUrl, setGrowthUrl, type GrowthEvent } from '@/lib/growth-sync';

export default function GrowthSyncIndicator() {
  const [pending, setPending] = useState<GrowthEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(getGrowthUrl());
  const [urlSaved, setUrlSaved] = useState(false);

  useEffect(() => {
    const refresh = () => setPending(getPendingSyncEvents());
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, []);

  if (pending.length === 0 && !open) return null;

  const handleSaveUrl = () => {
    setGrowthUrl(urlInput);
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2000);
  };

  const handleOpenGrowth = () => {
    const url = getGrowthUrl();
    if (url) {
      markAllSynced();
      setPending([]);
      window.open(url, '_blank');
    } else {
      setSettingsOpen(true);
    }
  };

  return (
    <>
      {/* Floating badge */}
      {!open && pending.length > 0 && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] shadow-lg hover:opacity-90 transition-all text-sm font-medium animate-fade-in"
        >
          <Sprout className="h-4 w-4" />
          {pending.length} {pending.length === 1 ? 'activity' : 'activities'} ready to sync with Growth 🌱
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-h-[70vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-[hsl(var(--success))]" />
              <span className="font-semibold text-sm">Growth Sync</span>
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{pending.length} pending</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setSettingsOpen(!settingsOpen)} className="p-1.5 rounded-lg hover:bg-accent">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-accent">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {settingsOpen && (
            <div className="px-4 py-3 border-b border-border bg-muted/50">
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Growth App URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://your-growth-app.lovable.app"
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
                />
                <button onClick={handleSaveUrl} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                  {urlSaved ? <Check className="h-4 w-4" /> : 'Save'}
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">All synced! 🎉</p>
            ) : (
              pending.slice(0, 20).map(event => (
                <div key={event.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className="mt-0.5 w-2 h-2 rounded-full bg-[hsl(var(--success))] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.activity}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.subject} · {event.chapter}
                      {event.score != null && ` · Score: ${event.score}/${event.totalQuestions}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-border">
            <button
              onClick={handleOpenGrowth}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] text-sm font-medium hover:opacity-90"
            >
              <ExternalLink className="h-4 w-4" />
              Open Growth App
            </button>
          </div>
        </div>
      )}
    </>
  );
}
