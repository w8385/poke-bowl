'use client';

import { formatGenerationLabel } from '@/lib/locale';
import { useLocale } from '@/hooks/useLocale';

export function GenerationLabel({ generation }: { generation: number | string }) {
  const locale = useLocale();
  return <>{formatGenerationLabel(locale, generation)}</>;
}
