import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import {
  clearLocalStorageSync,
  initLocalStorageSync,
  restoreLocalStorageFromSupabase,
  syncAllLocalStorageToSupabase,
} from '@/lib/localStorageSync';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function useProvideAuth(): AuthContextValue {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSession = async (session: Session | null) => {
    const nextUser = session?.user ?? null;
    setUser(nextUser);

    if (nextUser) {
      // Ensure localStorage is restored from the server before syncing new changes.
      await restoreLocalStorageFromSupabase(nextUser.id);
      await syncAllLocalStorageToSupabase(nextUser.id);
      initLocalStorageSync(nextUser.id);
    } else {
      clearLocalStorageSync();
    }
  };

  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      await handleSession(data.session ?? null);
      setLoading(false);

      const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
        await handleSession(session);
      });
      unsub = () => subscription?.unsubscribe();
    })();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    if (data.session?.user) {
      await handleSession(data.session);
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      // on sign-up, session may not be immediately available depending on settings
      await handleSession(data.session ?? null);
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    clearLocalStorageSync();
  };

  return useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [user, loading],
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
