import Link from 'next/link';

import { getGenerationCounts } from '@/lib/ball-data';

const generationCards = getGenerationCounts();

export const metadata = {
  title: '통계 | Poké Bowl',
};

export default function StatsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10 dark:text-zinc-100">
      <header className="space-y-3">
        <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300">
          ← 홈으로
        </Link>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">Stats</p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">볼맞춤 통계</h1>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/pokemon" className="rounded-2xl border border-sky-200 bg-sky-50 p-5 transition hover:border-sky-300 dark:border-sky-900 dark:bg-sky-950/20">
          <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">전체 포켓몬</p>
          <p className="mt-2 text-2xl font-bold text-sky-950 dark:text-sky-50">1025</p>
        </Link>
        <Link href="/pokemon" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 transition hover:border-emerald-300 dark:border-emerald-900 dark:bg-emerald-950/20">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">세대 구간</p>
          <p className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50">{generationCards.length}</p>
        </Link>
        <Link href="/pokemon" className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">탐색</p>
          <p className="mt-2 text-2xl font-bold text-zinc-950 dark:text-zinc-50">세대별</p>
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {generationCards.map((item) => (
          <Link
            key={item.generation}
            href={`/pokemon?generation=${item.generation}`}
            className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-500"
          >
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">세대</p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{item.generation}세대</h2>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{item.count}마리</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
