import Link from 'next/link';
import { notFound } from 'next/navigation';

import { auth } from '@/auth';
import { PokemonSprite } from '@/components/PokemonSprite';
import { BallChip } from '@/components/legal-ball/BallChip';
import { VotePanel } from '@/components/legal-ball/VotePanel';
import { findPokemonBySlug, getLegalityLabel } from '@/lib/ball-data';
import { getVoteReadiness } from '@/lib/vote-readiness';

function MetaChip({ children, tone = 'zinc' }: { children: React.ReactNode; tone?: 'zinc' | 'emerald' | 'amber' | 'sky' }) {
  const toneClass = {
    zinc: 'border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100',
    emerald: 'border border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100',
    amber: 'border border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100',
    sky: 'border border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-100',
  }[tone];

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>{children}</span>;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      <div className="mt-4">{children}</div>
    </article>
  );
}

export default async function PokemonDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = findPokemonBySlug(slug);
  const session = await auth();
  const voteReadiness = getVoteReadiness();

  if (!item) notFound();

  const tagList = [...item.paletteTags, ...item.designTags];
  const legalityTone = item.legality.status === 'official' ? 'emerald' : item.legality.status === 'limited' ? 'amber' : 'sky';

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10 dark:text-zinc-100">
      <header className="space-y-4">
        <Link href="/pokemon" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300">
          ← 목록으로
        </Link>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl border border-zinc-200 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950">
                <PokemonSprite dex={item.dex} baseSprite={item.sprite} gender="unknown" name={item.name.en} size={96} className="h-24 w-24" />
              </div>
              <div className="min-w-0 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Summary</p>
                  <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">#{item.dex}</p>
                  <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
                    {item.name.ko || item.name.en}
                  </h1>
                  <p className="text-base text-zinc-600 dark:text-zinc-300">{item.name.en}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <MetaChip tone={item.curated ? 'emerald' : 'sky'}>{item.curated ? '운영 추천 있음' : '투표 중심'}</MetaChip>
                  <MetaChip tone={legalityTone}>{getLegalityLabel(item.legality.status)}</MetaChip>
                  <MetaChip>{item.generation}세대</MetaChip>
                  {item.types.map((type) => (
                    <MetaChip key={type}>{type}</MetaChip>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/45">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">대표 추천</h2>
                </div>
                <MetaChip tone={voteReadiness.ready ? 'emerald' : 'amber'}>{voteReadiness.ready ? '투표 가능 흐름' : '설정 확인 필요'}</MetaChip>
              </div>
              <div className="mt-4">
                {item.recommendedBall ? <BallChip ballKey={item.recommendedBall.key} /> : <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">아직 없음</p>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <MetaChip tone="emerald">후보 {Math.max(item.altBalls.length + (item.recommendedBall ? 1 : 0), 1)}개</MetaChip>
                <MetaChip tone={legalityTone}>{getLegalityLabel(item.legality.status)}</MetaChip>
              </div>
            </article>
          </div>
        </section>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="추천">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-7 text-zinc-700 shadow-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200">
            {item.recommendedBall?.reason || '아직 운영자 큐레이션이 없어서 현재는 투표 후보 중심으로 본다.'}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-600 dark:bg-zinc-950/85">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">대체 후보</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.altBalls.length ? item.altBalls.map((ballKey) => <BallChip key={ballKey} ballKey={ballKey} />) : <MetaChip tone="sky">투표 후보에서 선택</MetaChip>}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-600 dark:bg-zinc-950/85">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">색감 · 디자인</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tagList.length ? tagList.map((tag) => <MetaChip key={tag} tone="emerald">{tag}</MetaChip>) : <MetaChip>태그 준비 중</MetaChip>}
              </div>
            </div>
          </div>
        </SectionCard>

        <VotePanel pokemon={item} signedIn={Boolean(session?.user?.email)} voteReady={voteReadiness.ready} />
      </section>
    </main>
  );
}
