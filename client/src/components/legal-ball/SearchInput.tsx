'use client';

import { useMemo, useState } from 'react';

import { PokemonCard } from '@/components/legal-ball/PokemonCard';
import { useLocale } from '@/hooks/useLocale';
import { PokemonDisplayEntry, getAvailableGenerations, getAvailableTypes, getBallLabel, getLegalityLabel } from '@/lib/ball-data';
import { formatGenerationLabel } from '@/lib/locale';

const INITIAL_LIMIT = 60;

type LegalityFilter = 'all' | 'official' | 'limited' | 'check';
type RecommendationFilter = 'all' | 'curated' | 'vote';

function matches(item: PokemonDisplayEntry, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return (
    item.slug.toLowerCase().includes(q) ||
    item.name.ko.toLowerCase().includes(q) ||
    item.name.en.toLowerCase().includes(q) ||
    String(item.dex).includes(q) ||
    item.types.some((type) => type.toLowerCase().includes(q)) ||
    item.legality.status.toLowerCase().includes(q) ||
    getLegalityLabel(item.legality.status).toLowerCase().includes(q) ||
    (item.recommendedBall?.key.toLowerCase().includes(q) ?? false) ||
    (item.recommendedBall ? getBallLabel(item.recommendedBall.key).toLowerCase().includes(q) : false) ||
    item.altBalls.some((ball) => ball.toLowerCase().includes(q) || getBallLabel(ball).toLowerCase().includes(q))
  );
}

function FilterChip({ active, label, onClick, tone = 'zinc' }: { active: boolean; label: string; onClick: () => void; tone?: 'zinc' | 'emerald' | 'amber' | 'sky' }) {
  const activeClass = {
    zinc: 'border-zinc-300 bg-zinc-900 text-white dark:border-zinc-500 dark:bg-zinc-100 dark:text-zinc-900',
    emerald: 'border-emerald-400 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-white',
    amber: 'border-amber-400 bg-amber-500 text-white dark:border-amber-500 dark:bg-amber-500 dark:text-white',
    sky: 'border-sky-400 bg-sky-600 text-white dark:border-sky-500 dark:bg-sky-500 dark:text-white',
  }[tone];
  const idleClass = 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';

  return (
    <button type="button" onClick={onClick} className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${active ? activeClass : idleClass}`}>
      {label}
    </button>
  );
}

export function SearchInput({ items, initialGeneration = 'all' }: { items: PokemonDisplayEntry[]; initialGeneration?: string }) {
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [generationFilter, setGenerationFilter] = useState(initialGeneration);
  const [legalityFilter, setLegalityFilter] = useState<LegalityFilter>('all');
  const [recommendationFilter, setRecommendationFilter] = useState<RecommendationFilter>('all');

  const types = useMemo(() => getAvailableTypes(), []);
  const generations = useMemo(() => getAvailableGenerations(), []);
  const legalityCounts = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          acc[item.legality.status] += 1;
          return acc;
        },
        { official: 0, limited: 0, check: 0 },
      ),
    [items],
  );
  const recommendationCounts = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          if (item.curated) acc.curated += 1;
          else acc.vote += 1;
          return acc;
        },
        { curated: 0, vote: 0 },
      ),
    [items],
  );

  const hasActiveFilters = Boolean(query || typeFilter !== 'all' || generationFilter !== 'all' || legalityFilter !== 'all' || recommendationFilter !== 'all');

  function resetFilters() {
    setQuery('');
    setTypeFilter('all');
    setGenerationFilter('all');
    setLegalityFilter('all');
    setRecommendationFilter('all');
  }

  const filtered = useMemo(() => {
    const results = items.filter((item) => {
      if (!matches(item, query)) return false;
      if (typeFilter !== 'all' && !item.types.includes(typeFilter)) return false;
      if (generationFilter !== 'all' && item.generation !== Number(generationFilter)) return false;
      if (legalityFilter !== 'all' && item.legality.status !== legalityFilter) return false;
      if (recommendationFilter === 'curated' && !item.curated) return false;
      if (recommendationFilter === 'vote' && item.curated) return false;
      return true;
    });

    if (!query && typeFilter === 'all' && generationFilter === 'all' && legalityFilter === 'all' && recommendationFilter === 'all') {
      return results.slice(0, INITIAL_LIMIT);
    }

    return results;
  }, [generationFilter, items, legalityFilter, query, recommendationFilter, typeFilter]);

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label htmlFor="pokemon-search" className="mt-2 block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              포켓몬 / 도감번호 / 볼 이름 / 상태 검색
            </label>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:disabled:border-zinc-800 dark:disabled:text-zinc-600"
          >
            전체 조건 초기화
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip active={legalityFilter === 'official'} label={`확인됨 ${legalityCounts.official}`} tone="emerald" onClick={() => setLegalityFilter(legalityFilter === 'official' ? 'all' : 'official')} />
          <FilterChip active={legalityFilter === 'limited'} label={`한정/주의 ${legalityCounts.limited}`} tone="amber" onClick={() => setLegalityFilter(legalityFilter === 'limited' ? 'all' : 'limited')} />
          <FilterChip active={legalityFilter === 'check'} label={`재확인 필요 ${legalityCounts.check}`} tone="sky" onClick={() => setLegalityFilter(legalityFilter === 'check' ? 'all' : 'check')} />
          <FilterChip active={recommendationFilter === 'curated'} label={`대표 추천 ${recommendationCounts.curated}`} tone="emerald" onClick={() => setRecommendationFilter(recommendationFilter === 'curated' ? 'all' : 'curated')} />
          <FilterChip active={recommendationFilter === 'vote'} label={`투표 중심 ${recommendationCounts.vote}`} onClick={() => setRecommendationFilter(recommendationFilter === 'vote' ? 'all' : 'vote')} />
          {hasActiveFilters ? <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100">조건 적용 중</span> : <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">기본 목록</span>}
        </div>
        <input
          id="pokemon-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="예: 이상해씨, Bulbasaur, 1, 프렌드볼, 확인됨"
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

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">합법성 상태</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={legalityFilter === 'all'} label="전체 상태" onClick={() => setLegalityFilter('all')} />
            <FilterChip active={legalityFilter === 'official'} label={getLegalityLabel('official')} tone="emerald" onClick={() => setLegalityFilter('official')} />
            <FilterChip active={legalityFilter === 'limited'} label={getLegalityLabel('limited')} tone="amber" onClick={() => setLegalityFilter('limited')} />
            <FilterChip active={legalityFilter === 'check'} label={getLegalityLabel('check')} tone="sky" onClick={() => setLegalityFilter('check')} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-600 dark:text-zinc-300">
        <p>
          표시 <span className="font-semibold text-zinc-900 dark:text-zinc-100">{filtered.length}</span>건
          {!query && typeFilter === 'all' && generationFilter === 'all' && legalityFilter === 'all' && recommendationFilter === 'all' ? ` / 전체 ${items.length}건 중 일부` : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          {query ? <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">검색어: {query}</span> : null}
          {generationFilter !== 'all' ? <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">세대: {formatGenerationLabel(locale, generationFilter)}</span> : null}
          {typeFilter !== 'all' ? <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">타입: {typeFilter}</span> : null}
          {legalityFilter !== 'all' ? <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">상태: {getLegalityLabel(legalityFilter)}</span> : null}
          {recommendationFilter === 'curated' ? <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">추천: 대표 추천 있음</span> : null}
          {recommendationFilter === 'vote' ? <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">추천: 투표 중심</span> : null}
          {!query && typeFilter === 'all' && generationFilter === 'all' && legalityFilter === 'all' && recommendationFilter === 'all' ? <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">기본 목록</span> : null}
        </div>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <PokemonCard key={item.slug} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">검색 결과가 없다. 조건을 조금 줄여보면 된다.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              전체 조건으로 복귀
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
