import Link from 'next/link';
import { notFound } from 'next/navigation';

import { auth } from '@/auth';
import { PokemonSprite } from '@/components/PokemonSprite';
import { BallChip } from '@/components/legal-ball/BallChip';
import { VotePanel } from '@/components/legal-ball/VotePanel';
import { findPokemonBySlug, getLegalityLabel } from '@/lib/ball-data';

export default async function PokemonDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = findPokemonBySlug(slug);
  const session = await auth();

  if (!item) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12 sm:px-10 dark:text-zinc-100">
      <header className="space-y-3">
        <Link href="/pokemon" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300">
          ← 목록으로
        </Link>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-zinc-50 dark:bg-zinc-800/80">
            <PokemonSprite dex={item.dex} baseSprite={item.sprite} gender="unknown" name={item.name.en} size={96} className="h-24 w-24" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">#{item.dex}</p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
              {item.name.ko || item.name.en}
            </h1>
            <p className="text-base text-zinc-600 dark:text-zinc-300">{item.name.en}</p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">대표 추천</p>
          <div className="mt-2">
            {item.recommendedBall ? <BallChip ballKey={item.recommendedBall.key} /> : <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">아직 없음</p>}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">합법성 상태</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{getLegalityLabel(item.legality.status)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">대체 후보</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {item.altBalls.length ? item.altBalls.map((ballKey) => <BallChip key={ballKey} ballKey={ballKey} className="w-full justify-center" />) : <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">투표 후보에서 선택 가능</p>}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">추천 근거</h2>
        <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">
          {item.recommendedBall?.reason || '아직 운영자 큐레이션이 없는 포켓몬이다. 지금은 전체 지원 볼 후보를 보고 유저 투표부터 받을 수 있다.'}
        </p>

        <div className="grid gap-4 pt-2 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">타입</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.types.map((type) => (
                <span key={type} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">색감/디자인 태그</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...item.paletteTags, ...item.designTags].length ? ([...item.paletteTags, ...item.designTags].map((tag) => (
                <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  {tag}
                </span>
              ))) : <span className="text-sm text-zinc-500 dark:text-zinc-400">아직 태그 없음</span>}
            </div>
          </div>
        </div>
      </section>

      <VotePanel pokemon={item} signedIn={Boolean(session?.user?.email)} />

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">합법성 메모</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">{item.legality.note || '추가 메모 없음'}</p>
          <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">{item.obtainNote || '입수 메모 없음'}</p>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/50">
          <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-200">주의</h2>
          <p className="mt-3 text-sm leading-7 text-amber-900/90 dark:text-amber-100/90">
            이 추천은 비공식 팬메이드 큐레이션이다. 미적 추천과 실제 입수 가능 여부는 다를 수 있으니,
            실사용 전에는 세대/이벤트/교배 루트를 다시 확인하는 쪽이 안전하다.
          </p>
        </article>
      </section>
    </main>
  );
}
