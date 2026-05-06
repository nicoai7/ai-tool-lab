'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

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

  return (
    <PlatformContext.Provider value={{ platform, setPlatform, platformLabel: labels[platform] }}>
      {children}
    </PlatformContext.Provider>
  );
}
