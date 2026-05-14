import Link from 'next/link';

import { SearchInput } from '@/components/legal-ball/SearchInput';
import { getPokemonList } from '@/lib/ball-data';

export const metadata = {
  title: '포켓몬 목록 | Poké Bowl',
  description: '포켓몬별 볼맞춤 추천 목록',
};

export default async function PokemonListPage({
  searchParams,
}: {
  searchParams: Promise<{ generation?: string }>;
}) {
  const pokemon = getPokemonList();
  const { generation } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10 dark:text-zinc-100">
      <header className="space-y-3">
        <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300">
          ← 홈으로
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
            포켓몬별 볼 매칭 목록
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-700 sm:text-base dark:text-zinc-300">
            전체 포켓몬을 먼저 탐색하고, 세대별/타입별로 좁혀서 운영자 추천과 유저 투표를 함께 본다.
          </p>
          {generation ? <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">현재 진입: Gen {generation}</p> : null}
        </div>
      </header>

      <SearchInput items={pokemon} initialGeneration={generation ?? 'all'} />
    </main>
  );
}
