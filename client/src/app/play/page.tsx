import Link from 'next/link';

import { CatchGame } from '@/components/legal-ball/CatchGame';

export const metadata = {
  title: '볼 포획 미니게임 | Poké Bowl',
  description: '가지고 있는 볼로 야생 포켓몬을 잡는 미니게임',
};

export default function PlayPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10 dark:text-zinc-100">
      <header className="space-y-4">
        <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300">
          ← 홈으로
        </Link>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Mini game</p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">야생 포획 미니게임</h1>
        </div>
      </header>

      <CatchGame />
    </main>
  );
}
