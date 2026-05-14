import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { ensureVoteSchema, getPool } from '@/lib/db';
import { getBallCatalog, getBallLabel, getPokemonList } from '@/lib/ball-data';

type VoteRow = {
  ball_key: string;
  vote_count: number;
};

function serializeVotes(rows: VoteRow[]) {
  return rows.map((row: VoteRow) => ({
    ballKey: row.ball_key,
    ballLabel: getBallLabel(row.ball_key),
    count: row.vote_count,
  }));
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 });
  }

  await ensureVoteSchema();
  const pool = getPool();
  const result = await pool.query<VoteRow>(
    `
      select ball_key, count(*)::int as vote_count
      from votes
      where pokemon_slug = $1
      group by ball_key
      order by vote_count desc, ball_key asc
    `,
    [slug],
  );

  const myVote = session?.user?.email
    ? (
        await pool.query<{ ball_key: string }>(
          `select ball_key from votes where pokemon_slug = $1 and user_email = $2 order by created_at desc limit 1`,
          [slug, session.user.email],
        )
      ).rows[0]?.ball_key ?? null
    : null;

  return NextResponse.json({
    slug,
    votes: serializeVotes(result.rows as VoteRow[]),
    myVote,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'login required' }, { status: 401 });
  }

  const body = await request.json();
  const slug = body.slug as string | undefined;
  const ballKey = body.ballKey as string | undefined;

  if (!slug || !ballKey) {
    return NextResponse.json({ error: 'slug and ballKey are required' }, { status: 400 });
  }

  const pokemon = getPokemonList().find((item) => item.slug === slug);
  if (!pokemon) {
    return NextResponse.json({ error: 'pokemon not found' }, { status: 404 });
  }

  const allowedBalls = getBallCatalog().map((ball) => ball.key);
  if (!allowedBalls.includes(ballKey)) {
    return NextResponse.json({ error: 'ballKey is not allowed for this pokemon' }, { status: 400 });
  }

  await ensureVoteSchema();
  const pool = getPool();
  await pool.query(`delete from votes where pokemon_slug = $1 and user_email = $2`, [slug, session.user.email]);
  await pool.query(
    `
      insert into votes (pokemon_slug, ball_key, user_email)
      values ($1, $2, $3)
    `,
    [slug, ballKey, session.user.email],
  );

  const result = await pool.query<VoteRow>(
    `
      select ball_key, count(*)::int as vote_count
      from votes
      where pokemon_slug = $1
      group by ball_key
      order by vote_count desc, ball_key asc
    `,
    [slug],
  );

  return NextResponse.json({
    slug,
    votes: serializeVotes(result.rows as VoteRow[]),
    myVote: ballKey,
  });
}
