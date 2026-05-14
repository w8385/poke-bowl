export type Locale = 'ko' | 'en' | 'ja';

export function formatGenerationLabel(locale: Locale, generation: number | string) {
  const value = String(generation);
  if (locale === 'ja') return `第${value}世代`;
  if (locale === 'en') return `Gen ${value}`;
  return `${value}세대`;
}

export function getGenerationWord(locale: Locale) {
  if (locale === 'ja') return '世代';
  if (locale === 'en') return 'Generation';
  return '세대';
}

export function formatGenerationRange(locale: Locale, start: number | string, end: number | string) {
  if (locale === 'ja') return `第${start}〜第${end}世代`;
  if (locale === 'en') return `Gen ${start}–${end}`;
  return `${start}~${end}세대`;
}
