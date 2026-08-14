import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

// Keys to sync
const SYNC_KEYS = [
  'enigma_machine_config',
  'enigma_battery_level',
  'enigma_battery_mode',
  'enigma_sender_callsign',
  'enigma_machine_logs',
  'morse_trainer_state',
  'radio_state'
];

export function useSyncState() {
  const { user } = useAuth();
  const isRestoring = useRef(false);

  // Restore state from server
  const restoreState = useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch('/api/auth/user/state', { credentials: 'include' });
      if (!res.ok) return;
      
      const state = await res.json();
      
      isRestoring.current = true;
      let changed = false;
      for (const key of SYNC_KEYS) {
        if (state[key] !== undefined) {
          if (localStorage.getItem(key) !== state[key]) {
            localStorage.setItem(key, state[key]);
            changed = true;
          }
        }
      }
      
      // Dispatch storage event to update other components using localStorage
      if (changed) {
        window.dispatchEvent(new Event('storage'));
      }
      
      setTimeout(() => { isRestoring.current = false; }, 1000);
    } catch (e) {
      console.error('Failed to restore state', e);
    }
  }, [user]);

  // Save state to server
  const saveState = useCallback(async () => {
    if (!user || isRestoring.current) return;

    try {
      const state: Record<string, string> = {};
      for (const key of SYNC_KEYS) {
        const val = localStorage.getItem(key);
        if (val !== null) state[key] = val;
      }
      
      await fetch('/api/auth/user/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(state)
      });
    } catch (e) {
      console.error('Failed to sync state', e);
    }
  }, [user]);

  // Initial restore when user logs in
  useEffect(() => {
    if (user) {
      restoreState();
    }
  }, [user, restoreState]);

  // Watch for changes in localStorage
  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;

    const handleStorageChange = (e: StorageEvent | Event) => {
      if (isRestoring.current) return;
      
      // If it's a specific storage event, check if it's one of our keys
      if (e instanceof StorageEvent && e.key && !SYNC_KEYS.includes(e.key)) {
        return;
      }

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveState();
      }, 2000); // Debounce saves
    };

    // The 'storage' event only fires when other tabs change localStorage.
    // To detect changes in the SAME tab, we need to monkey-patch setItem, 
    // or components must dispatch a custom event.
    // For simplicity, let's monkey-patch setItem to dispatch an event.
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, [key, value]);
      if (SYNC_KEYS.includes(key)) {
        window.dispatchEvent(new Event('local-storage-change'));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-change', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-change', handleStorageChange);
      localStorage.setItem = originalSetItem;
      clearTimeout(timeoutId);
    };
  }, [user, saveState]);
}
