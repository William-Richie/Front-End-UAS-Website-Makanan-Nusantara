import type { ReactNode } from 'react';
import SiteProvider from '@/components/User/Site/SiteContext';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteProvider>{children}</SiteProvider>;
}
