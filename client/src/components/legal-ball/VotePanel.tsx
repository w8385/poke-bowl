'use client';

import { useEffect, useMemo, useState } from 'react';

import { BallIcon } from '@/components/legal-ball/BallIcon';
import { PokemonDisplayEntry, getVoteCandidates } from '@/lib/ball-data';

type VoteItem = {
  ballKey: string;
  ballLabel: string;
  count: number;
};

export function VotePanel({
  pokemon,
  signedIn,
}: {
  pokemon: PokemonDisplayEntry;
  signedIn: boolean;
}) {
  const candidates = useMemo(() => getVoteCandidates(pokemon), [pokemon]);
  const [votes, setVotes] = useState<VoteItem[]>([]);
  const [selected, setSelected] = useState(candidates[0]?.ballKey ?? '');
  const [myVote, setMyVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalVotes = votes.reduce((sum, item) => sum + item.count, 0);

  useEffect(() => {
    let mounted = true;

    async function loadVotes() {
      try {
        const response = await fetch(`/api/votes?slug=${pokemon.slug}`);
        const payload = await response.json();
        if (mounted) {
          setVotes(payload.votes ?? []);
          setMyVote(payload.myVote ?? null);
          if (payload.myVote) setSelected(payload.myVote);
        }
      } catch {
        if (mounted) {
          setError('투표 현황을 불러오지 못했다.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadVotes();
    return () => {
      mounted = false;
    };
  }, [pokemon.slug]);

  async function submitVote() {
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: pokemon.slug, ballKey: selected }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'vote failed');
      }

      setVotes(payload.votes ?? []);
      setMyVote(payload.myVote ?? selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : '투표 저장에 실패했다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">유저 투표</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {pokemon.curated ? '운영자 추천 포함 후보군 안에서 가장 어울리는 볼에 투표한다.' : '아직 운영자 추천이 없는 포켓몬이다. 현재 지원 볼 후보 중에서 투표할 수 있다.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            총 {loading ? '-' : totalVotes}표
          </span>
          {signedIn ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">로그인됨</span>
          ) : (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">로그인 필요</span>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {candidates.map((item) => {
          const count = votes.find((vote) => vote.ballKey === item.ballKey)?.count ?? 0;
          const percentage = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
          const isMine = myVote === item.ballKey;

          return (
            <label key={item.ballKey} className="block rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-700">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="vote-ball"
                    checked={selected === item.ballKey}
                    onChange={() => setSelected(item.ballKey)}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <BallIcon ballKey={item.ballKey} size={20} />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.ballLabel}</span>
                    {item.isRecommended ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">대표 추천</span> : null}
                    {isMine ? <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-200">내 투표</span> : null}
                  </div>
                </div>
                <span className="text-sm text-zinc-600 dark:text-zinc-300">{loading ? '-' : `${count}표 · ${percentage}%`}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percentage}%` }} />
              </div>
            </label>
          );
        })}
      </div>

      {error ? <p className="mt-3 text-sm text-rose-500 dark:text-rose-300">{error}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!signedIn || submitting || !selected}
          onClick={submitVote}
          className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700"
        >
          {submitting ? '투표 저장중...' : myVote ? '투표 변경하기' : '이 조합에 투표'}
        </button>
        {!signedIn ? <a href="/login" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300">로그인하러 가기</a> : null}
      </div>
    </section>
  );
}
