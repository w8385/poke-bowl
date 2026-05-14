import { BallCatalogEntry, PokemonDisplayEntry, getBallCatalog, getPokemonList } from '@/lib/ball-data';

export type Inventory = Record<string, number>;

export type Encounter = {
  id: string;
  pokemon: PokemonDisplayEntry;
  turn: number;
  escaped: boolean;
  caught: boolean;
};

export type CatchGrade = 'best' | 'great' | 'good' | 'base';

export type CatchResult = {
  success: boolean;
  escaped: boolean;
  chance: number;
  roll: number;
  score: number;
  grade: CatchGrade;
  title: string;
  detail: string;
};

export type CatchReward = {
  coins: number;
  scoreBonus: number;
  firstCatch: boolean;
  label: string;
};

export type ShopOffer = {
  ballKey: string;
  price: number;
  quantity: number;
  featured?: boolean;
};

export const SHOP_BUNDLE_STEPS = [1, 3, 5] as const;

export function getPremierBonusForPurchase(totalBalls: number) {
  return Math.floor(totalBalls / 10);
}

const allPokemon = getPokemonList();
const curatedPokemon = allPokemon.filter((item) => item.curated);
const allBalls = getBallCatalog();

export const TYPE_BALL_HINTS: Record<string, string[]> = {
  Grass: ['friend-ball', 'nest-ball', 'safari-ball'],
  Fire: ['level-ball', 'repeat-ball', 'cherish-ball'],
  Water: ['lure-ball', 'dive-ball', 'net-ball'],
  Electric: ['fast-ball', 'quick-ball', 'ultra-ball'],
  Psychic: ['dream-ball', 'love-ball', 'moon-ball'],
  Ghost: ['moon-ball', 'dusk-ball', 'strange-ball'],
  Dark: ['dusk-ball', 'luxury-ball', 'moon-ball'],
  Ice: ['dive-ball', 'heal-ball', 'dream-ball'],
  Fairy: ['love-ball', 'dream-ball', 'heal-ball'],
  Dragon: ['beast-ball', 'ultra-ball', 'luxury-ball'],
  Steel: ['heavy-ball', 'luxury-ball', 'ultra-ball'],
  Rock: ['heavy-ball', 'level-ball', 'safari-ball'],
  Ground: ['level-ball', 'nest-ball', 'heavy-ball'],
  Bug: ['net-ball', 'friend-ball', 'sport-ball'],
  Flying: ['fast-ball', 'great-ball', 'moon-ball'],
  Fighting: ['level-ball', 'repeat-ball', 'sport-ball'],
  Poison: ['master-ball', 'dream-ball', 'dusk-ball'],
  Normal: ['poke-ball', 'premier-ball', 'great-ball'],
};

const BALL_CATCH_BONUS: Record<string, number> = {
  'poke-ball': 0,
  'great-ball': 0.08,
  'ultra-ball': 0.14,
  'master-ball': 1,
  'premier-ball': 0.01,
  'heal-ball': 0.02,
  'net-ball': 0.05,
  'nest-ball': 0.04,
  'dive-ball': 0.05,
  'dusk-ball': 0.06,
  'timer-ball': 0.03,
  'quick-ball': 0.16,
  'repeat-ball': 0.03,
  'luxury-ball': 0.02,
  'fast-ball': 0.05,
  'friend-ball': 0.02,
  'moon-ball': 0.04,
  'lure-ball': 0.05,
  'love-ball': 0.02,
  'level-ball': 0.04,
  'heavy-ball': 0.04,
  'dream-ball': 0.03,
  'beast-ball': 0.04,
  'safari-ball': 0.03,
  'sport-ball': 0.03,
  'strange-ball': 0.04,
  'cherish-ball': 0.01,
};

export const DEFAULT_INVENTORY: Inventory = {
  'poke-ball': 12,
  'great-ball': 8,
  'ultra-ball': 6,
  'premier-ball': 4,
  'heal-ball': 3,
  'net-ball': 3,
  'nest-ball': 3,
  'dive-ball': 3,
  'dusk-ball': 3,
  'timer-ball': 3,
  'quick-ball': 3,
  'repeat-ball': 2,
  'luxury-ball': 2,
  'fast-ball': 2,
  'friend-ball': 2,
  'moon-ball': 2,
  'lure-ball': 2,
  'love-ball': 2,
  'level-ball': 2,
  'heavy-ball': 2,
  'dream-ball': 1,
  'beast-ball': 1,
  'safari-ball': 1,
  'sport-ball': 1,
  'strange-ball': 1,
  'cherish-ball': 1,
  'master-ball': 1,
};

const SHOP_OFFERS: ShopOffer[] = [
  { ballKey: 'poke-ball', price: 60, quantity: 3, featured: true },
  { ballKey: 'great-ball', price: 90, quantity: 2, featured: true },
  { ballKey: 'ultra-ball', price: 120, quantity: 1, featured: true },
  { ballKey: 'premier-ball', price: 80, quantity: 2 },
  { ballKey: 'heal-ball', price: 90, quantity: 1 },
  { ballKey: 'net-ball', price: 90, quantity: 1 },
  { ballKey: 'nest-ball', price: 90, quantity: 1 },
  { ballKey: 'dive-ball', price: 90, quantity: 1 },
  { ballKey: 'dusk-ball', price: 100, quantity: 1 },
  { ballKey: 'timer-ball', price: 100, quantity: 1 },
  { ballKey: 'quick-ball', price: 120, quantity: 1, featured: true },
  { ballKey: 'repeat-ball', price: 110, quantity: 1 },
  { ballKey: 'luxury-ball', price: 130, quantity: 1 },
  { ballKey: 'fast-ball', price: 130, quantity: 1 },
  { ballKey: 'friend-ball', price: 130, quantity: 1 },
  { ballKey: 'moon-ball', price: 130, quantity: 1 },
  { ballKey: 'lure-ball', price: 130, quantity: 1 },
  { ballKey: 'love-ball', price: 130, quantity: 1 },
  { ballKey: 'level-ball', price: 130, quantity: 1 },
  { ballKey: 'heavy-ball', price: 130, quantity: 1 },
  { ballKey: 'dream-ball', price: 180, quantity: 1 },
  { ballKey: 'beast-ball', price: 220, quantity: 1 },
  { ballKey: 'safari-ball', price: 180, quantity: 1 },
  { ballKey: 'sport-ball', price: 180, quantity: 1 },
  { ballKey: 'strange-ball', price: 180, quantity: 1 },
  { ballKey: 'cherish-ball', price: 180, quantity: 1 },
  { ballKey: 'master-ball', price: 1200, quantity: 1 },
];

export function getOwnedBalls(inventory: Inventory): BallCatalogEntry[] {
  return allBalls.filter((ball) => (inventory[ball.key] ?? 0) > 0);
}

export function getShopOffers() {
  return SHOP_OFFERS.map((offer) => ({
    ...offer,
    ball: allBalls.find((ball) => ball.key === offer.ballKey)!,
  })).sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.price - b.price || a.ball.sortOrder - b.ball.sortOrder);
}

export function createEncounter(): Encounter {
  const pool = Math.random() < 0.6 ? curatedPokemon : allPokemon;
  const pokemon = pool[Math.floor(Math.random() * pool.length)];
  return {
    id: `${pokemon.slug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    pokemon,
    turn: 1,
    escaped: false,
    caught: false,
  };
}

function getAffinity(pokemon: PokemonDisplayEntry, ballKey: string) {
  if (pokemon.recommendedBall?.key === ballKey) {
    return { score: 110, grade: 'best' as const, title: '베스트 매치', detail: '대표 추천 볼이라 보너스 점수를 크게 받았다.' };
  }
  if (pokemon.altBalls.includes(ballKey)) {
    return { score: 85, grade: 'great' as const, title: '멋진 선택', detail: '대체 후보 안에 있는 볼이라 추가 점수를 받았다.' };
  }

  const hinted = pokemon.types.flatMap((type) => TYPE_BALL_HINTS[type] ?? []);
  if (hinted.includes(ballKey)) {
    return { score: 68, grade: 'good' as const, title: '잘 어울림', detail: '타입/분위기 힌트에 맞아서 소보너스가 붙었다.' };
  }

  if (ballKey === 'premier-ball' || ballKey === 'luxury-ball' || ballKey === 'poke-ball') {
    return { score: 56, grade: 'good' as const, title: '깔끔한 선택', detail: '기본 포획 점수에 깔끔한 선택 보너스가 더해졌다.' };
  }

  return { score: 40, grade: 'base' as const, title: '기본 포획', detail: '포획에는 성공했고 기본 점수를 획득했다.' };
}

function getCatchChance(encounter: Encounter, ballKey: string) {
  if (ballKey === 'master-ball') return 1;

  const { pokemon, turn } = encounter;
  let chance = pokemon.isMythical ? 0.1 : pokemon.isLegendary ? 0.18 : pokemon.curated ? 0.58 : 0.52;
  chance += BALL_CATCH_BONUS[ballKey] ?? 0;

  if (ballKey === 'quick-ball' && turn === 1) chance += 0.15;
  if (ballKey === 'timer-ball') chance += Math.min(0.04 * (turn - 1), 0.18);
  if (ballKey === 'dusk-ball' && (pokemon.types.includes('Ghost') || pokemon.types.includes('Dark'))) chance += 0.08;
  if (ballKey === 'net-ball' && (pokemon.types.includes('Bug') || pokemon.types.includes('Water'))) chance += 0.08;
  if (ballKey === 'dive-ball' && pokemon.types.includes('Water')) chance += 0.08;
  if (ballKey === 'nest-ball' && pokemon.generation <= 2) chance += 0.05;
  if (ballKey === 'beast-ball' && (pokemon.isLegendary || pokemon.isMythical)) chance += 0.04;

  const affinity = getAffinity(pokemon, ballKey);
  if (affinity.grade === 'best') chance += 0.08;
  else if (affinity.grade === 'great') chance += 0.04;
  else if (affinity.grade === 'good') chance += 0.02;

  return Math.max(0.05, Math.min(0.97, chance));
}

export function getCatchReward(pokemon: PokemonDisplayEntry, firstCatch: boolean, grade: CatchGrade): CatchReward {
  const baseCoins = pokemon.isMythical
    ? 800
    : pokemon.isLegendary
      ? 500
      : pokemon.curated
        ? 140
        : 100;

  const repeatCoins = pokemon.isMythical || pokemon.isLegendary ? 60 : 20;
  const scoreBonus = grade === 'best' ? 30 : grade === 'great' ? 18 : grade === 'good' ? 8 : 0;
  const coins = (firstCatch ? baseCoins : repeatCoins) + scoreBonus;
  const label = firstCatch ? '도감 첫 등록 보상' : '중복 포획 보상';

  return { coins, scoreBonus, firstCatch, label };
}

export function throwBall(encounter: Encounter, ballKey: string): CatchResult {
  const chance = getCatchChance(encounter, ballKey);
  const roll = Math.random();
  const affinity = getAffinity(encounter.pokemon, ballKey);

  if (roll <= chance) {
    return {
      success: true,
      escaped: false,
      chance,
      roll,
      score: affinity.score,
      grade: affinity.grade,
      title: affinity.title,
      detail: affinity.detail,
    };
  }

  const escapeRoll = Math.random();
  const escapeThreshold = encounter.pokemon.isLegendary || encounter.pokemon.isMythical ? 0.7 : 0.38;
  const escaped = escapeRoll < escapeThreshold;

  return {
    success: false,
    escaped,
    chance,
    roll,
    score: 10,
    grade: 'base',
    title: escaped ? '놓쳤다' : '아슬아슬',
    detail: escaped ? '볼에서 빠져나온 뒤 그대로 달아났다.' : '이번엔 못 잡았지만 아직 야생 포켓몬이 남아 있다.',
  };
}
