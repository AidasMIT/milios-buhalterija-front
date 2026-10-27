import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ProfileListItem } from '@/api/types';
import { useProfiles } from '@/hooks/use-profiles';

interface ActiveProfileContextValue {
  profiles: ProfileListItem[];
  activeProfile: ProfileListItem | null;
  setActiveProfileId: (id: string) => void;
  isLoading: boolean;
}

const ActiveProfileContext = createContext<ActiveProfileContextValue | undefined>(undefined);
const STORAGE_KEY = 'active-profile-id';

function readStoredId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Which business (IV / MB) the user is working in. The list comes from the API (only profiles the user may see);
 * the choice is remembered in this browser.
 */
export function ActiveProfileProvider({ children }: { children: ReactNode }) {
  const { data: profiles = [], isLoading } = useProfiles();
  const [storedId, setStoredId] = useState<string | null>(readStoredId);

  const value = useMemo<ActiveProfileContextValue>(() => {
    const activeProfile = profiles.find((p) => p.id === storedId) ?? profiles[0] ?? null;
    return {
      profiles,
      activeProfile,
      isLoading,
      setActiveProfileId: (id) => {
        setStoredId(id);
        try {
          localStorage.setItem(STORAGE_KEY, id);
        } catch {
          // private mode: the choice simply is not remembered
        }
      },
    };
  }, [profiles, storedId, isLoading]);

  return <ActiveProfileContext.Provider value={value}>{children}</ActiveProfileContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useActiveProfile() {
  const context = useContext(ActiveProfileContext);
  if (!context) throw new Error('useActiveProfile must be used within ActiveProfileProvider');
  return context;
}
