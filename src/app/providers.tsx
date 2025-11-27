'use client';

import { ZenonProvider } from '@/contexts/ZenonProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ZenonProvider>
      {children}
    </ZenonProvider>
  );
}
