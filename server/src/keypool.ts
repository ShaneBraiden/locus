// A rotating pool of API keys for one provider.
//
// Northr runs on free and low-tier keys, and the failure that actually bites in
// production is not the network — it is a single key hitting its daily quota
// halfway through a student's conversation. Before this module that meant every
// remaining turn silently fell back to the deterministic multiple-choice path,
// and the student finished a noticeably worse assessment than the one they
// started.
//
// So each provider now reads up to four keys (`X_API_KEY` plus `X_API_KEY_2`,
// `_3`, `_4`) and this pool moves between them.
//
// THE CONTRACT, and the reason this is a wrapper rather than a retry loop at
// each call site: `run()` is handed a closure that performs the whole request.
// When a key fails for a key-shaped reason, the pool builds a client on the
// next key and invokes that *same closure* again. The prompt, the transcript,
// the memory brief, the audio buffer — every argument is captured in the
// closure, so the retry is byte-for-byte the request that just failed. A
// student never repeats themselves and never loses conversational context
// because a key ran out; the swap is invisible from above.
//
// What the pool does NOT do is retry a request that failed for its own sake. A
// malformed prompt, a 400, an unsupported audio codec or a timeout will fail
// identically on all four keys, so those rethrow immediately rather than
// burning the remaining quota to prove it.

/** How long a key that failed for a quota/auth reason is skipped. */
const COOLDOWN_MS = 5 * 60 * 1000;

/** Suffixes appended to the base env var name, in the order they are tried. */
const SUFFIXES = ['', '_2', '_3', '_4'] as const;

export interface KeyPool<T> {
  /** True when at least one key is configured. */
  enabled(): boolean;
  /** How many distinct keys were found. */
  size(): number;
  /**
   * Runs `work` against a live client, moving to the next key and re-running
   * the identical closure if the current key fails for a key-shaped reason.
   * Throws the last error once every key has been tried.
   */
  run<R>(label: string, work: (client: T) => Promise<R>): Promise<R>;
}

interface Slot<T> {
  /** The env var this key came from, for logging. Never log the key itself. */
  source: string;
  key: string;
  client: T | null;
  /** Epoch ms before which this key is skipped. */
  benchedUntil: number;
}

/**
 * True when the error means "this key cannot serve the request" rather than
 * "this request is bad". Quota, rate limit, auth, billing and provider-side
 * overload all warrant trying the next key; everything else does not.
 */
export function isKeyFailure(err: unknown): boolean {
  const e = err as { status?: number; statusCode?: number; code?: number; message?: string };
  const status = Number(e?.status ?? e?.statusCode ?? e?.code);
  if ([401, 402, 403, 429, 500, 502, 503, 504].includes(status)) return true;

  const msg = String(e?.message ?? err ?? '').toLowerCase();
  if (!msg) return false;
  return [
    'quota', 'rate limit', 'ratelimit', 'resource_exhausted', 'resource exhausted',
    'exhausted', 'too many requests', 'api key not valid', 'invalid api key',
    'invalid_api_key', 'api key expired', 'unauthorized', 'unauthenticated',
    'permission denied', 'permission_denied', 'forbidden', 'billing',
    'overloaded', 'service unavailable', 'unavailable', 'internal error',
  ].some((needle) => msg.includes(needle));
}

/** Reads `BASE`, `BASE_2`, `BASE_3`, `BASE_4`, in order, dropping blanks and duplicates. */
export function readKeys(envPrefix: string): { source: string; key: string }[] {
  const out: { source: string; key: string }[] = [];
  const seen = new Set<string>();
  for (const suffix of SUFFIXES) {
    const source = `${envPrefix}${suffix}`;
    const raw = process.env[source];
    const key = typeof raw === 'string' ? raw.trim() : '';
    // Skip the placeholders the shipped .env.example carries, so a developer
    // who never filled slots 2-4 does not get three guaranteed auth failures
    // in front of their one working key.
    if (!key || key.startsWith('MY_') || key.startsWith('change-me')) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ source, key });
  }
  return out;
}

export function createKeyPool<T>(opts: {
  /** Provider name, used only in log lines. */
  name: string;
  /** Base env var, e.g. "GEMINI_API_KEY". */
  envPrefix: string;
  /** Builds a provider client from one key. Called at most once per key. */
  build: (key: string) => T;
  /** Logged once when no key at all is configured. */
  disabledNote?: string;
}): KeyPool<T> {
  const { name, envPrefix, build, disabledNote } = opts;

  let slots: Slot<T>[] | null = null;
  let cursor = 0;
  let warned = false;

  function load(): Slot<T>[] {
    if (slots) return slots;
    slots = readKeys(envPrefix).map((k) => ({ ...k, client: null, benchedUntil: 0 }));
    if (!slots.length && !warned) {
      warned = true;
      console.warn(`[${name}] no ${envPrefix} set — ${disabledNote ?? 'this provider is disabled'}`);
    } else if (slots.length > 1) {
      console.log(`[${name}] ${slots.length} keys loaded (${slots.map((s) => s.source).join(', ')})`);
    }
    return slots;
  }

  function clientFor(slot: Slot<T>): T {
    if (slot.client === null) slot.client = build(slot.key);
    return slot.client;
  }

  return {
    enabled: () => load().length > 0,
    size: () => load().length,

    async run<R>(label: string, work: (client: T) => Promise<R>): Promise<R> {
      const pool = load();
      if (!pool.length) throw new Error(`${name}: no API key configured`);

      const now = Date.now();
      // Prefer keys that are not cooling off, but never refuse to try: if every
      // key is benched, take them all anyway rather than fail without asking.
      const order: Slot<T>[] = [];
      for (let i = 0; i < pool.length; i++) order.push(pool[(cursor + i) % pool.length]);
      const live = order.filter((s) => s.benchedUntil <= now);
      const queue = live.length ? live : order;

      let lastErr: unknown;
      for (let i = 0; i < queue.length; i++) {
        const slot = queue[i];
        try {
          const result = await work(clientFor(slot));
          // Success: make this key the starting point for the next request, so
          // a pool that has moved on does not walk back over a dead key first.
          cursor = pool.indexOf(slot);
          slot.benchedUntil = 0;
          return result;
        } catch (err: any) {
          lastErr = err;
          if (!isKeyFailure(err)) throw err;

          slot.benchedUntil = Date.now() + COOLDOWN_MS;
          const next = queue[i + 1];
          console.warn(
            `[${name}] ${label} failed on ${slot.source} (${err?.message ?? err}) — ` +
            (next
              ? `retrying the same request on ${next.source}`
              : 'no keys left, giving up'),
          );
        }
      }
      throw lastErr ?? new Error(`${name}: every key failed`);
    },
  };
}
