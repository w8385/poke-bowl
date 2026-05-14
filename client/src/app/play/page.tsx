import Link from 'next/link';

import { CatchGame } from '@/components/legal-ball/CatchGame';

export const metadata = {
  title: '볼 포획 미니게임 | Poké Bowl',
  description: '가지고 있는 볼로 야생 포켓몬을 잡는 미니게임',
};

export default function PlayPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10 dark:text-zinc-100">
      <header className="space-y-3">
        <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300">
          ← 홈으로
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
            야생 포획 미니게임
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-700 sm:text-base dark:text-zinc-300">
            네 가방에 있는 볼 중 하나를 골라 야생 포켓몬을 잡아본다. 포획 성공과 별개로, 어떤 볼이 얼마나 잘 어울리는지도 점수로 반영된다.
          </p>
        </div>
      </header>

      <CatchGame />
    </main>
  );
}
