'use client';

import { useMemo, useState } from 'react';

import { PokemonCard } from '@/components/legal-ball/PokemonCard';
import { useLocale } from '@/hooks/useLocale';
import { PokemonDisplayEntry, getAvailableGenerations, getAvailableTypes, getBallLabel } from '@/lib/ball-data';
import { formatGenerationLabel } from '@/lib/locale';

const INITIAL_LIMIT = 60;

function matches(item: PokemonDisplayEntry, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return (
    item.slug.toLowerCase().includes(q) ||
    item.name.ko.toLowerCase().includes(q) ||
    item.name.en.toLowerCase().includes(q) ||
    String(item.dex).includes(q) ||
    item.types.some((type) => type.toLowerCase().includes(q)) ||
    (item.recommendedBall?.key.toLowerCase().includes(q) ?? false) ||
    (item.recommendedBall ? getBallLabel(item.recommendedBall.key).toLowerCase().includes(q) : false) ||
    item.altBalls.some((ball) => ball.toLowerCase().includes(q) || getBallLabel(ball).toLowerCase().includes(q))
  );
}

export function SearchInput({ items, initialGeneration = 'all' }: { items: PokemonDisplayEntry[]; initialGeneration?: string }) {
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [generationFilter, setGenerationFilter] = useState(initialGeneration);

  const types = useMemo(() => getAvailableTypes(), []);
  const generations = useMemo(() => getAvailableGenerations(), []);

  const filtered = useMemo(() => {
    const results = items.filter((item) => {
      if (!matches(item, query)) return false;
      if (typeFilter !== 'all' && !item.types.includes(typeFilter)) return false;
      if (generationFilter !== 'all' && item.generation !== Number(generationFilter)) return false;
      return true;
    });

    if (!query && typeFilter === 'all' && generationFilter === 'all') {
      return results.slice(0, INITIAL_LIMIT);
    }

    return results;
  }, [generationFilter, items, query, typeFilter]);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <label htmlFor="pokemon-search" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          포켓몬 / 도감번호 / 볼 이름 검색
        </label>
        <input
          id="pokemon-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="예: 이상해씨, Bulbasaur, 1, 프렌드볼"
          className="mt-3 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none ring-0 transition placeholder:text-zinc-400 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-zinc-800 dark:text-zinc-200">세대</span>
            <select
              value={generationFilter}
              onChange={(event) => setGenerationFilter(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="all">전체 세대</option>
              {generations.map((generation) => (
                <option key={generation} value={generation}>
                  {formatGenerationLabel(locale, generation)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-2 block font-medium text-zinc-800 dark:text-zinc-200">타입</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="all">전체 타입</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

        </div>

        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          전체 포켓몬을 세대별로 먼저 열고, 기본 추천은 시트 기반으로 순차 확장한다.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-600 dark:text-zinc-300">
        <p>
          표시 <span className="font-semibold text-zinc-900 dark:text-zinc-100">{filtered.length}</span>건
          {!query && typeFilter === 'all' && generationFilter === 'all' ? ` / 전체 ${items.length}건 중 일부` : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          {query ? <p>검색어: {query}</p> : <p>기본 목록</p>}
          {generationFilter !== 'all' ? <p>세대: {formatGenerationLabel(locale, generationFilter)}</p> : null}
          {typeFilter !== 'all' ? <p>타입: {typeFilter}</p> : null}
        </div>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <PokemonCard key={item.slug} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
          검색 결과가 없다. 이름, 도감번호, 영문명, 볼 이름, 세대, 타입으로 다시 찾아보면 된다.
        </div>
      )}
    </section>
  );
}
