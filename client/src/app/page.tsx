import Link from 'next/link';

import { GenerationBrowser } from '@/components/home/GenerationBrowser';
import { BallChip } from '@/components/legal-ball/BallChip';
import { getBallCatalog } from '@/lib/ball-data';

const featuredBalls = getBallCatalog();

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-8 text-zinc-900 sm:gap-10 sm:px-10 sm:py-12 dark:text-zinc-100">
      <section className="space-y-2 sm:space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
          Poké Bowl
        </p>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            포켓몬별 볼 매칭을 세대별로 찾는 비공식 팬 아카이브
          </h1>
          <p className="max-w-3xl text-base text-zinc-700 sm:text-lg dark:text-zinc-300">
            세대별 탐색, 투표, 포획 루프를 한곳에 묶은 팬 사이트.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pt-1 sm:gap-3 sm:pt-2">
          <Link
            href="/pokemon"
            className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            도감 바로 보기
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            로그인 준비 확인
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Link
          href="/pokemon"
          className="rounded-3xl border border-sky-200 bg-sky-50 p-6 transition hover:border-sky-300 hover:shadow dark:border-sky-900 dark:bg-sky-950/30 dark:hover:border-sky-700"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">Core feature · Archive</p>
          <h2 className="mt-3 text-2xl font-bold text-sky-950 dark:text-sky-100">볼맞춤 통계 / 추천 탐색</h2>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-sky-800 dark:text-sky-200">
            <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-sky-900/60">전체 포켓몬 탐색</span>
            <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-sky-900/60">추천/투표 확인</span>
            <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-sky-900/60">세대별 브라우징</span>
          </div>
          <div className="mt-6 inline-flex items-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
            도감 탐색 시작
          </div>
        </Link>

        <Link
          href="/play"
          className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 transition hover:border-emerald-300 hover:shadow dark:border-emerald-900 dark:bg-emerald-950/30 dark:hover:border-emerald-700"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Core feature · Game</p>
          <h2 className="mt-3 text-2xl font-bold text-emerald-950 dark:text-emerald-100">포획 미니게임 / 수집 루프</h2>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-200">
            <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-emerald-900/60">잡기 / 상점 / 도감</span>
            <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-emerald-900/60">업적 / 타입 보급</span>
            <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-emerald-900/60">볼 수집 플레이</span>
          </div>
          <div className="mt-6 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
            포획 루프 시작
          </div>
        </Link>
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h2 className="text-2xl font-semibold">지원 볼 27종</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {featuredBalls.map((ball) => (
            <BallChip key={ball.key} ballKey={ball.key} className="w-full justify-center" />
          ))}
        </div>
      </section>

      <GenerationBrowser />
    </main>
  );
}
