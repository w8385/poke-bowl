'use client';

import { useEffect, useRef, useState } from 'react';

type Locale = 'ko' | 'en';

const options: { value: Locale; label: string }[] = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
];

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>('ko');
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem('poke-bowl.locale');
    if (saved === 'ko' || saved === 'en') {
      setLocale(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, []);

  function applyLocale(next: Locale) {
    setLocale(next);
    window.localStorage.setItem('poke-bowl.locale', next);
    document.documentElement.lang = next;
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="언어 선택"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a15 15 0 0 1 0 18" />
          <path d="M12 3a15 15 0 0 0 0 18" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-20 min-w-36 rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {options.map((option) => {
            const active = option.value === locale;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => applyLocale(option.value)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                  active
                    ? 'bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                <span>{option.label}</span>
                {active ? <span>✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
