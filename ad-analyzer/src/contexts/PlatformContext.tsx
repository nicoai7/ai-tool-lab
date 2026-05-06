'use client';

import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

export type Platform = 'meta';

interface PlatformContextType {
  platform: Platform;
  setPlatform: (p: Platform) => void;
  platformLabel: string;
}

const PlatformContext = createContext<PlatformContextType | null>(null);

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider');
  return ctx;
}

const labels: Record<Platform, string> = {
  meta: 'Meta広告',
};

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [platform, setPlatform] = useState<Platform>('meta');
  const value = useMemo(
    () => ({ platform, setPlatform, platformLabel: labels[platform] }),
    [platform],
  );

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}
