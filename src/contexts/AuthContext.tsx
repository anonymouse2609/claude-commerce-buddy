import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  syncDataToSupabase: () => Promise<void>;
  loadDataFromSupabase: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const syncDataToSupabase = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const dataToSync: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.includes('auth-token') && key.startsWith('cbse-')) {
        try { dataToSync[key] = JSON.parse(localStorage.getItem(key)!); }
        catch { dataToSync[key] = localStorage.getItem(key); }
      }
    }
    await Promise.all(Object.entries(dataToSync).map(([key, value]) =>
      supabase.from('user_data').upsert({ user_id: user.id, data_key: key, data_value: value, updated_at: new Date().toISOString() })
    ));
  };

  const loadDataFromSupabase = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('user_data').select('data_key, data_value').eq('user_id', user.id);
    if (error || !data) return;
    data.forEach(({ data_key, data_value }) => {
      localStorage.setItem(data_key, typeof data_value === 'string' ? data_value : JSON.stringify(data_value));
    });
    window.location.reload();
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setUser(session?.user ?? null); setLoading(false);
      if (session?.user) loadDataFromSupabase();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session); setUser(session?.user ?? null); setLoading(false);
      if (event === 'SIGNED_IN' && session?.user) { await loadDataFromSupabase(); await syncDataToSupabase(); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };
  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, syncDataToSupabase, loadDataFromSupabase }}>
      {children}
    </AuthContext.Provider>
  );
};
