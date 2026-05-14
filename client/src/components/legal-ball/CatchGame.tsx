'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { PokemonSprite } from '@/components/PokemonSprite';
import { BallChip } from '@/components/legal-ball/BallChip';
import { BallIcon } from '@/components/legal-ball/BallIcon';
import { useLocale } from '@/hooks/useLocale';
import { getBallLabel, getFemaleRatio, getPokemonList, type SpriteGender } from '@/lib/ball-data';
import { formatGenerationLabel } from '@/lib/locale';
import {
  ADVENTURE_REGIONS,
  CatchResult,
  CatchReward,
  DEFAULT_INVENTORY,
  Encounter,
  Inventory,
  createEncounter,
  getAdventureRegions,
  getCatchReward,
  getOwnedBalls,
  getPremierBonusForPurchase,
  getShopOffers,
  SHOP_BUNDLE_STEPS,
  throwBall,
  TYPE_BALL_HINTS,
} from '@/lib/catch-game';

const STORAGE_KEY = 'poke-bowl-catch-game-v2';
const LEGACY_STORAGE_KEY = 'poke-bowl-catch-game-v1';
const allPokemon = getPokemonList();
const pokemonDataMap = new Map(allPokemon.map((item) => [item.slug, item]));

type GameTab = 'home' | 'catch' | 'shop' | 'dex' | 'history' | 'achievements';

type CatchGender = SpriteGender;

type CatchRecord = {
  encounterId: string;
  slug: string;
  dex: number;
  name: string;
  gender: CatchGender;
  ballKey: string;
  success: boolean;
  score: number;
  title: string;
  coins: number;
  createdAt: string;
};

type PokedexDetail = {
  slug: string;
  genus: string;
  flavorText: string;
  habitat: string | null;
  shape: string | null;
  captureRate: number;
  heightM: number;
  weightKg: number;
  abilities: Array<{ name: string; hidden: boolean }>;
};

type CollectionEntry = {
  firstBallKey: string;
  caughtBalls: string[];
  caughtByBall: Record<string, number>;
  genderCounts: Record<CatchGender, number>;
  totalCaught: number;
};

type ShopStats = {
  purchaseCount: number;
  purchasedBalls: number;
  premierBonusEarned: number;
};

type ShopPopup = {
  ballKey: string;
  ballName: string;
  quantity: number;
  price: number;
  premierBonus: number;
};

type DexModalState = {
  slug: string;
};

type AchievementReward = {
  coins?: number;
  balls?: Array<{ ballKey: string; count: number }>;
};

type AchievementDefinition = {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
  reward: AchievementReward;
};

type TypeSupplyDefinition = {
  id: string;
  type: string;
  stage: number;
  target: number;
  title: string;
  desc: string;
  unlocked: boolean;
  reward: AchievementReward;
};

type SavedState = {
  inventory: Inventory;
  score: number;
  coins: number;
  streak: number;
  bestStreak: number;
  collection: Record<string, CollectionEntry>;
  history: CatchRecord[];
  encounter: Encounter;
  shopStats: ShopStats;
  typeCatchStats?: Record<string, number>;
  claimedAchievements?: string[];
  claimedTypeSupplies?: string[];
  activeTab?: GameTab;
  selectedRegionId?: string;
  favoriteRecords?: Record<string, string>;
  regionEncounterCount?: number;
  regionRunClosed?: boolean;
};

type AuthSession = {
  user?: {
    email?: string | null;
  };
};

function cloneDefaultInventory() {
  return JSON.parse(JSON.stringify(DEFAULT_INVENTORY)) as Inventory;
}

function getEncounterGender(pokemon: Encounter['pokemon']): CatchGender {
  const femaleRatio = getFemaleRatio(pokemon.genderRate);
  if (femaleRatio === null) return 'unknown';
  if (femaleRatio <= 0) return 'male';
  if (femaleRatio >= 1) return 'female';
  return Math.random() < femaleRatio ? 'female' : 'male';
}

function createCollectionEntry(ballKey: string, gender: CatchGender): CollectionEntry {
  return {
    firstBallKey: ballKey,
    caughtBalls: [ballKey],
    caughtByBall: { [ballKey]: 1 },
    genderCounts: {
      male: gender === 'male' ? 1 : 0,
      female: gender === 'female' ? 1 : 0,
      unknown: gender === 'unknown' ? 1 : 0,
    },
    totalCaught: 1,
  };
}

function normalizeCollection(raw: unknown): Record<string, CollectionEntry> {
  if (!raw || typeof raw !== 'object') return {};
  const entries = Object.entries(raw as Record<string, unknown>);
  return Object.fromEntries(entries.map(([slug, value]) => {
    if (typeof value === 'string') {
      return [slug, createCollectionEntry(value, 'unknown')];
    }
    const parsed = value as Partial<CollectionEntry>;
    const firstBallKey = typeof parsed.firstBallKey === 'string' ? parsed.firstBallKey : (Array.isArray(parsed.caughtBalls) && typeof parsed.caughtBalls[0] === 'string' ? parsed.caughtBalls[0] : 'poke-ball');
    const caughtBalls = Array.isArray(parsed.caughtBalls) ? parsed.caughtBalls.filter((item): item is string => typeof item === 'string') : [firstBallKey];
    const caughtByBall = parsed.caughtByBall && typeof parsed.caughtByBall === 'object' ? parsed.caughtByBall as Record<string, number> : Object.fromEntries(caughtBalls.map((ballKey) => [ballKey, 1]));
    const genderCounts = parsed.genderCounts && typeof parsed.genderCounts === 'object'
      ? {
          male: Number((parsed.genderCounts as Record<string, number>).male ?? 0),
          female: Number((parsed.genderCounts as Record<string, number>).female ?? 0),
          unknown: Number((parsed.genderCounts as Record<string, number>).unknown ?? 0),
        }
      : { male: 0, female: 0, unknown: 0 };
    const totalCaught = typeof parsed.totalCaught === 'number' ? parsed.totalCaught : Object.values(caughtByBall).reduce((sum, count) => sum + count, 0);
    return [slug, { firstBallKey, caughtBalls: caughtBalls.length ? caughtBalls : [firstBallKey], caughtByBall, genderCounts, totalCaught } satisfies CollectionEntry];
  }));
}

function genderLabel(gender: CatchGender) {
  if (gender === 'male') return '♂';
  if (gender === 'female') return '♀';
  return '—';
}

function normalizeTypeCatchStats(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>)
      .filter(([type, count]) => typeof type === 'string' && typeof count === 'number')
      .map(([type, count]) => [type, Number(count) || 0]),
  );
}

function defaultShopStats(): ShopStats {
  return {
    purchaseCount: 0,
    purchasedBalls: 0,
    premierBonusEarned: 0,
  };
}

const TABS: { id: GameTab; label: string }[] = [
  { id: 'home', label: '홈' },
  { id: 'catch', label: '잡기' },
  { id: 'shop', label: '상점' },
  { id: 'dex', label: '도감' },
  { id: 'history', label: '기록' },
  { id: 'achievements', label: '업적' },
];

function getAvailableGenders(genderRate: number): CatchGender[] {
  const femaleRatio = getFemaleRatio(genderRate);
  if (femaleRatio === null) return ['unknown'];
  if (femaleRatio <= 0) return ['male'];
  if (femaleRatio >= 1) return ['female'];
  return ['male', 'female'];
}

function getGenderCountLabel(gender: CatchGender, count: number) {
  if (gender === 'male') return `♂ ${count}`;
  if (gender === 'female') return `♀ ${count}`;
  return `무성 ${count}`;
}

function getRecordKey(record: Pick<CatchRecord, 'encounterId' | 'ballKey' | 'createdAt'>) {
  return `${record.encounterId}:${record.ballKey}:${record.createdAt}`;
}

function formatRecordTime(value: string) {
  return new Date(value).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CatchGame() {
  const locale = useLocale();
  const [inventory, setInventory] = useState<Inventory>(cloneDefaultInventory);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [collection, setCollection] = useState<Record<string, CollectionEntry>>({});
  const [history, setHistory] = useState<CatchRecord[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>(ADVENTURE_REGIONS[0].id);
  const [encounter, setEncounter] = useState<Encounter>(() => createEncounter(ADVENTURE_REGIONS[0].id));
  const [regionEncounterCount, setRegionEncounterCount] = useState(1);
  const [regionRunClosed, setRegionRunClosed] = useState(false);
  const [selectedBall, setSelectedBall] = useState('poke-ball');
  const [lastResult, setLastResult] = useState<CatchResult | null>(null);
  const [lastReward, setLastReward] = useState<CatchReward | null>(null);
  const [lastShopAction, setLastShopAction] = useState<string | null>(null);
  const [lastAchievementAction, setLastAchievementAction] = useState<string | null>(null);
  const [lastTypeSupplyAction, setLastTypeSupplyAction] = useState<string | null>(null);
  const [shopStats, setShopStats] = useState<ShopStats>(defaultShopStats);
  const [typeCatchStats, setTypeCatchStats] = useState<Record<string, number>>({});
  const [shopQuantities, setShopQuantities] = useState<Record<string, number>>({});
  const [shopPopup, setShopPopup] = useState<ShopPopup | null>(null);
  const [dexModal, setDexModal] = useState<DexModalState | null>(null);
  const [selectedDexGeneration, setSelectedDexGeneration] = useState(1);
  const [favoriteRecords, setFavoriteRecords] = useState<Record<string, string>>({});
  const [dexDetail, setDexDetail] = useState<PokedexDetail | null>(null);
  const [dexDetailLoading, setDexDetailLoading] = useState(false);
  const [dexAction, setDexAction] = useState<string | null>(null);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [claimedAchievements, setClaimedAchievements] = useState<string[]>([]);
  const [claimedTypeSupplies, setClaimedTypeSupplies] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<GameTab>('home');
  const [hydrated, setHydrated] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);

  const regions = useMemo(() => getAdventureRegions(), []);
  const ownedBalls = useMemo(() => getOwnedBalls(inventory), [inventory]);
  const shopOffers = useMemo(() => getShopOffers(), []);
  const caughtCount = Object.keys(collection).length;
  const successfulCatchCount = history.filter((item) => item.success).length;
  const topTypeEntry = useMemo(() => Object.entries(typeCatchStats).sort((a, b) => b[1] - a[1])[0] ?? null, [typeCatchStats]);
  const pokemonByGeneration = useMemo(() => {
    const grouped = new Map<number, typeof allPokemon>();
    for (const pokemon of allPokemon) {
      const bucket = grouped.get(pokemon.generation) ?? [];
      bucket.push(pokemon);
      grouped.set(pokemon.generation, bucket);
    }
    return Array.from(grouped.entries())
      .map(([generation, pokemon]) => ({ generation, pokemon: [...pokemon].sort((a, b) => a.dex - b.dex) }))
      .sort((a, b) => a.generation - b.generation);
  }, []);
  const unlockedAchievementCount = useMemo(() => {
    let unlocked = 0;
    if (caughtCount >= 1) unlocked += 1;
    if (caughtCount >= 10) unlocked += 1;
    if (caughtCount >= 30) unlocked += 1;
    if (bestStreak >= 3) unlocked += 1;
    if (bestStreak >= 5) unlocked += 1;
    if (shopStats.purchaseCount >= 1) unlocked += 1;
    if (shopStats.premierBonusEarned >= 1) unlocked += 1;
    if (coins >= 500) unlocked += 1;
    return unlocked;
  }, [bestStreak, caughtCount, coins, shopStats.purchaseCount, shopStats.premierBonusEarned]);
  const selectedBallIndex = Math.max(0, ownedBalls.findIndex((ball) => ball.key === selectedBall));
  const selectedBallEntry = ownedBalls[selectedBallIndex] ?? ownedBalls[0] ?? null;
  const encounterGender = useMemo(() => getEncounterGender(encounter.pokemon), [encounter.pokemon]);
  const selectedDexPokemon = dexModal ? pokemonDataMap.get(dexModal.slug) ?? null : null;
  const selectedDexEntry = dexModal ? collection[dexModal.slug] ?? null : null;
  const activeDexGeneration = pokemonByGeneration.find((entry) => entry.generation === selectedDexGeneration) ?? pokemonByGeneration[0];
  const selectedRegion = regions.find((region) => region.id === selectedRegionId) ?? regions[0];
  const selectedRegionCaught = useMemo(() => allPokemon.filter((pokemon) => pokemon.generation === selectedRegion.generation && collection[pokemon.slug]).length, [collection, selectedRegion]);
  const selectedRegionTotal = useMemo(() => allPokemon.filter((pokemon) => pokemon.generation === selectedRegion.generation).length, [selectedRegion]);
  const selectedRegionRemaining = Math.max(0, selectedRegion.maxEncounters - regionEncounterCount);
  const selectedPokemonRecords = useMemo(() => {
    if (!selectedDexPokemon) return [];
    return history.filter((item) => item.slug === selectedDexPokemon.slug);
  }, [history, selectedDexPokemon]);
  const selectedFavoriteRecordKey = selectedDexPokemon ? favoriteRecords[selectedDexPokemon.slug] ?? null : null;
  const encounterBadge = encounter.pokemon.isMythical
    ? { label: 'MYTHICAL', tone: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200' }
    : encounter.pokemon.isLegendary
      ? { label: 'LEGENDARY', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' }
      : encounter.pokemon.curated
        ? { label: 'CURATED', tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' }
        : { label: 'WILD', tone: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200' };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SavedState>;
        setInventory(saved.inventory ?? cloneDefaultInventory());
        setScore(saved.score ?? 0);
        setCoins(saved.coins ?? 0);
        setStreak(saved.streak ?? 0);
        setBestStreak(saved.bestStreak ?? saved.streak ?? 0);
        setCollection(normalizeCollection(saved.collection));
        setHistory(saved.history ?? []);
        const restoredRegionId = saved.selectedRegionId ?? ADVENTURE_REGIONS[0].id;
        setSelectedRegionId(restoredRegionId);
        setEncounter(saved.encounter ?? createEncounter(restoredRegionId));
        setRegionEncounterCount(saved.regionEncounterCount ?? 1);
        setRegionRunClosed(saved.regionRunClosed ?? false);
        setShopStats(saved.shopStats ?? defaultShopStats());
        setTypeCatchStats(normalizeTypeCatchStats(saved.typeCatchStats));
        setFavoriteRecords(saved.favoriteRecords ?? {});
        setClaimedAchievements(saved.claimedAchievements ?? []);
        setClaimedTypeSupplies(saved.claimedTypeSupplies ?? []);
        setActiveTab(saved.activeTab ?? 'home');
      }
    } catch {
      // ignore broken local state
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const state: SavedState = {
      inventory,
      score,
      coins,
      streak,
      bestStreak,
      collection,
      history,
      encounter,
      shopStats,
      typeCatchStats,
      claimedAchievements,
      claimedTypeSupplies,
      activeTab,
      selectedRegionId,
      favoriteRecords,
      regionEncounterCount,
      regionRunClosed,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, inventory, score, coins, streak, bestStreak, collection, history, encounter, shopStats, typeCatchStats, claimedAchievements, claimedTypeSupplies, activeTab, selectedRegionId, favoriteRecords, regionEncounterCount, regionRunClosed]);

  useEffect(() => {
    if ((inventory[selectedBall] ?? 0) > 0) return;
    const fallback = ownedBalls[0]?.key ?? 'poke-ball';
    setSelectedBall(fallback);
  }, [inventory, ownedBalls, selectedBall]);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setAuthSession(data))
      .catch(() => setAuthSession(null));
  }, []);

  useEffect(() => {
    if (!dexModal?.slug) {
      setDexDetail(null);
      setDexAction(null);
      return;
    }

    let alive = true;
    setDexDetailLoading(true);
    fetch(`/api/pokedex/${dexModal.slug}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!alive) return;
        setDexDetail(data);
      })
      .catch(() => {
        if (!alive) return;
        setDexDetail(null);
      })
      .finally(() => {
        if (!alive) return;
        setDexDetailLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [dexModal]);

  function consumeBall(ballKey: string) {
    setInventory((prev) => ({ ...prev, [ballKey]: Math.max(0, (prev[ballKey] ?? 0) - 1) }));
  }

  function selectRegion(regionId: string) {
    setSelectedRegionId(regionId);
    setEncounter(createEncounter(regionId));
    setRegionEncounterCount(1);
    setRegionRunClosed(false);
    setLastResult(null);
    setLastReward(null);
  }

  function restartRegionRun(regionId = selectedRegionId) {
    setSelectedRegionId(regionId);
    setEncounter(createEncounter(regionId));
    setRegionEncounterCount(1);
    setRegionRunClosed(false);
    setLastResult(null);
    setLastReward(null);
    setActiveTab('catch');
  }

  async function toggleFavoriteRecord(record: CatchRecord) {
    const recordKey = getRecordKey(record);
    const nextKey = selectedFavoriteRecordKey === recordKey ? null : recordKey;

    setFavoriteRecords((prev) => {
      if (!nextKey) {
        const next = { ...prev };
        delete next[record.slug];
        return next;
      }
      return { ...prev, [record.slug]: nextKey };
    });

    if (!nextKey) {
      setDexAction('즐겨찾기 해제됨');
      return;
    }

    if (authSession?.user?.email) {
      try {
        const response = await fetch('/api/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: record.slug, ballKey: record.ballKey }),
        });
        if (response.ok) {
          setDexAction(`즐겨찾기 저장 · ${getBallLabel(record.ballKey)} 투표 반영`);
          return;
        }
      } catch {
        // ignore network failure, local favorite still wins
      }
      setDexAction('즐겨찾기 저장 · 투표 반영은 잠시 실패');
      return;
    }

    setDexAction('즐겨찾기 저장 · 로그인하면 투표에 자동 반영');
  }

  const nextEncounter = useCallback(() => {
    if (regionEncounterCount >= selectedRegion.maxEncounters) {
      setRegionRunClosed(true);
      setActiveTab('catch');
      return;
    }
    setEncounter(createEncounter(selectedRegionId));
    setRegionEncounterCount((prev) => prev + 1);
    setRegionRunClosed(false);
    setLastResult(null);
    setLastReward(null);
    setActiveTab('catch');
  }, [regionEncounterCount, selectedRegion.maxEncounters, selectedRegionId]);

  function resetRun() {
    setInventory(cloneDefaultInventory());
    setScore(0);
    setCoins(0);
    setStreak(0);
    setBestStreak(0);
    setCollection({});
    setHistory([]);
    setSelectedRegionId(ADVENTURE_REGIONS[0].id);
    setEncounter(createEncounter(ADVENTURE_REGIONS[0].id));
    setRegionEncounterCount(1);
    setRegionRunClosed(false);
    setLastResult(null);
    setLastReward(null);
    setLastShopAction(null);
    setLastAchievementAction(null);
    setLastTypeSupplyAction(null);
    setShopStats(defaultShopStats());
    setTypeCatchStats({});
    setShopQuantities({});
    setClaimedAchievements([]);
    setClaimedTypeSupplies([]);
    setSelectedBall('poke-ball');
    setActiveTab('home');
    setBagOpen(false);
  }

  const moveBall = useCallback((step: -1 | 1) => {
    if (!ownedBalls.length) return;
    const nextIndex = (selectedBallIndex + step + ownedBalls.length) % ownedBalls.length;
    setSelectedBall(ownedBalls[nextIndex].key);
  }, [ownedBalls, selectedBallIndex]);

  const onThrow = useCallback((ballKey: string) => {
    if (encounter.caught || encounter.escaped) return;
    if ((inventory[ballKey] ?? 0) <= 0) return;

    consumeBall(ballKey);
    const result = throwBall(encounter, ballKey);
    setLastResult(result);
    setScore((prev) => prev + result.score);

    const isFirstCatch = !collection[encounter.pokemon.slug];
    const reward = result.success ? getCatchReward(encounter.pokemon, isFirstCatch, result.grade) : null;
    if (reward) {
      setCoins((prev) => prev + reward.coins);
      setLastReward(reward);
    } else {
      setLastReward(null);
    }

    const record: CatchRecord = {
      encounterId: encounter.id,
      slug: encounter.pokemon.slug,
      dex: encounter.pokemon.dex,
      name: encounter.pokemon.name.ko || encounter.pokemon.name.en,
      gender: encounterGender,
      ballKey,
      success: result.success,
      score: result.score,
      title: result.title,
      coins: reward?.coins ?? 0,
      createdAt: new Date().toISOString(),
    };
    setHistory((prev) => [record, ...prev].slice(0, 200));

    if (result.success) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((prev) => Math.max(prev, nextStreak));
      setCollection((prev) => {
        const current = prev[encounter.pokemon.slug];
        if (!current) {
          return { ...prev, [encounter.pokemon.slug]: createCollectionEntry(ballKey, encounterGender) };
        }
        return {
          ...prev,
          [encounter.pokemon.slug]: {
            ...current,
            caughtBalls: current.caughtBalls.includes(ballKey) ? current.caughtBalls : [...current.caughtBalls, ballKey],
            caughtByBall: { ...current.caughtByBall, [ballKey]: (current.caughtByBall[ballKey] ?? 0) + 1 },
            genderCounts: { ...current.genderCounts, [encounterGender]: current.genderCounts[encounterGender] + 1 },
            totalCaught: current.totalCaught + 1,
          },
        };
      });
      setTypeCatchStats((prev) => {
        const next = { ...prev };
        for (const type of encounter.pokemon.types) {
          next[type] = (next[type] ?? 0) + 1;
        }
        return next;
      });
      setEncounter((prev) => ({ ...prev, caught: true }));
      return;
    }

    if (result.escaped) {
      setStreak(0);
      setEncounter((prev) => ({ ...prev, escaped: true }));
      return;
    }

    setStreak(0);
    setEncounter((prev) => ({ ...prev, turn: prev.turn + 1 }));
  }, [collection, encounter, encounterGender, inventory, streak]);

  function changeShopQuantity(ballKey: string, nextQuantity: number) {
    const normalized = SHOP_BUNDLE_STEPS.reduce((closest, step) => {
      return Math.abs(step - nextQuantity) < Math.abs(closest - nextQuantity) ? step : closest;
    }, SHOP_BUNDLE_STEPS[0]);
    setShopQuantities((prev) => ({ ...prev, [ballKey]: normalized }));
  }

  function buyOffer(ballKey: string, quantity: number, price: number, ballName: string) {
    if (coins < price) return;
    const premierBonus = getPremierBonusForPurchase(quantity);
    setCoins((prev) => prev - price);
    setInventory((prev) => ({
      ...prev,
      [ballKey]: (prev[ballKey] ?? 0) + quantity,
      'premier-ball': (prev['premier-ball'] ?? 0) + premierBonus,
    }));
    setShopStats((prev) => ({
      purchaseCount: prev.purchaseCount + 1,
      purchasedBalls: prev.purchasedBalls + quantity,
      premierBonusEarned: prev.premierBonusEarned + premierBonus,
    }));
    setShopQuantities((prev) => ({ ...prev, [ballKey]: SHOP_BUNDLE_STEPS[0] }));
    setSelectedBall(ballKey);
    setLastShopAction(`${ballName} ${quantity}개 구매 · -${price}코인`);
    setShopPopup({ ballKey, ballName, quantity, price, premierBonus });
  }

  function formatAchievementReward(reward: AchievementReward) {
    const parts: string[] = [];
    if (reward.coins) parts.push(`${reward.coins}코인`);
    if (reward.balls?.length) {
      parts.push(...reward.balls.map((entry) => `${getBallLabel(entry.ballKey)} ${entry.count}개`));
    }
    return parts.join(' · ');
  }

  function awardReward(reward: AchievementReward) {
    const rewardCoins = reward.coins ?? 0;
    const rewardBalls = reward.balls ?? [];

    if (rewardCoins > 0) {
      setCoins((prev) => prev + rewardCoins);
    }

    if (rewardBalls.length) {
      setInventory((prev) => {
        const next = { ...prev };
        for (const rewardBall of rewardBalls) {
          next[rewardBall.ballKey] = (next[rewardBall.ballKey] ?? 0) + rewardBall.count;
        }
        return next;
      });
    }
  }

  function claimAchievement(achievement: AchievementDefinition) {
    if (!achievement.unlocked || claimedAchievements.includes(achievement.id)) return;
    awardReward(achievement.reward);
    setClaimedAchievements((prev) => [...prev, achievement.id]);
    setLastAchievementAction(`${achievement.title} 보상 수령 · ${formatAchievementReward(achievement.reward)}`);
  }

  function claimTypeSupply(reward: TypeSupplyDefinition) {
    if (!reward.unlocked || claimedTypeSupplies.includes(reward.id)) return;
    awardReward(reward.reward);
    setClaimedTypeSupplies((prev) => [...prev, reward.id]);
    setLastTypeSupplyAction(`${reward.title} 수령 · ${formatAchievementReward(reward.reward)}`);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingTarget = tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable;
      if (isTypingTarget) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveBall(-1);
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveBall(1);
        return;
      }

      if (event.key === 'z' || event.key === 'Z') {
        event.preventDefault();
        if (encounter.caught || encounter.escaped) {
          nextEncounter();
          return;
        }
        if (!selectedBallEntry) return;
        onThrow(selectedBallEntry.key);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [encounter.caught, encounter.escaped, moveBall, nextEncounter, onThrow, selectedBallEntry]);

  useEffect(() => {
    if (!shopPopup) return;
    const timer = window.setTimeout(() => setShopPopup(null), 2400);
    return () => window.clearTimeout(timer);
  }, [shopPopup]);

  const achievements: AchievementDefinition[] = [
    { id: 'first-catch', title: '첫 포획', desc: '포켓몬 1종을 처음 등록했다.', unlocked: caughtCount >= 1, reward: { coins: 80, balls: [{ ballKey: 'poke-ball', count: 3 }] } },
    { id: 'collector-10', title: '도감 수집가', desc: '포켓몬 10종을 등록했다.', unlocked: caughtCount >= 10, reward: { coins: 180, balls: [{ ballKey: 'great-ball', count: 2 }] } },
    { id: 'collector-30', title: '도감 연구원', desc: '포켓몬 30종을 등록했다.', unlocked: caughtCount >= 30, reward: { coins: 420, balls: [{ ballKey: 'ultra-ball', count: 2 }, { ballKey: 'luxury-ball', count: 1 }] } },
    { id: 'streak-3', title: '감 잡았다', desc: '3연속 포획에 성공했다.', unlocked: bestStreak >= 3, reward: { coins: 120, balls: [{ ballKey: 'quick-ball', count: 1 }] } },
    { id: 'streak-5', title: '포획 마스터 후보', desc: '5연속 포획에 성공했다.', unlocked: bestStreak >= 5, reward: { coins: 260, balls: [{ ballKey: 'quick-ball', count: 2 }, { ballKey: 'ultra-ball', count: 1 }] } },
    { id: 'shop-1', title: '첫 쇼핑', desc: '상점에서 첫 구매를 했다.', unlocked: shopStats.purchaseCount >= 1, reward: { coins: 90, balls: [{ ballKey: 'premier-ball', count: 2 }] } },
    { id: 'premier-bonus', title: '묶음 쇼핑 감각', desc: '볼 상점에서 묶음 구매 흐름을 익혔다.', unlocked: shopStats.premierBonusEarned >= 1, reward: { coins: 150, balls: [{ ballKey: 'luxury-ball', count: 1 }] } },
    { id: 'rich-500', title: '코인 모으는 중', desc: '보유 코인 500 이상을 달성했다.', unlocked: coins >= 500, reward: { coins: 300, balls: [{ ballKey: 'beast-ball', count: 1 }] } },
  ];

  const typeSupplyDefinitions: TypeSupplyDefinition[] = useMemo(() => {
    return Object.entries(TYPE_BALL_HINTS).flatMap(([type, balls]) => {
      const count = typeCatchStats[type] ?? 0;
      const stages = [
        { stage: 1, target: 5, coins: 70, balls: [{ ballKey: balls[0], count: 2 }] },
        { stage: 2, target: 12, coins: 150, balls: [{ ballKey: balls[0], count: 2 }, { ballKey: balls[1] ?? balls[0], count: 1 }] },
        { stage: 3, target: 25, coins: 260, balls: [{ ballKey: balls[1] ?? balls[0], count: 2 }, { ballKey: balls[2] ?? balls[0], count: 1 }] },
      ];
      return stages.map((stageDef) => ({
        id: `type-${type.toLowerCase()}-${stageDef.stage}`,
        type,
        stage: stageDef.stage,
        target: stageDef.target,
        title: `${type} 보급 ${stageDef.stage}단계`,
        desc: `${type} 타입 포켓몬을 ${stageDef.target}회 포획했다.`,
        unlocked: count >= stageDef.target,
        reward: { coins: stageDef.coins, balls: stageDef.balls },
      }));
    });
  }, [typeCatchStats]);

  const claimableAchievementCount = achievements.filter((achievement) => achievement.unlocked && !claimedAchievements.includes(achievement.id)).length;
  const claimableTypeSupplyCount = typeSupplyDefinitions.filter((reward) => reward.unlocked && !claimedTypeSupplies.includes(reward.id)).length;
  const visibleTypeSupplyDefinitions = typeSupplyDefinitions
    .filter((reward) => reward.unlocked || (typeCatchStats[reward.type] ?? 0) > 0)
    .sort((a, b) => {
      const progressDiff = (typeCatchStats[b.type] ?? 0) - (typeCatchStats[a.type] ?? 0);
      if (progressDiff !== 0) return progressDiff;
      return a.target - b.target;
    });

  return (
    <>
      <div className="space-y-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Game hub</p>
              <h2 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">포획 미니게임 허브</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                잡기 / 상점 / 도감 / 업적을 한 곳에서 돌면서 코인과 컬렉션을 키운다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setActiveTab('catch')} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                바로 잡기 시작
              </button>
              <button onClick={resetRun} className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:border-rose-400 dark:border-rose-900 dark:text-rose-200">
                진행 초기화
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-200 pt-5 dark:border-zinc-800">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? 'bg-emerald-600 text-white' : 'border border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-100'}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {activeTab !== 'catch' ? (
          <section className="grid gap-4 md:grid-cols-5">
            <StatCard label="총 점수" value={`${score}점`} tone="emerald" />
            <StatCard label="보유 코인" value={`${coins}`} tone="amber" />
            <StatCard label="최고 연속" value={`${bestStreak}회`} tone="sky" />
            <StatCard label="도감 등록" value={`${caughtCount}종`} tone="emerald" />
            <StatCard label="보상 대기" value={`${claimableAchievementCount + claimableTypeSupplyCount}개`} tone="zinc" />
          </section>
        ) : null}

        {activeTab === 'home' ? (
          <section className="space-y-6">
            <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">지방 선택</h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">지방별 분위기와 탐험 길이를 나눠서 돈다.</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  현재 지방 {selectedRegion.name.ko} · {selectedRegionCaught}/{selectedRegionTotal} 등록 · {selectedRegionRemaining}/{selectedRegion.maxEncounters} 남음
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
                {regions.map((region) => {
                  const active = region.id === selectedRegionId;
                  const regionCaught = allPokemon.filter((pokemon) => pokemon.generation === region.generation && collection[pokemon.slug]).length;
                  const regionTotal = allPokemon.filter((pokemon) => pokemon.generation === region.generation).length;
                  return (
                    <button
                      key={`region-${region.id}`}
                      type="button"
                      onClick={() => selectRegion(region.id)}
                      className={`rounded-3xl border p-4 text-left transition ${active ? 'border-emerald-300 bg-emerald-50 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950/60'}`}
                    >
                      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${region.art.accent} p-4 text-zinc-950`}>
                        <div className={`absolute inset-0 ${region.art.glow}`} />
                        <div className="relative flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-700/80">Gen {region.generation}</p>
                            <p className="mt-1 text-xl font-black">{region.name.ko}</p>
                            <p className="mt-1 text-xs font-medium text-zinc-800/80">{region.name.en}</p>
                          </div>
                          <span className="text-3xl leading-none">{region.art.emoji}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">최대 인카운터 {region.maxEncounters}</p>
                        </div>
                        {active ? <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">현재</span> : null}
                      </div>
                      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{region.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        <span>도감 {regionCaught}/{regionTotal}</span>
                        <span>·</span>
                        <span>탐험 {region.maxEncounters}회</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>

            <section className="grid gap-6 lg:grid-cols-2">
            <HubCard
              title="잡기"
              desc={`${selectedRegion.name.ko} 지방에서만 야생 포켓몬을 만나고, 점수와 코인을 벌어온다.`}
              actionLabel="포획하러 가기"
              onAction={() => setActiveTab('catch')}
              tone="emerald"
            >
              <p className="text-sm text-zinc-600 dark:text-zinc-300">현재 지방: {selectedRegion.name.ko} · 인카운터 {selectedRegionRemaining}/{selectedRegion.maxEncounters} · 현재 선택 볼: {selectedBallEntry?.nameKo ?? '없음'}</p>
            </HubCard>
            <HubCard
              title="상점"
              desc="코인으로 볼을 묶음 구매하고 필요한 재고를 채운다."
              actionLabel="상점 보기"
              onAction={() => setActiveTab('shop')}
              tone="amber"
            >
              <p className="text-sm text-zinc-600 dark:text-zinc-300">총 구매 {shopStats.purchaseCount}회 · 구매한 볼 {shopStats.purchasedBalls}개</p>
            </HubCard>
            <HubCard
              title="도감"
              desc="지방별로 잡은 포켓몬을 진짜 도감처럼 모으고 상세 정보를 확인한다."
              actionLabel="도감 보기"
              onAction={() => setActiveTab('dex')}
              tone="sky"
            >
              <p className="text-sm text-zinc-600 dark:text-zinc-300">등록 {caughtCount}종 · 성공 포획 {successfulCatchCount}회</p>
            </HubCard>
            <HubCard
              title="업적"
              desc="연속 포획, 수집, 쇼핑, 타입 보급까지 한 번에 관리한다."
              actionLabel="업적 보기"
              onAction={() => setActiveTab('achievements')}
              tone="zinc"
            >
              <p className="text-sm text-zinc-600 dark:text-zinc-300">해금 {unlockedAchievementCount} / {achievements.length} · 업적 대기 {claimableAchievementCount}개 · 타입 보급 대기 {claimableTypeSupplyCount}개</p>
              {topTypeEntry ? <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">현재 가장 많이 잡은 타입: {topTypeEntry[0]} {topTypeEntry[1]}회</p> : null}
            </HubCard>
            </section>
          </section>
        ) : null}

        {activeTab === 'catch' ? (
          <section className="space-y-6">
            <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Wild encounter</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-200">현재 탐험 지역 · {selectedRegion.name.ko}</p>
                    <p className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">남은 인카운터 · {selectedRegionRemaining}/{selectedRegion.maxEncounters}</p>
                  </div>
                  <h3 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    야생의 {encounter.pokemon.name.ko || encounter.pokemon.name.en} 등장!
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${encounterBadge.tone}`}>{encounterBadge.label}</span>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      #{encounter.pokemon.dex} · {genderLabel(encounterGender)} · {formatGenerationLabel(locale, encounter.pokemon.generation)} · {encounter.pokemon.types.join(' / ')}
                    </p>
                  </div>
                </div>
                <div className="rounded-3xl bg-zinc-50 p-3 dark:bg-zinc-800/80">
                  <PokemonSprite
                    dex={encounter.pokemon.dex}
                    baseSprite={encounter.pokemon.sprite}
                    gender={encounterGender}
                    name={encounter.pokemon.name.en}
                    size={112}
                    className="h-28 w-28"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {encounter.pokemon.recommendedBall ? <BallChip ballKey={encounter.pokemon.recommendedBall.key} /> : null}
                {encounter.pokemon.altBalls.slice(0, 3).map((ballKey) => <BallChip key={ballKey} ballKey={ballKey} />)}
              </div>

              <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950/60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">현재 턴</p>
                    <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{encounter.turn}번째 던지기</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">이번 탐험</p>
                    <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{regionEncounterCount} / {selectedRegion.maxEncounters}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={nextEncounter} disabled={regionRunClosed} className={`rounded-full border px-4 py-2 text-sm font-semibold ${regionRunClosed ? 'cursor-not-allowed border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-500' : 'border-zinc-300 text-zinc-800 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-100'}`}>
                      새 포켓몬
                    </button>
                    <button onClick={() => setActiveTab('shop')} className="rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 hover:border-amber-400 dark:border-amber-900 dark:text-amber-200">
                      상점 이동
                    </button>
                  </div>
                </div>

                {lastResult ? (
                  <div className="mt-4 rounded-2xl bg-white p-4 dark:bg-zinc-900">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{lastResult.success ? `포획 성공 · ${lastResult.title}` : lastResult.title}</p>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{lastResult.detail}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">성공 확률</p>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{Math.round(lastResult.chance * 100)}%</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                      판정 점수 +{lastResult.score} · 주사위 {Math.round(lastResult.roll * 100)} / 100
                    </p>
                    {lastReward ? (
                      <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
                        <span className="font-semibold">{lastReward.label}</span> · +{lastReward.coins}코인
                        {lastReward.scoreBonus > 0 ? ` · 미적 보너스 +${lastReward.scoreBonus}` : ''}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">어떤 볼을 던질까?</p>
                )}

                {regionRunClosed ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{selectedRegion.name.ko} 탐험 종료</p>
                    <p className="mt-1 text-sm text-emerald-800/90 dark:text-emerald-200/90">이번 런은 {selectedRegion.maxEncounters}회까지 다 돌았다. 같은 지방을 다시 돌거나 다른 지방으로 넘어가면 된다.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => restartRegionRun()} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">같은 지방 다시 탐험</button>
                      <button onClick={() => setActiveTab('home')} className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800 hover:border-emerald-400 dark:border-emerald-800 dark:text-emerald-200">지방 선택으로</button>
                    </div>
                  </div>
                ) : null}

                {encounter.caught || encounter.escaped ? (
                  <div className="mt-4">
                    <button onClick={nextEncounter} disabled={regionRunClosed} className={`rounded-full px-5 py-2.5 text-sm font-semibold ${regionRunClosed ? 'cursor-not-allowed bg-zinc-300 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                      다음 야생 포켓몬 만나기
                    </button>
                  </div>
                ) : null}
              </div>
            </article>

            <div className="space-y-6">
              <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">내 가방</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBagOpen(true)}
                    className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-100"
                  >
                    가방 열기
                  </button>
                </div>

                <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-950/60">
                  {selectedBallEntry ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => moveBall(-1)}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 text-xl font-bold text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-200"
                        >
                          ←
                        </button>
                        <div className="flex flex-1 flex-col items-center text-center">
                          <div className="rounded-full bg-white p-5 shadow-sm dark:bg-zinc-900">
                            <BallIcon ballKey={selectedBallEntry.key} size={72} />
                          </div>
                          <div className="mt-4 flex min-h-[72px] flex-col items-center justify-start">
                            <p className="line-clamp-2 max-w-[180px] text-xl font-bold leading-7 text-zinc-900 dark:text-zinc-100">{selectedBallEntry.nameKo}</p>
                            <p className="mt-1 line-clamp-1 max-w-[180px] text-sm text-zinc-500 dark:text-zinc-400">{selectedBallEntry.nameEn}</p>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                              x{inventory[selectedBallEntry.key] ?? 0}
                            </span>
                            <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                              {selectedBallIndex + 1} / {ownedBalls.length}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => moveBall(1)}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 text-xl font-bold text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-200"
                        >
                          →
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={encounter.caught || encounter.escaped || (inventory[selectedBallEntry.key] ?? 0) <= 0}
                        onClick={() => onThrow(selectedBallEntry.key)}
                        className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700"
                      >
                        {encounter.caught ? '이미 잡았다' : encounter.escaped ? '이미 도망갔다' : '선택한 볼 던지기'}
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">사용 가능한 볼이 없다. 상점에서 재보급하거나 진행을 리셋해 다시 시작할 수 있다.</p>
                  )}
                </div>
              </article>

              <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">현재 진행</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  <StatCard label="총 점수" value={`${score}점`} tone="emerald" />
                  <StatCard label="보유 코인" value={`${coins}`} tone="amber" />
                  <StatCard label="최고 연속" value={`${bestStreak}회`} tone="sky" />
                  <StatCard label="도감 등록" value={`${caughtCount}종`} tone="emerald" />
                  <StatCard label="보상 대기" value={`${claimableAchievementCount + claimableTypeSupplyCount}개`} tone="zinc" />
                </div>
              </article>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              도움말 · ← → 볼 선택 · Z 던지기 · 포획 끝나면 Z로 다음 야생 포켓몬
            </div>
          </section>
        ) : null}

        {activeTab === 'shop' ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">볼 상점</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">묶음으로 사고 원하는 볼 재고를 채운다.</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">보유 코인 {coins}</span>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <MiniStat label="구매 횟수" value={`${shopStats.purchaseCount}회`} />
              <MiniStat label="구매한 볼" value={`${shopStats.purchasedBalls}개`} />
              <MiniStat label="상점 이용" value={shopStats.purchaseCount > 0 ? '활성' : '대기'} />
            </div>

            {lastShopAction ? (
              <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
                {lastShopAction}
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-3 gap-3">
              {shopOffers.map((offer) => {
                const owned = inventory[offer.ballKey] ?? 0;
                const selectedBundles = shopQuantities[offer.ballKey] ?? SHOP_BUNDLE_STEPS[0];
                const totalQuantity = offer.quantity * selectedBundles;
                const totalPrice = offer.price * selectedBundles;
                const affordable = coins >= totalPrice;
                const selectedStepIndex = Math.max(0, SHOP_BUNDLE_STEPS.indexOf(selectedBundles as (typeof SHOP_BUNDLE_STEPS)[number]));
                const previousStep = SHOP_BUNDLE_STEPS[Math.max(0, selectedStepIndex - 1)];
                const nextStep = SHOP_BUNDLE_STEPS[Math.min(SHOP_BUNDLE_STEPS.length - 1, selectedStepIndex + 1)];
                return (
                  <div key={offer.ballKey} className={`rounded-2xl border p-4 ${offer.featured ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/60'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <BallIcon ballKey={offer.ballKey} size={30} />
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{offer.ball.nameKo}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">현재 x{owned} · 묶음당 {offer.quantity}개</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">{offer.price}코인</span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">구매 수량</p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => changeShopQuantity(offer.ballKey, previousStep)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-lg font-bold text-zinc-700 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
                            disabled={selectedStepIndex === 0}
                          >
                            −
                          </button>
                          <div className="min-w-[88px] text-center">
                            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{totalQuantity}개</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">× {selectedBundles}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => changeShopQuantity(offer.ballKey, nextStep)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-lg font-bold text-zinc-700 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
                            disabled={selectedStepIndex === SHOP_BUNDLE_STEPS.length - 1}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">합계</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalPrice}코인</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {SHOP_BUNDLE_STEPS.map((step) => {
                          const active = step === selectedBundles;
                          return (
                            <button
                              key={`${offer.ballKey}-${step}`}
                              type="button"
                              onClick={() => changeShopQuantity(offer.ballKey, step)}
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${active ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'}`}
                            >
                              ×{step}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!affordable}
                      onClick={() => buyOffer(offer.ballKey, totalQuantity, totalPrice, offer.ball.nameKo)}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700"
                    >
                      {affordable ? '구매하기' : `${totalPrice - coins}코인 부족`}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {activeTab === 'dex' ? (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <MiniStat label="도감 등록" value={`${caughtCount}종`} />
              <MiniStat label="전체 도감" value={`${allPokemon.length}종`} />
              <MiniStat label="등록률" value={`${Math.round((caughtCount / allPokemon.length) * 100)}%`} />
              <MiniStat label="세대 구간" value={`${pokemonByGeneration.length}개`} />
            </div>

            <div className="flex flex-wrap gap-2">
              {pokemonByGeneration.map(({ generation, pokemon }) => {
                const active = generation === activeDexGeneration.generation;
                const generationCaught = pokemon.filter((item) => collection[item.slug]).length;
                return (
                  <button
                    key={`dex-gen-tab-${generation}`}
                    type="button"
                    onClick={() => setSelectedDexGeneration(generation)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'}`}
                  >
                    {formatGenerationLabel(locale, generation)} · {generationCaught}/{pokemon.length}
                  </button>
                );
              })}
            </div>

            <article className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{formatGenerationLabel(locale, activeDexGeneration.generation)}</h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">번호순 정렬 · 스프라이트 중심 도감 · 클릭하면 상세 확인</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  {activeDexGeneration.pokemon.filter((item) => collection[item.slug]).length}/{activeDexGeneration.pokemon.length} 등록
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                {activeDexGeneration.pokemon.map((item) => {
                  const caughtEntry = collection[item.slug] ?? null;
                  const isCaught = Boolean(caughtEntry);
                  return (
                    <button
                      key={`dex-${item.slug}`}
                      type="button"
                      onClick={() => setDexModal({ slug: item.slug })}
                      title={item.name.ko || item.name.en}
                      className={`rounded-2xl border px-2 py-3 text-center transition ${isCaught ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-300 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950/60'}`}
                    >
                      <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">#{item.dex}</p>
                      <div className="mt-2 flex justify-center">
                        <PokemonSprite
                          dex={item.dex}
                          baseSprite={item.sprite}
                          gender="unknown"
                          name={item.name.ko || item.name.en}
                          size={56}
                          className={`h-14 w-14 ${isCaught ? '' : 'grayscale opacity-70'}`}
                        />
                      </div>
                      <p className={`mt-2 line-clamp-1 text-xs font-semibold ${isCaught ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {item.name.ko || item.name.en}
                      </p>
                    </button>
                  );
                })}
              </div>
            </article>
          </section>
        ) : null}

        {activeTab === 'history' ? (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <MiniStat label="전체 기록" value={`${history.length}건`} />
              <MiniStat label="성공 포획" value={`${successfulCatchCount}회`} />
              <MiniStat label="도감 등록" value={`${caughtCount}종`} />
              <MiniStat label="최고 연속" value={`${bestStreak}회`} />
            </div>

            <article className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">최근 포획 기록</h3>
              <div className="mt-4 space-y-3">
                {history.length ? history.map((item) => {
                  const pokemon = pokemonDataMap.get(item.slug);
                  const availableGenders = pokemon ? getAvailableGenders(pokemon.genderRate) : ['unknown'];
                  const genderText = availableGenders.includes(item.gender) ? (item.gender === 'unknown' ? '무성' : genderLabel(item.gender)) : '';
                  return (
                    <div key={`${item.encounterId}-${item.ballKey}-${item.createdAt}`} className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-4 py-3 dark:bg-zinc-950/60">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-2xl bg-white p-2 dark:bg-zinc-900">
                          <PokemonSprite
                            dex={item.dex}
                            baseSprite={pokemonDataMap.get(item.slug)?.sprite ?? ''}
                            gender={item.gender}
                            name={item.name}
                            size={32}
                            className="h-8 w-8"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.name}{genderText ? ` ${genderText}` : ''}</p>
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{item.success ? '포획 성공' : '포획 실패'} · {item.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">+{item.coins}코인</span>
                        <BallIcon ballKey={item.ballKey} size={20} />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">+{item.score}</span>
                      </div>
                    </div>
                  );
                }) : <p className="text-sm text-zinc-600 dark:text-zinc-300">아직 던진 기록이 없다.</p>}
              </div>
            </article>
          </section>
        ) : null}

        {activeTab === 'achievements' ? (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-5">
              <MiniStat label="해금 업적" value={`${unlockedAchievementCount}/${achievements.length}`} />
              <MiniStat label="업적 대기" value={`${claimableAchievementCount}개`} />
              <MiniStat label="타입 보급 대기" value={`${claimableTypeSupplyCount}개`} />
              <MiniStat label="최고 연속" value={`${bestStreak}회`} />
              <MiniStat label="도감 등록" value={`${caughtCount}종`} />
            </div>

            {lastAchievementAction ? (
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                {lastAchievementAction}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {achievements.map((achievement) => {
                const claimed = claimedAchievements.includes(achievement.id);
                const claimable = achievement.unlocked && !claimed;
                return (
                  <div key={achievement.id} className={`rounded-2xl border p-4 ${achievement.unlocked ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{achievement.title}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${claimed ? 'bg-sky-600 text-white' : achievement.unlocked ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'}`}>
                        {claimed ? '수령 완료' : achievement.unlocked ? '수령 가능' : '잠김'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{achievement.desc}</p>
                    <div className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200">
                      보상: {formatAchievementReward(achievement.reward)}
                    </div>
                    <button
                      type="button"
                      disabled={!claimable}
                      onClick={() => claimAchievement(achievement)}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700"
                    >
                      {claimed ? '수령 완료' : claimable ? '보상 받기' : '조건 미달'}
                    </button>
                  </div>
                );
              })}
            </div>

            <article className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">타입 보급 보상</h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">특정 타입을 많이 잡으면 그 타입 분위기에 맞는 볼을 보급 상자로 챙길 수 있다.</p>
                </div>
                {topTypeEntry ? <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-200">최다 타입 {topTypeEntry[0]} · {topTypeEntry[1]}회</span> : null}
              </div>

              {lastTypeSupplyAction ? (
                <div className="mt-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
                  {lastTypeSupplyAction}
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleTypeSupplyDefinitions.length ? visibleTypeSupplyDefinitions.map((reward) => {
                  const claimed = claimedTypeSupplies.includes(reward.id);
                  const claimable = reward.unlocked && !claimed;
                  const progress = typeCatchStats[reward.type] ?? 0;
                  return (
                    <div key={reward.id} className={`rounded-2xl border p-4 ${reward.unlocked ? 'border-sky-300 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/20' : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{reward.title}</p>
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{reward.type} · {reward.stage}단계</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${claimed ? 'bg-sky-600 text-white' : reward.unlocked ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'}`}>
                          {claimed ? '수령 완료' : reward.unlocked ? '수령 가능' : `${progress}/${reward.target}`}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{reward.desc}</p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${Math.min(100, (progress / reward.target) * 100)}%` }} />
                      </div>
                      <div className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200">
                        보상: {formatAchievementReward(reward.reward)}
                      </div>
                      <button
                        type="button"
                        disabled={!claimable}
                        onClick={() => claimTypeSupply(reward)}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700"
                      >
                        {claimed ? '수령 완료' : claimable ? '보급 받기' : '조건 미달'}
                      </button>
                    </div>
                  );
                }) : <p className="text-sm text-zinc-600 dark:text-zinc-300">아직 특정 타입을 누적해서 잡은 기록이 없다.</p>}
              </div>
            </article>
          </section>
        ) : null}
      </div>

      {shopPopup ? (
        <div className="pointer-events-none fixed inset-x-0 top-6 z-40 flex justify-center px-4">
          <div className="pointer-events-auto w-full max-w-sm rounded-3xl border border-emerald-300 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-emerald-900 dark:bg-zinc-900/95">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/40">
                <BallIcon ballKey={shopPopup.ballKey} size={28} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">구매 완료</p>
                <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">{shopPopup.ballName} {shopPopup.quantity}개</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">-{shopPopup.price}코인{shopPopup.premierBonus > 0 ? ` · 프리미어볼 +${shopPopup.premierBonus}` : ''}</p>
              </div>
              <button
                type="button"
                onClick={() => setShopPopup(null)}
                className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {dexModal && selectedDexPokemon ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDexModal(null)}>
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`rounded-3xl p-3 ${selectedDexEntry ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-zinc-100 dark:bg-zinc-900'}`}>
                  <PokemonSprite
                    dex={selectedDexPokemon.dex}
                    baseSprite={selectedDexPokemon.sprite}
                    gender="unknown"
                    name={selectedDexPokemon.name.ko || selectedDexPokemon.name.en}
                    size={88}
                    className={`h-[88px] w-[88px] ${selectedDexEntry ? '' : 'grayscale opacity-70'}`}
                  />
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">#{selectedDexPokemon.dex} · {formatGenerationLabel(locale, selectedDexPokemon.generation)}</p>
                  <h3 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{selectedDexPokemon.name.ko || selectedDexPokemon.name.en}</h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{selectedDexPokemon.types.join(' / ')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDexModal(null)}
                className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-200"
              >
                닫기
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {selectedDexEntry ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <MiniStat label="총 포획" value={`${selectedDexEntry.totalCaught}회`} />
                    <MiniStat label="즐겨찾기" value={selectedFavoriteRecordKey ? '지정됨' : '없음'} />
                    <MiniStat label="사용 볼 수" value={`${selectedDexEntry.caughtBalls.length}종`} />
                  </div>

                  {dexAction ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                      {dexAction}
                    </div>
                  ) : null}

                    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {getAvailableGenders(selectedDexPokemon.genderRate).map((gender) => (
                        <div key={`dex-modal-gender-${gender}`} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                          <PokemonSprite
                            dex={selectedDexPokemon.dex}
                            baseSprite={selectedDexPokemon.sprite}
                            gender={gender}
                            name={selectedDexPokemon.name.ko || selectedDexPokemon.name.en}
                            size={28}
                            className="h-7 w-7"
                          />
                          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                            <span>{getGenderCountLabel(gender, selectedDexEntry.genderCounts[gender] ?? 0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                      <div className="flex flex-wrap gap-2">
                        {dexDetailLoading ? <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">도감 불러오는 중</span> : null}
                        {dexDetail?.genus ? <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">{dexDetail.genus}</span> : null}
                        {dexDetail?.habitat ? <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">서식지 {dexDetail.habitat}</span> : null}
                        {dexDetail?.shape ? <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">체형 {dexDetail.shape}</span> : null}
                      </div>
                      <p className="mt-4 text-sm leading-6 text-zinc-700 dark:text-zinc-200">{dexDetail?.flavorText || '도감 설명을 불러오는 중이다.'}</p>
                    </div>

                    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                      <div className="grid grid-cols-2 gap-3">
                        <MiniStat label="키" value={dexDetail ? `${dexDetail.heightM}m` : '...'} />
                        <MiniStat label="몸무게" value={dexDetail ? `${dexDetail.weightKg}kg` : '...'} />
                        <MiniStat label="포획률" value={dexDetail ? `${dexDetail.captureRate}` : '...'} />
                        <MiniStat label="특성 수" value={dexDetail ? `${dexDetail.abilities.length}` : '...'} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(dexDetail?.abilities ?? []).map((ability) => (
                          <span key={`ability-${ability.name}`} className={`rounded-full px-3 py-1 text-xs font-semibold ${ability.hidden ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-white text-zinc-700 dark:bg-zinc-950 dark:text-zinc-200'}`}>
                            {ability.name}{ability.hidden ? ' · 숨겨진 특성' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">포획 기록</h4>
                      {authSession?.user?.email ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">즐겨찾기 = 투표 자동 반영</span> : <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">로그인 시 투표 자동 반영</span>}
                    </div>
                    <div className="space-y-2">
                      {selectedPokemonRecords.map((record) => {
                        const recordKey = getRecordKey(record);
                        const active = selectedFavoriteRecordKey === recordKey;
                        const genderText = record.gender === 'unknown' ? '무성' : genderLabel(record.gender);
                        return (
                          <div key={recordKey} className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${active ? 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20' : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}`}>
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="rounded-2xl bg-zinc-50 p-2 dark:bg-zinc-950">
                                <PokemonSprite
                                  dex={record.dex}
                                  baseSprite={selectedDexPokemon.sprite}
                                  gender={record.gender}
                                  name={record.name}
                                  size={28}
                                  className="h-7 w-7"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <BallIcon ballKey={record.ballKey} size={16} />
                                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{getBallLabel(record.ballKey)}</span>
                                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{genderText}</span>
                                  {active ? <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">즐겨찾기</span> : null}
                                </div>
                                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{record.title} · {formatRecordTime(record.createdAt)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleFavoriteRecord(record)}
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${active ? 'bg-amber-500 text-white hover:bg-amber-600' : 'border border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-200'}`}
                            >
                              {active ? '대표 선택됨' : '대표로 선택'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  아직 포획 기록이 없다. 잡기 탭에서 만나면 컬러 스프라이트와 포획 정보가 채워진다.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {bagOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/55 p-0 sm:p-4" onClick={() => setBagOpen(false)}>
          <div className="w-full rounded-t-3xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:mx-auto sm:max-w-4xl sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">볼 가방</h3>
              </div>
              <button onClick={() => setBagOpen(false)} className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                닫기
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {ownedBalls.map((ball) => {
                const active = selectedBall === ball.key;
                return (
                  <button
                    key={ball.key}
                    type="button"
                    onClick={() => {
                      setSelectedBall(ball.key);
                      setBagOpen(false);
                    }}
                    className={`flex min-h-32 flex-col items-center justify-center rounded-2xl border p-3 text-center transition ${active ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900'}`}
                  >
                    <BallIcon ballKey={ball.key} size={36} />
                    <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{ball.nameKo}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">x{inventory[ball.key] ?? 0}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function HubCard({
  title,
  desc,
  actionLabel,
  onAction,
  tone,
  children,
}: {
  title: string;
  desc: string;
  actionLabel: string;
  onAction: () => void;
  tone: 'emerald' | 'amber' | 'sky' | 'zinc';
  children: ReactNode;
}) {
  const toneClass = {
    emerald: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20',
    amber: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20',
    sky: 'border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/20',
    zinc: 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900',
  }[tone];

  return (
    <article className={`rounded-3xl border p-6 ${toneClass}`}>
      <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{desc}</p>
      <div className="mt-4">{children}</div>
      <button onClick={onAction} className="mt-5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
        {actionLabel}
      </button>
    </article>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'sky' | 'amber' | 'zinc' }) {
  const toneClass = {
    emerald: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40',
    sky: 'border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40',
    amber: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40',
    zinc: 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900',
  }[tone];

  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950/60">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}
