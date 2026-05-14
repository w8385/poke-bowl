import Link from 'next/link';

import { PokemonSprite } from '@/components/PokemonSprite';
import { BallIcon } from '@/components/legal-ball/BallIcon';
import { PokemonDisplayEntry, getBallLabel } from '@/lib/ball-data';

export function PokemonCard({ item }: { item: PokemonDisplayEntry }) {
  return (
    <Link
      href={`/pokemon/${item.slug}`}
      className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-500"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/80">
            <PokemonSprite dex={item.dex} baseSprite={item.sprite} gender="unknown" name={item.name.en} size={64} className="h-16 w-16" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">#{item.dex}</p>
            <h3 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">{item.name.ko || item.name.en}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{item.name.en}</p>
          </div>
        </div>
        {item.recommendedBall ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            <BallIcon ballKey={item.recommendedBall.key} size={18} />
            {getBallLabel(item.recommendedBall.key)}
          </span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            투표 가능
          </span>
        )}
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
        {item.recommendedBall ? item.recommendedBall.reason : '아직 운영자 추천은 없지만, 볼 후보를 보고 바로 투표할 수 있다.'}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.types.map((type) => (
          <span key={type} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {type}
          </span>
        ))}
      </div>
    </Link>
  );
}
