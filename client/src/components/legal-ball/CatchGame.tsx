'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { BallChip } from '@/components/legal-ball/BallChip';
import { BallIcon } from '@/components/legal-ball/BallIcon';
import { getPokemonList } from '@/lib/ball-data';
import { CatchResult, CatchReward, DEFAULT_INVENTORY, Encounter, Inventory, SHOP_BUNDLE_STEPS, createEncounter, getCatchReward, getOwnedBalls, getPremierBonusForPurchase, getShopOffers, throwBall } from '@/lib/catch-game';

const STORAGE_KEY = 'poke-bowl-catch-game-v1';
const pokemonNameMap = new Map(getPokemonList().map((item) => [item.slug, item.name.ko || item.name.en]));

type CatchRecord = {
  encounterId: string;
  slug: string;
  dex: number;
  name: string;
  ballKey: string;
  success: boolean;
  score: number;
  title: string;
  coins: number;
  createdAt: string;
};

type SavedState = {
  inventory: Inventory;
  score: number;
  coins: number;
  streak: number;
  collection: Record<string, string>;
  history: CatchRecord[];
  encounter: Encounter;
};

function cloneDefaultInventory() {
  return JSON.parse(JSON.stringify(DEFAULT_INVENTORY)) as Inventory;
}

export function CatchGame() {
  const [inventory, setInventory] = useState<Inventory>(cloneDefaultInventory);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [streak, setStreak] = useState(0);
  const [collection, setCollection] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<CatchRecord[]>([]);
  const [encounter, setEncounter] = useState<Encounter>(() => createEncounter());
  const [selectedBall, setSelectedBall] = useState('poke-ball');
  const [lastResult, setLastResult] = useState<CatchResult | null>(null);
  const [lastReward, setLastReward] = useState<CatchReward | null>(null);
  const [lastShopAction, setLastShopAction] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const bagScrollRef = useRef<HTMLDivElement | null>(null);

  const ownedBalls = useMemo(() => getOwnedBalls(inventory), [inventory]);
  const shopOffers = useMemo(() => getShopOffers(), []);
  const totalBalls = useMemo(() => Object.values(inventory).reduce((sum, count) => sum + count, 0), [inventory]);
  const caughtCount = Object.keys(collection).length;
  const selectedBallIndex = Math.max(0, ownedBalls.findIndex((ball) => ball.key === selectedBall));
  const selectedBallEntry = ownedBalls[selectedBallIndex] ?? ownedBalls[0] ?? null;
  const encounterBadge = encounter.pokemon.isMythical
    ? { label: 'MYTHICAL', tone: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200' }
    : encounter.pokemon.isLegendary
      ? { label: 'LEGENDARY', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' }
      : encounter.pokemon.curated
        ? { label: 'CURATED', tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' }
        : { label: 'WILD', tone: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200' };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as SavedState;
        setInventory(saved.inventory ?? cloneDefaultInventory());
        setScore(saved.score ?? 0);
        setCoins(saved.coins ?? 0);
        setStreak(saved.streak ?? 0);
        setCollection(saved.collection ?? {});
        setHistory(saved.history ?? []);
        setEncounter(saved.encounter ?? createEncounter());
      }
    } catch {
      // ignore broken local state
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const state: SavedState = { inventory, score, coins, streak, collection, history, encounter };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, inventory, score, coins, streak, collection, history, encounter]);

  useEffect(() => {
    if ((inventory[selectedBall] ?? 0) > 0) return;
    const fallback = ownedBalls[0]?.key ?? 'poke-ball';
    setSelectedBall(fallback);
  }, [inventory, ownedBalls, selectedBall]);

  function consumeBall(ballKey: string) {
    setInventory((prev) => ({ ...prev, [ballKey]: Math.max(0, (prev[ballKey] ?? 0) - 1) }));
  }

  function nextEncounter() {
    setEncounter(createEncounter());
    setLastResult(null);
    setLastReward(null);
  }

  function resetRun() {
    setInventory(cloneDefaultInventory());
    setScore(0);
    setCoins(0);
    setStreak(0);
    setCollection({});
    setHistory([]);
    setEncounter(createEncounter());
    setLastResult(null);
    setLastReward(null);
    setLastShopAction(null);
    setSelectedBall('poke-ball');
    setBagOpen(false);
  }

  function moveBall(step: -1 | 1) {
    if (!ownedBalls.length) return;
    const nextIndex = (selectedBallIndex + step + ownedBalls.length) % ownedBalls.length;
    setSelectedBall(ownedBalls[nextIndex].key);
  }

  function onThrow(ballKey: string) {
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
      ballKey,
      success: result.success,
      score: result.score,
      title: result.title,
      coins: reward?.coins ?? 0,
      createdAt: new Date().toISOString(),
    };
    setHistory((prev) => [record, ...prev].slice(0, 20));

    if (result.success) {
      setStreak((prev) => prev + 1);
      setCollection((prev) => ({ ...prev, [encounter.pokemon.slug]: ballKey }));
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
    setSelectedBall(ballKey);
    setLastShopAction(`${ballName} ${quantity}개 구매 · -${price}코인${premierBonus > 0 ? ` · 프리미어볼 ${premierBonus}개 서비스` : ''}`);
  }

  function handleBagWheel(event: React.WheelEvent<HTMLDivElement>) {
    const el = bagScrollRef.current;
    if (!el) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) && event.deltaX === 0) return;
    event.preventDefault();
    el.scrollLeft += Math.abs(event.deltaX) > 0 ? event.deltaX : event.deltaY;
  }

  return (
    <>
      <div className="space-y-8">
        <section className="grid gap-4 md:grid-cols-5">
          <StatCard label="총 점수" value={`${score}점`} tone="emerald" />
          <StatCard label="보유 코인" value={`${coins}`} tone="amber" />
          <StatCard label="연속 포획" value={`${streak}회`} tone="sky" />
          <StatCard label="컬렉션" value={`${caughtCount}종`} tone="emerald" />
          <StatCard label="남은 볼" value={`${totalBalls}개`} tone="zinc" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Wild encounter</p>
                <h2 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  야생의 {encounter.pokemon.name.ko || encounter.pokemon.name.en} 등장!
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${encounterBadge.tone}`}>{encounterBadge.label}</span>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    #{encounter.pokemon.dex} · Gen {encounter.pokemon.generation} · {encounter.pokemon.types.join(' / ')}
                  </p>
                </div>
              </div>
              <div className="rounded-3xl bg-zinc-50 p-3 dark:bg-zinc-800/80">
                <img src={encounter.pokemon.sprite} alt={encounter.pokemon.name.en} className="h-28 w-28" style={{ imageRendering: 'pixelated' }} />
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
                <div className="flex gap-2">
                  <button onClick={nextEncounter} className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-100">
                    새 포켓몬
                  </button>
                  <button onClick={resetRun} className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:border-rose-400 dark:border-rose-900 dark:text-rose-200">
                    가방 리셋
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

              {encounter.caught || encounter.escaped ? (
                <div className="mt-4">
                  <button onClick={nextEncounter} className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                    다음 야생 포켓몬 만나기
                  </button>
                </div>
              ) : null}
            </div>
          </article>

          <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">내 가방</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">평소엔 선택한 볼만 보고, 필요할 때만 가방을 연다.</p>
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
                <p className="text-sm text-zinc-600 dark:text-zinc-300">사용 가능한 볼이 없다. 가방을 리셋해 다시 시작할 수 있다.</p>
              )}
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">최근 포획 기록</h3>
            <div className="mt-4 space-y-3">
              {history.length ? history.map((item) => (
                <div key={`${item.encounterId}-${item.ballKey}-${item.createdAt}`} className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-4 py-3 dark:bg-zinc-950/60">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{item.success ? '포획 성공' : '포획 실패'} · {item.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">+{item.coins}코인</span>
                    <BallIcon ballKey={item.ballKey} size={20} />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">+{item.score}</span>
                  </div>
                </div>
              )) : <p className="text-sm text-zinc-600 dark:text-zinc-300">아직 던진 기록이 없다.</p>}
            </div>
          </article>

          <article className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">도감 등록 현황</h3>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{caughtCount}종 등록</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(collection).length ? Object.entries(collection).slice(0, 16).map(([slug, ballKey]) => (
                <div key={slug} className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 dark:bg-zinc-950/60">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{pokemonNameMap.get(slug) ?? slug}</span>
                  <BallIcon ballKey={ballKey} size={20} />
                </div>
              )) : <p className="text-sm text-zinc-600 dark:text-zinc-300">아직 잡은 포켓몬이 없다.</p>}
            </div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">첫 등록은 큰 코인 보상, 중복 포획은 소액 보상으로 처리해서 상점/업적 루프의 기초로 쓴다.</p>
          </article>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">볼 상점</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">도감에서 번 코인으로 가방을 다시 채운다. 자주 쓰는 볼은 묶음으로 조금 더 싸게 준다.</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">보유 코인 {coins}</span>
          </div>

          {lastShopAction ? (
            <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
              {lastShopAction}
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-200">
            상점 규칙: 구매 수량이 누적 <span className="font-semibold">10개</span>를 넘길 때마다 <span className="font-semibold">프리미어볼 1개</span>를 서비스로 준다.
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shopOffers.map((offer) => {
              const owned = inventory[offer.ballKey] ?? 0;
              return (
                <div key={offer.ballKey} className={`rounded-2xl border p-4 ${offer.featured ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/60'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <BallIcon ballKey={offer.ballKey} size={30} />
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{offer.ball.nameKo}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">현재 x{owned} · 기본 묶음 {offer.quantity}개</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">{offer.price}코인</span>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {SHOP_BUNDLE_STEPS.map((bundleStep) => {
                      const totalQuantity = offer.quantity * bundleStep;
                      const totalPrice = offer.price * bundleStep;
                      const premierBonus = getPremierBonusForPurchase(totalQuantity);
                      const affordable = coins >= totalPrice;
                      return (
                        <button
                          key={`${offer.ballKey}-${bundleStep}`}
                          type="button"
                          disabled={!affordable}
                          onClick={() => buyOffer(offer.ballKey, totalQuantity, totalPrice, offer.ball.nameKo)}
                          className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
                        >
                          <div>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{bundleStep}묶음 · {totalQuantity}개</p>
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{premierBonus > 0 ? `프리미어볼 ${premierBonus}개 서비스 포함` : '서비스 없음'}</p>
                          </div>
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{affordable ? `${totalPrice}코인` : `${totalPrice - coins}코인 부족`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {bagOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/55 p-0 sm:p-4" onClick={() => setBagOpen(false)}>
          <div className="w-full rounded-t-3xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:mx-auto sm:max-w-4xl sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">볼 가방</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">스크롤하거나 넘겨서 고른 뒤, 선택하면 바로 닫힌다.</p>
              </div>
              <button onClick={() => setBagOpen(false)} className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                닫기
              </button>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => moveBall(-1)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-xl font-bold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
              >
                ←
              </button>
              <div ref={bagScrollRef} onWheel={handleBagWheel} className="flex-1 overflow-x-auto overscroll-contain">
                <div className="flex min-w-max gap-3 pb-2">
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
                        className={`flex w-32 shrink-0 flex-col items-center rounded-2xl border p-3 text-center transition ${active ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900'}`}
                      >
                        <BallIcon ballKey={ball.key} size={36} />
                        <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{ball.nameKo}</p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">x{inventory[ball.key] ?? 0}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => moveBall(1)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-xl font-bold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
              >
                →
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
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
