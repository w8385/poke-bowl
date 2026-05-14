import { BallIcon } from '@/components/legal-ball/BallIcon';
import { getBallLabel } from '@/lib/ball-data';

export function BallChip({ ballKey }: { ballKey: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
      <BallIcon ballKey={ballKey} size={18} />
      {getBallLabel(ballKey)}
    </span>
  );
}
