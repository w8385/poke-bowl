import Link from 'next/link';

import { BallChip } from '@/components/legal-ball/BallChip';
import { getBallCatalog, getGenerationCounts } from '@/lib/ball-data';

const generationCards = getGenerationCounts();
const featuredBalls = getBallCatalog();

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-12 text-zinc-900 sm:px-10 dark:text-zinc-100">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
          Poké Bowl
        </p>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            포켓몬별 볼 매칭을 세대별로 찾는 비공식 팬 아카이브
          </h1>
          <p className="max-w-3xl text-base leading-7 text-zinc-700 sm:text-lg dark:text-zinc-300">
            전체 포켓몬을 세대별로 탐색하고, 운영자 추천 볼과 유저 투표를 함께 보는 구조로 정리 중이다.
            현재는 PokeAPI 기반 전체 포켓몬 인덱스와 일부 큐레이션 데이터를 우선 연결해뒀다.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/play"
              className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              미니게임 시작
            </Link>
            <Link
              href="/pokemon"
              className="inline-flex items-center rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-500"
            >
              전체 포켓몬 보기
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-500"
            >
              데이터 기준 보기
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">구조화 기초 데이터</p>
          <p className="mt-2 text-lg font-semibold">PokeAPI</p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">입수 가능 여부 검증</p>
          <p className="mt-2 text-lg font-semibold">Serebii + Pokémon Database</p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">현재 탐색 가능 범위</p>
          <p className="mt-2 text-lg font-semibold">전국도감 1025마리</p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h2 className="text-2xl font-semibold">지원 볼 27종</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            현재 추천/투표 후보에 쓰는 볼 목록을 정식 스프라이트 계열로 통일해 정리했다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {featuredBalls.map((ball) => (
            <BallChip key={ball.key} ballKey={ball.key} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">세대별 브라우징</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            구글 시트의 Gen 1~9 탭 구조를 기준으로 세대별 탐색 흐름을 먼저 맞춘다.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {generationCards.map((item) => (
            <Link
              key={item.generation}
              href={`/pokemon?generation=${item.generation}`}
              className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-500"
            >
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Generation</p>
              <h3 className="mt-2 text-2xl font-semibold">Gen {item.generation}</h3>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{item.count}마리 탐색 가능</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-2xl font-semibold">현재 운영 원칙</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            <li>• 포켓몬 기본 구조는 PokeAPI 기준으로 일괄 정렬</li>
            <li>• 운영자 추천이 없는 포켓몬도 먼저 검색/상세/투표 가능 상태로 노출</li>
            <li>• 세대별 탭을 따라 큐레이션과 합법성 메모를 순차적으로 채움</li>
          </ul>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/50">
          <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-200">비공식 프로젝트 안내</h2>
          <p className="mt-3 text-sm leading-6 text-amber-900/90 dark:text-amber-100/90">
            이 사이트는 팬이 운영하는 비공식 추천 프로젝트이며, 게임 내 공식 데이터베이스나 공식 서비스가 아니다.
          </p>
          <h3 className="mt-5 text-lg font-semibold text-amber-900 dark:text-amber-200">권리 고지</h3>
          <p className="mt-2 text-sm leading-6 text-amber-900/90 dark:text-amber-100/90">
            Pokémon 및 관련 명칭, 이미지, 상표는 각 권리자에게 있다. 본 사이트는 정보 정리와 취향 기반 추천을 위한 비공식 팬 제작물이다.
          </p>
        </article>
      </section>
    </main>
  );
}
