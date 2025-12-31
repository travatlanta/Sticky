'use client';

import { useEffect, useState } from 'react';
import { defaultThemeSettings, type ThemeSettings } from '@/lib/homepage-settings';

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export default function ThemeApplier() {
  const [themeFetched, setThemeFetched] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      try {
        const response = await fetch('/api/settings/theme');
        if (!response.ok) {
          throw new Error('Failed to load theme');
        }
        const theme: ThemeSettings = await response.json();
        applyTheme(theme);
      } catch {
        applyTheme(defaultThemeSettings);
      }
      setThemeFetched(true);
    }

    loadTheme();
  }, []);

  function applyTheme(theme: ThemeSettings) {
    const root = document.documentElement;
    
    const primary = hexToHSL(theme.primaryColor);
    const accent = hexToHSL(theme.accentColor);
    
    root.style.setProperty('--primary', `${primary.h} ${primary.s}% ${primary.l}%`);
    root.style.setProperty('--primary-foreground', '0 0% 100%');
    
    root.style.setProperty('--accent', `${accent.h} ${accent.s}% ${accent.l}%`);
    root.style.setProperty('--accent-foreground', `${accent.h} ${accent.s}% 15%`);
    
    root.style.setProperty('--ring', `${primary.h} ${primary.s}% ${primary.l}%`);
  }

  return null;
}
