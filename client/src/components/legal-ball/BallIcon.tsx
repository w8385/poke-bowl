import { getBallCatalog } from '@/lib/ball-data';

const iconMap = new Map(getBallCatalog().map((ball) => [ball.key, ball.iconPath]));

export function BallIcon({ ballKey, size = 20 }: { ballKey: string; size?: number }) {
  const src = iconMap.get(ballKey);
  if (!src) return null;

  return <img src={src} alt="" aria-hidden className="shrink-0" width={size} height={size} style={{ imageRendering: 'pixelated' }} />;
}
