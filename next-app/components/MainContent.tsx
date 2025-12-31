'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Use consistent padding on initial render to avoid hydration mismatch
  const isAdmin = mounted && pathname?.startsWith('/admin');
  const isEditor = mounted && pathname?.startsWith('/editor');
  
  if (isAdmin || isEditor) {
    return <main className="flex-1">{children}</main>;
  }
  
  return <main className="flex-1 pt-16">{children}</main>;
}
