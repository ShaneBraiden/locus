# Northr Server Architecture

The API in `server/`. Replaces the original root `server.ts` + `pilotEngine.ts`
(Express + Gemini + Firebase), which were deleted in the client/server split.

Two defining decisions:

1. **Career prediction is driven by committed datasets** — the 26 degree
   topologies parsed from the source Google Doc, and the LOCUS psychometric
   instrument parsed from the workbook — not by a field list living inside a
   prompt.
2. **The prediction is deterministic.** Gemini conducts the conversation and
   classifies a free-text reply onto a pre-scored option; it never decides a
   score or a ranking. The engine produces identical output for identical
   answers, with or without AI.

## 1. Layout

```
server/
  package.json          # express, express-rate-limit, pg, bcryptjs,
                        # jsonwebtoken, @google/genai, dotenv
  tsconfig.json
  src/
    index.ts            # bootstrap: env, DB, rate limits, all routes, listen :3000
    db.ts               # Postgres (pg; Supabase in prod) + in-memory fallback; repos
    auth.ts             # JWT sessions, bcrypt, register/login/me, requireAuth
    flow.ts             # stateless chat state machine over an explicit AssessmentState
    conversation.ts     # the Gemini interviewer: free text -> pre-scored option ids
    psychometrics.ts    # LOCUS scoring: theories -> CCFS -> 127-career fit
    bridge.ts           # construct tags -> topology vocabulary; the 3 practical items
    engine.ts           # deterministic scoring + CareerPath/roadmap construction
    questions.ts        # the legacy 15-question bank (still serves /api/predict)
    topology.ts         # loads and flattens docs/career-topology.json
    gemini.ts           # transport only; every call has a non-AI fallback
    types.ts            # shapes mirrored from client/src/types.ts
```

Three datasets are read at boot; a missing file is a fail-fast startup error.

| File | Regenerate with | Holds |
|---|---|---|
| `docs/career-topology.json` | `node docs/parse-topology.mjs` | 26 degrees, 1,271 items |
| `docs/psychometric-items.json` | `node docs/parse-psychometrics.mjs` | 25 items, 110 pre-scored options |
| `docs/career-profiles.json` | `node docs/parse-psychometrics.mjs` | 127 career success profiles |

## 2. Accounts and storage

Postgres via `pg`, connected with `DATABASE_URL` — Supabase's Session pooler in
production. `db.ts` creates the tables idempotently on every boot, so there is
no separate migration step.

| Table           | Holds                                                         |
| --------------- | ------------------------------------------------------------- |
| `users`         | uuid id, name, email (unique), bcrypt hash (cost 10), timestamps |
| `user_states`   | one row per user: the client's synced app state (`jsonb`)      |
| `user_contexts` | one row per user: FAB's long-term memory (`jsonb`)             |

Row level security is enabled on all three with no policies. Supabase exposes
`public` tables through its auto-generated Data API; with RLS and no policies
the `anon` and `authenticated` roles read nothing, while this server connects
as the table owner and is unaffected.

Sessions are JWTs (`sub` = user id, 30-day expiry) signed with `JWT_SECRET`,
which is **required in production** and falls back to a dev constant otherwise.
`requireAuth` verifies the token and re-loads the user on every request, so
deleting a user invalidates their sessions immediately.

Guests send the literal token `local_guest_token`, allowed outside production
(or with `ALLOW_GUEST=true`). Guest sessions are sandboxed: `/api/state` reads
`null` and writes are no-ops, so guest data never touches the database.

Without a reachable database the dev server boots on an in-memory
implementation of the same repository interface and warns loudly at startup.
Dev convenience only — accounts vanish on restart. In production the server
refuses to start rather than silently lose accounts.

Login responses do not distinguish "no such user" from "wrong password", and the
password comparison runs even when the user does not exist so response timing
cannot be used to enumerate accounts.

## 3. The 26-degree dataset

`docs/career-docs-raw.txt` holds 26 degree docs (25 health/life-science plus
B.Sc. Agriculture; one doc covers both Cardiac Care and Perfusion Technology).
Each has a regulatory framework (statutory bodies = hard gates) and the same
**10 sections**, which function as outcome intents:

1. Higher Education & Specialized PG Pathways
2. Frontline Clinical, Diagnostic & Research Job Opportunities
3. Non-Traditional Industry Domains & Job Roles
4. Government Opportunities
5. Civil Services & General Graduate Frameworks
6. Global Licensing & Study Abroad Pathways
7. High-Value Certifications & Skill Accelerators
8. Entrepreneurial Outlets
9. Research Domains & Academic Nodes
10. Emerging Horizon Domains

Item schema: `{name, destination_nodes[], frontline_titles[], description?}`,
plus `mandatory: true` on legal gates (BCP-I for Cardiac Care, AERB RSO Level-II
for Nuclear Medicine). 1,271 items total.

`topology.ts` flattens this into a scorable list: each item becomes a candidate,
**and each frontline title becomes a candidate in its own right**, so the engine
can predict "Organ Transplant Coordinator" rather than only the M.Sc. that leads
there. Each candidate carries a lowercase `blob` (name + settings + titles +
description) used for keyword matching.

The source doc defines no algorithm — no weights, scores, salary or eligibility
data. It is a knowledge base; all ranking logic below is engine-owned.

## 4. The instrument (`psychometrics.ts`, `bridge.ts`)

28 items: the 25 LOCUS scenarios plus 3 Northr-native practical ones.

Each of the 110 psychometric options is pre-scored 1–5 on five theories
(`H` Holland, `O` OCEAN, `S` SDT, `M` Multiple Intelligences, `D` decision
readiness) and carries a `Construct Measured` label that the parser turns into
stable tags (`"Investigative (I) + Autonomy"` → `holland:I`, `sdt:autonomy_high`).
59 distinct tags exist; `bridge.ts` maps every one of them.

All formulas are lifted verbatim from the workbook:

```
theory%      = ROUND(sum / (answered × 5) × 100, 1)
CCFS         = H%×0.25 + O%×0.20 + S%×0.25 + M%×0.20 + D%×0.10
adjustedCCFS = SDT% < 50 ? ROUND(CCFS × 0.85, 1) : CCFS
fitScore     = ROUND(MAX(0, 100 − (|ΔH|×0.25 + |ΔO|×0.20 + |ΔS|×0.25 + |ΔM|×0.20)), 1)
status       = fit ≥ 72 BEST FIT | ≥ 52 CONSIDER | else MISMATCH
```

Two deliberate fidelity choices. **`fitScore` omits the CDM delta** — those
weights sum to 0.90 and `D` is stored per career but never differenced; that is
what the sheet does. And `round1()` reproduces **Excel's ROUND**, not
JavaScript's: Excel collapses to 15 significant digits before rounding halves
away from zero, so `100 − 69.15 = 30.849999999999994` becomes `30.9`, not
`30.8`. Both behaviours are covered by comparing against the 127 fit scores
Excel itself cached in the workbook.

The workbook measures personality but never circumstance, so `bridge.ts` adds
three items carrying `constraint` payloads only — earning timeline, funding,
geography — which is exactly what `engine.ts`'s constraint pass needs. They
carry no theory scores, so they cannot distort the CCFS.

`bridge.ts` also derives `avoid` keywords from evidence: a Holland letter
offered five or more times and never once chosen is a real dislike, and the
engine weights dislikes (−8) more heavily than likes (+4).

## 5. Chat flow (`flow.ts`, `conversation.ts`)

The server is still **stateless**, but position now lives in an explicit
`AssessmentState` that round-trips through the client. The old approach — 
re-deriving position by substring-matching FAB's own past questions — cannot
survive questions Gemini phrases differently every time.

```
name → degree (26 buttons) → 28 items, conversationally → reflection → prediction → open chat
```

One Gemini call per turn does two jobs: interpret the student's last message
against the item FAB asked about, and ask the next thing in FAB's voice. It
returns **option ids and a confidence, never numbers**:

```jsonc
{ "scored": [{ "itemId": "p1", "optionId": "p1c", "confidence": 0.86 }],
  "needsFollowUp": false,
  "reply": "Ha, the glue person. Does that ever get exhausting?" }
```

Enforced server-side, not trusted to the model:

- ids are checked against the item bank; anything hallucinated is dropped
- `confidence < 0.5` is not recorded — FAB circles back instead
- **max 2 follow-ups per item**, then it is added to `skipped` and the
  conversation moves on rather than stalling
- a rich answer may settle several open items at once, which is what keeps 28
  items from feeling like 28 questions
- the reply is scrubbed of leaked option letters, counters and markdown

`sanitizeAssessment` re-validates everything the client sends. A tampered
payload can cost a student progress; it cannot forge a score.

**Without a key** (or on timeout, or unparseable JSON) the turn falls back to
the raw item rendered as multiple choice, matched locally by `matchOption`.
Scoring is byte-identical either way — only the texture of the conversation
changes.

The reflection moment remains mandatory before any recommendation. Its content
is deterministic, built from the `reflect` fragments the construct tags
produced; Gemini only rephrases it, and disagreement is acknowledged in the
recommendation rather than silently ignored.

## 6. Prediction (`engine.ts`)

1. **Candidate set** — every item in the student's degree topology.
2. **Section score** — the intent points accumulated from their answers.
3. **Profile-type affinity** — the dominant type (Investigator, Builder,
   Connector, Creator, Operator, Strategist) boosts its natural sections.
4. **Interest matching** — `tags` +4 and `avoid` −8 per keyword hit in the blob,
   since items within a section are unranked siblings in the source.
5. **Constraint adjustment** — "need income immediately" penalizes PG and
   research and boosts frontline and certifications; "staying in India" demotes
   global pathways; tight budget favors earn-first routes.
6. **Diversity pass** — caps near-identical names so the top 5 are not five
   variations of one ward role.
7. **Output** — `CareerPath[]` with rank-anchored match scores (97, ~92, ~87…),
   `whyThisMatchesYou` reasons, key insights per section, and a 90-day roadmap
   whose certifications are themselves drawn from the student's ranked items.

Regulatory hard gates are surfaced with the path, never silently dropped.

Steps 2–5 are fed by `bridge.ts` rather than the old 15-question weights, so
`engine.ts` itself is unchanged.

Alongside it, `matchCareers()` ranks all 127 LOCUS careers from the same
answers. The two lists are computed independently — one from psychometric
theory, one from the degree topology — so a career appearing in **both** is
genuine corroboration rather than the same signal counted twice. Those are
flagged as `convergentCareers` and highlighted in the UI.

## 7. API

| Route | Auth | Notes |
|---|---|---|
| `POST /api/auth/register` | – | `{name, email, password}` → `{token, user}`; 409 if taken |
| `POST /api/auth/login` | – | → `{token, user}`; 401 on bad credentials |
| `GET /api/auth/me` | ✅ | validates a token, returns the user |
| `GET/PUT /api/state` | ✅ | per-user app state; no-op for guests |
| `POST /api/fab/chat` | ✅ | the flow above; `/api/chat` is a legacy alias |
| `POST /api/pilot/analyze` | ✅ | dashboard confidence sync; deterministic |
| `GET /api/careers/degrees[/:id]` | ✅ | the 26-degree topology |
| `GET /api/quiz/questions` | ✅ | the legacy 15-question bank, still backing `/api/predict` |
| `POST /api/predict` | ✅ | stateless: `{degreeId, answers}` → ranked paths |
| `GET /healthz` | – | liveness, dataset counts, Gemini mode, storage backend |

`POST /api/fab/chat` takes `{messages, assessment}` and returns
`{reply, options?, assessment, progress, degreeName?, psychometrics?, ...}`.
`progress` replaces the old trick of scraping a literal `(n/15)` prefix out of
FAB's own prose in the client.

Rate limits: 150 requests / 5 min per user on the API (a full conversation is
~32 turns, or up to ~88 if every item needs its follow-ups), and a stricter
20 / 15 min per IP on the credential endpoints.

## 8. Environment

All optional in dev. `DATABASE_URL`, `JWT_SECRET` (mandatory in production),
`GEMINI_API_KEY`, `GEMINI_MODEL`, `ALLOW_GUEST`, `PORT`, `NODE_ENV`.
See `.env.example`.
