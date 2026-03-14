import { supabase } from '@/integrations/supabase/client';

let currentUserId: string | null = null;
let syncEnabled = false;
let suppressSync = false;

const originalSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function (key: string, value: string) {
  originalSetItem.apply(this, [key, value]);

  if (suppressSync) return;
  if (!syncEnabled || !currentUserId) return;
  if (key.startsWith('supabase.') || key.startsWith('sb-')) return;

  // Fire-and-forget syncing.
  syncLocalStorageKey(currentUserId, key, value).catch(() => {
    // ignore sync failure
  });
};

export function initLocalStorageSync(userId: string | null) {
  currentUserId = userId;
  syncEnabled = Boolean(userId);
}

export function clearLocalStorageSync() {
  currentUserId = null;
  syncEnabled = false;
}

export function getLocalStorageItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setLocalStorageItem(key: string, value: unknown, options?: { sync?: boolean }) {
  const shouldSync = options?.sync ?? true;
  try {
    if (!shouldSync) {
      suppressSync = true;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  } finally {
    if (!shouldSync) {
      suppressSync = false;
    }
  }
}

async function syncLocalStorageKey(userId: string, key: string, value: unknown) {
  const dataValue = JSON.stringify(value);
  await supabase
    .from('user_data')
    .upsert(
      {
        user_id: userId,
        data_key: key,
        data_value: dataValue,
        updated_at: new Date().toISOString(),
      },
      { onConflict: ['user_id', 'data_key'], returning: 'minimal' },
    );
}

export async function restoreLocalStorageFromSupabase(userId: string) {
  const { data, error } = await supabase
    .from('user_data')
    .select('data_key, data_value')
    .eq('user_id', userId);

  if (error) return;

  for (const row of data ?? []) {
    if (!row?.data_key) continue;
    try {
      setLocalStorageItem(row.data_key, row.data_value ?? '', { sync: false });
    } catch {
      // ignore
    }
  }
}

export async function syncAllLocalStorageToSupabase(userId: string) {
  const entries: { user_id: string; data_key: string; data_value: string; updated_at: string }[] = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Avoid storing Supabase auth/session keys in user_data
    if (key.startsWith('supabase.') || key.startsWith('sb-')) continue;

    const value = localStorage.getItem(key);
    if (value == null) continue;

    entries.push({
      user_id: userId,
      data_key: key,
      data_value: value,
      updated_at: new Date().toISOString(),
    });
  }

  if (entries.length === 0) return;

  await supabase
    .from('user_data')
    .upsert(entries, { onConflict: ['user_id', 'data_key'], returning: 'minimal' });
}
