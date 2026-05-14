'use client';

import { useEffect, useState } from 'react';

import type { Locale } from '@/lib/locale';

export function useLocale(defaultLocale: Locale = 'ko') {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const saved = window.localStorage.getItem('poke-bowl.locale');
    if (saved === 'ko' || saved === 'en' || saved === 'ja') {
      setLocale(saved);
    }
  }, []);

  return locale;
}
