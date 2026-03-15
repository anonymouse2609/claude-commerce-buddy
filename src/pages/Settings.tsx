import { Button } from '@/components/ui/button';
import { clearLibrary } from '@/lib/store';

export default function Settings() {
  const handleClearLibrary = () => {
    if (confirm('Are you sure you want to clear your entire library? This action cannot be undone.')) {
      clearLibrary();
      alert('Library cleared successfully.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Library Management</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Clear all saved papers, worksheets, and notes from your library.
        </p>
        <div className="mt-4">
          <Button variant="destructive" onClick={handleClearLibrary}>
            Clear Library
          </Button>
        </div>
      </div>
    </div>
  );
}
