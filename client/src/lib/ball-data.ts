import ballMatchesData from '../../public/data/ball-matches.json';
import ballCatalogData from '../../public/data/ball-catalog.json';
import pokemonIndexData from '../../public/data/pokemon-index.json';

export type CuratedBallMatchEntry = {
  dex: number;
  slug: string;
  name: {
    ko: string;
    en: string;
  };
  types: string[];
  paletteTags: string[];
  recommendedBall: {
    key: string;
    reason: string;
  };
  altBalls: string[];
  designTags: string[];
  obtainNote: string;
  legality: {
    status: 'official' | 'limited' | 'check';
    note: string;
  };
  sourceNote: string;
};

export type PokemonIndexEntry = {
  dex: number;
  slug: string;
  name: {
    ko: string;
    en: string;
  };
  generation: number;
  types: string[];
  sprite: string;
  isLegendary: boolean;
  isMythical: boolean;
};

export type BallCatalogEntry = {
  key: string;
  nameKo: string;
  nameEn: string;
  rarityTier: string;
  officialName: string;
  colorTags: string[];
  iconPath: string;
  sortOrder: number;
};

export type PokemonDisplayEntry = PokemonIndexEntry & {
  curated: boolean;
  paletteTags: string[];
  designTags: string[];
  recommendedBall: {
    key: string;
    reason: string;
  } | null;
  altBalls: string[];
  obtainNote: string;
  legality: {
    status: 'official' | 'limited' | 'check';
    note: string;
  };
  sourceNote: string;
};

const curatedData = ballMatchesData as { updatedAt: string; pokemon: CuratedBallMatchEntry[] };
const pokemonIndex = pokemonIndexData as { updatedAt: string; count: number; pokemon: PokemonIndexEntry[] };
const ballCatalog = ballCatalogData as { updatedAt: string; balls: BallCatalogEntry[] };

const curatedMap = new Map(curatedData.pokemon.map((item) => [item.slug, item]));
const ballCatalogMap = new Map(ballCatalog.balls.map((item) => [item.key, item]));

export function getBallLabel(ballKey: string) {
  return ballCatalogMap.get(ballKey)?.nameKo ?? ballKey;
}

export function getBallCatalog() {
  return [...ballCatalog.balls].sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));
}

export function getPokemonList() {
  return pokemonIndex.pokemon
    .map((item) => {
      const curated = curatedMap.get(item.slug);
      return {
        ...item,
        curated: Boolean(curated),
        paletteTags: curated?.paletteTags ?? [],
        designTags: curated?.designTags ?? [],
        recommendedBall: curated?.recommendedBall ?? null,
        altBalls: curated?.altBalls ?? [],
        obtainNote: curated?.obtainNote ?? '',
        legality: curated?.legality ?? { status: 'check', note: '아직 합법성 검증 메모가 없다.' },
        sourceNote: curated?.sourceNote ?? '',
      } satisfies PokemonDisplayEntry;
    })
    .sort((a, b) => a.dex - b.dex);
}

export function findPokemonBySlug(slug: string) {
  return getPokemonList().find((item) => item.slug === slug);
}

export function getAvailableTypes() {
  return Array.from(new Set(getPokemonList().flatMap((item) => item.types))).sort();
}

export function getAvailableGenerations() {
  return Array.from(new Set(getPokemonList().map((item) => item.generation))).sort((a, b) => a - b);
}

export function getGenerationCounts() {
  const counts = new Map<number, number>();
  for (const item of getPokemonList()) {
    counts.set(item.generation, (counts.get(item.generation) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([generation, count]) => ({ generation, count }))
    .sort((a, b) => a.generation - b.generation);
}

export function getVoteCandidates(item: PokemonDisplayEntry) {
  const curatedFirst = [item.recommendedBall?.key, ...item.altBalls].filter(Boolean) as string[];
  const seen = new Set<string>();
  const ordered = [...curatedFirst, ...getBallCatalog().map((ball) => ball.key)].filter((ballKey) => {
    if (seen.has(ballKey)) return false;
    seen.add(ballKey);
    return true;
  });

  return ordered.map((ballKey) => ({
    ballKey,
    ballLabel: getBallLabel(ballKey),
    isRecommended: ballKey === item.recommendedBall?.key,
  }));
}

export function getLegalityLabel(status: PokemonDisplayEntry['legality']['status']) {
  switch (status) {
    case 'official':
      return '확인됨';
    case 'limited':
      return '한정/주의';
    case 'check':
    default:
      return '재확인 필요';
  }
}
