import pg from 'pg';

// Postgres persistence (Supabase in production) with an in-memory fallback for
// local dev: without DATABASE_URL the server still runs (auth + state survive
// until restart) and logs loudly so nobody mistakes it for durable storage.

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Repos {
  backend: 'postgres' | 'memory';
  users: {
    findByEmail(email: string): Promise<UserRecord | null>;
    findById(id: string): Promise<UserRecord | null>;
    create(data: { name: string; email: string; passwordHash: string }): Promise<UserRecord>;
  };
  state: {
    get(userId: string): Promise<unknown | null>;
    set(userId: string, state: unknown): Promise<void>;
  };
  /** Long-term per-user memory shared by the typed and spoken chat (memory.ts). */
  context: {
    get(userId: string): Promise<unknown | null>;
    set(userId: string, context: unknown): Promise<void>;
    clear(userId: string): Promise<void>;
  };
}

// Idempotent, so it runs on every boot and doubles as the migration.
//
// Supabase publishes every table in `public` through its auto-generated Data
// API. Row level security with no policies closes that door completely — the
// anon and authenticated roles see nothing — while this server, connecting as
// the table owner, is unaffected. The password hashes must never be reachable
// from there.
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name          text NOT NULL,
    email         text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS user_states (
    user_id    uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    state      jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS user_contexts (
    user_id    uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    context    jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_states   ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_contexts ENABLE ROW LEVEL SECURITY;
`;

// Ids are uuids; anything else (a stale token from the MongoDB era, a forged
// `sub`) would make Postgres throw on the cast, so it is simply not found.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toRecord(row: any): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/**
 * Connection options for a DATABASE_URL. Local servers get plain TCP; anything
 * remote (Supabase) is encrypted. Supabase signs its certificate with its own
 * CA, so the chain is verified only when DATABASE_SSL_CA holds that CA's PEM.
 * Otherwise the link is encrypted but unverified, which is what Supabase's own
 * Node examples do. `sslmode` is stripped from the URL because pg lets it
 * override the `ssl` object below.
 */
export function poolConfig(databaseUrl: string): pg.PoolConfig {
  const url = new URL(databaseUrl);
  url.searchParams.delete('sslmode');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const ca = process.env.DATABASE_SSL_CA;
  return {
    connectionString: url.toString(),
    ssl: local ? false : ca ? { ca } : { rejectUnauthorized: false },
    max: 5,
    // A cloud database gets longer to answer the first connection.
    connectionTimeoutMillis: 15000,
  };
}

function postgresRepos(pool: pg.Pool): Repos {
  const one = async (sql: string, params: unknown[]) => (await pool.query(sql, params)).rows[0] ?? null;
  // Serialised explicitly: pg would turn a top-level array into a Postgres
  // array literal rather than JSON.
  const json = (value: unknown) => (value === undefined ? null : JSON.stringify(value));
  return {
    backend: 'postgres',
    users: {
      async findByEmail(email) {
        const row = await one('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        return row ? toRecord(row) : null;
      },
      async findById(id) {
        if (!UUID_RE.test(id)) return null;
        const row = await one('SELECT * FROM users WHERE id = $1', [id]);
        return row ? toRecord(row) : null;
      },
      async create(data) {
        const row = await one(
          'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
          [data.name.trim(), data.email.toLowerCase().trim(), data.passwordHash],
        );
        return toRecord(row);
      },
    },
    state: {
      async get(userId) {
        if (!UUID_RE.test(userId)) return null;
        return (await one('SELECT state FROM user_states WHERE user_id = $1', [userId]))?.state ?? null;
      },
      async set(userId, state) {
        await pool.query(
          `INSERT INTO user_states (user_id, state) VALUES ($1, $2::jsonb)
           ON CONFLICT (user_id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
          [userId, json(state)],
        );
      },
    },
    context: {
      async get(userId) {
        if (!UUID_RE.test(userId)) return null;
        return (await one('SELECT context FROM user_contexts WHERE user_id = $1', [userId]))?.context ?? null;
      },
      async set(userId, context) {
        await pool.query(
          `INSERT INTO user_contexts (user_id, context) VALUES ($1, $2::jsonb)
           ON CONFLICT (user_id) DO UPDATE SET context = EXCLUDED.context, updated_at = now()`,
          [userId, json(context)],
        );
      },
      async clear(userId) {
        await pool.query('DELETE FROM user_contexts WHERE user_id = $1', [userId]);
      },
    },
  };
}

function memoryRepos(): Repos {
  const users = new Map<string, UserRecord>(); // by id
  const byEmail = new Map<string, string>();
  const states = new Map<string, unknown>();
  const contexts = new Map<string, unknown>();
  let seq = 0;
  return {
    backend: 'memory',
    users: {
      async findByEmail(email) {
        const id = byEmail.get(email.toLowerCase().trim());
        return id ? users.get(id) ?? null : null;
      },
      async findById(id) {
        return users.get(id) ?? null;
      },
      async create(data) {
        const id = `mem_${++seq}_${Math.random().toString(36).slice(2, 8)}`;
        const rec: UserRecord = {
          id, name: data.name, email: data.email.toLowerCase().trim(),
          passwordHash: data.passwordHash, createdAt: new Date().toISOString(),
        };
        users.set(id, rec);
        byEmail.set(rec.email, id);
        return rec;
      },
    },
    state: {
      async get(userId) { return states.get(userId) ?? null; },
      async set(userId, state) { states.set(userId, state); },
    },
    context: {
      async get(userId) { return contexts.get(userId) ?? null; },
      async set(userId, context) { contexts.set(userId, context); },
      async clear(userId) { contexts.delete(userId); },
    },
  };
}

let repos: Repos | null = null;

export async function initDb(): Promise<Repos> {
  if (repos) return repos;
  const production = process.env.NODE_ENV === 'production';
  const databaseUrl = process.env.DATABASE_URL;
  let pool: pg.Pool | undefined;
  try {
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');
    pool = new pg.Pool(poolConfig(databaseUrl));
    // An idle client dropped by the pooler emits 'error' on the pool; without a
    // listener that would crash the process. The pool replaces the client.
    pool.on('error', (err) => console.error('[db] idle client error:', err.message));
    await pool.query(SCHEMA);
    repos = postgresRepos(pool);
    const where = new URL(databaseUrl);
    console.log(`[db] connected to Postgres at ${where.hostname}:${where.port || 5432}${where.pathname}`);
  } catch (err: any) {
    await pool?.end().catch(() => {});
    // A hosted instance that restarts or sleeps would silently wipe every
    // account on in-memory storage, so production refuses to boot instead.
    if (production) {
      throw new Error(`Database unreachable in production (${err.message}). Check DATABASE_URL — see DEPLOY.md.`);
    }
    console.warn('!!'.repeat(35));
    console.warn(`[db] Postgres unavailable (${err.message}).`);
    console.warn('[db] FALLING BACK TO IN-MEMORY STORAGE — accounts and saved state are LOST on restart.');
    console.warn('[db] Set DATABASE_URL (local Postgres or your Supabase project), then restart the server.');
    console.warn('!!'.repeat(35));
    repos = memoryRepos();
  }
  return repos;
}

export function getRepos(): Repos {
  if (!repos) throw new Error('initDb() must be awaited before use');
  return repos;
}
