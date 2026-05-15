import Link from 'next/link';

import { StatusCard } from '@/components/ui/StatusCard';
import { getGenerationCounts, getPokemonList } from '@/lib/ball-data';

const generationCards = getGenerationCounts();
const pokemon = getPokemonList();

export const metadata = {
  title: '통계 | Poké Bowl',
};

export default function StatsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10 dark:text-zinc-100">
      <header className="space-y-4">
        <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300">
          ← 홈으로
        </Link>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">Stats</p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">볼맞춤 통계</h1>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm dark:border-sky-900 dark:bg-sky-950/30">
          <p className="text-sm font-semibold text-sky-800 dark:text-sky-200">전체 포켓몬</p>
          <p className="mt-2 text-3xl font-bold text-sky-950 dark:text-sky-100">{pokemon.length}</p>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/30">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">세대 구간</p>
          <p className="mt-2 text-3xl font-bold text-emerald-950 dark:text-emerald-100">{generationCards.length}</p>
        </div>
        <Link href="/about" className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">데이터 출처</p>
          <p className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">about 보기</p>
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {generationCards.map((item) => (
          <StatusCard
            key={item.generation}
            href={`/pokemon?generation=${item.generation}`}
            eyebrow="세대"
            title={`${item.generation}세대`}
            status="도감 이동"
            tone="zinc"
            chips={[`${item.count}마리`, '세대별 탐색']}
          />
        ))}
      </section>
    </main>
  );
}
