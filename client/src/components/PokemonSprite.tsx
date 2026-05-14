'use client';

import { useEffect, useMemo, useState } from 'react';

import { getSpriteForGender, type SpriteGender } from '@/lib/ball-data';

export function PokemonSprite({
  dex,
  baseSprite,
  gender,
  name,
  size,
  className = '',
}: {
  dex: number;
  baseSprite: string;
  gender?: SpriteGender;
  name: string;
  size: number;
  className?: string;
}) {
  const spriteSrc = useMemo(() => getSpriteForGender({ dex, sprite: baseSprite }, gender ?? 'unknown'), [baseSprite, dex, gender]);
  const [src, setSrc] = useState(spriteSrc);

  useEffect(() => {
    setSrc(spriteSrc);
  }, [spriteSrc]);

  return (
    <img
      src={src}
      alt={name}
      className={className}
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      onError={(event) => {
        if (src === baseSprite) return;
        setSrc(baseSprite);
        event.currentTarget.onerror = null;
      }}
    />
  );
}
