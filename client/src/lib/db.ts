import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __pokeBowlPool: Pool | undefined;
}

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }
  return url;
}

export function getPool() {
  if (!global.__pokeBowlPool) {
    global.__pokeBowlPool = new Pool({
      connectionString: getDatabaseUrl(),
    });
  }

  return global.__pokeBowlPool;
}

export async function ensureVoteSchema() {
  const pool = getPool();
  await pool.query(`
    create table if not exists votes (
      id bigserial primary key,
      pokemon_slug text not null,
      ball_key text not null,
      user_email text not null,
      created_at timestamptz not null default now(),
      unique (pokemon_slug, ball_key, user_email)
    );
  `);
}
