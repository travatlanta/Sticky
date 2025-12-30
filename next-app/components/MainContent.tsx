'use client';

import { usePathname } from 'next/navigation';

export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isEditor = pathname?.startsWith('/editor');
  
  if (isAdmin || isEditor) {
    return <main className="flex-1">{children}</main>;
  }
  
  return <main className="flex-1 pt-16">{children}</main>;
}
