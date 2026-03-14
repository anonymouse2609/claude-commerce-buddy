import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  FileText,
  PenTool,
  StickyNote,
  HelpCircle,
  Clock,
  BarChart3,
  Library,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';
import { getDarkMode, setDarkMode } from '@/lib/store';
import GrowthSyncIndicator from '@/components/GrowthSyncIndicator';
import { useAuth } from '@/lib/auth';

const navItems = [
  { label: 'Dashboard', path: '/', icon: Home },
  { label: 'Syllabus', path: '/syllabus', icon: BookOpen },
  { label: 'Sample Papers', path: '/sample-paper', icon: FileText },
  { label: 'Worksheets', path: '/worksheet', icon: PenTool },
  { label: 'Revision Notes', path: '/revision-notes', icon: StickyNote },
  { label: 'MCQ Practice', path: '/mcq', icon: HelpCircle },
  { label: 'PYQ Section', path: '/pyq', icon: Clock },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'My Library', path: '/library', icon: Library },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [dark, setDark] = useState(getDarkMode);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    setDarkMode(next);
  };

  const { user } = useAuth();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card fixed h-full z-30">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold">📚 CBSE Study Pro</h1>
          <p className="text-xs text-muted-foreground mt-1">Class 12 Commerce</p>
          {user?.email && (
            <p className="text-xs text-muted-foreground mt-2 truncate">{user.email}</p>
          )}
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                location.pathname === item.path
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={toggleDark}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent w-full"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center px-4 z-40">
        <button onClick={() => setMobileOpen(true)} className="p-2">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold ml-2">📚 CBSE Study Pro</h1>
        <button onClick={toggleDark} className="ml-auto p-2">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border p-3">
            <div className="flex items-center justify-between p-3 mb-2">
              <h1 className="text-lg font-bold">📚 CBSE Study Pro</h1>
              <button onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                  location.pathname === item.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      <GrowthSyncIndicator />
    </div>
  );
}
