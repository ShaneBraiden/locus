# Northr Server Architecture

The API in `server/`. Replaces the original root `server.ts` + `pilotEngine.ts`
(Express + Gemini + Firebase), which were deleted in the client/server split.

Two defining decisions:

1. **Career prediction is driven by the 26 degree topologies** parsed from the
   source Google Doc, not by a hardcoded field list living inside a prompt.
2. **The prediction is deterministic.** Gemini narrates the result when a key is
   configured; it never decides the ranking. The engine produces identical output
   for identical answers, with or without AI.

## 1. Layout

```
server/
  package.json          # express, express-rate-limit, mongoose, bcryptjs,
                        # jsonwebtoken, @google/genai, dotenv
  tsconfig.json
  src/
    index.ts            # bootstrap: env, DB, rate limits, all routes, listen :3000
    db.ts               # MongoDB (mongoose) + in-memory fallback; users & state repos
    auth.ts             # JWT sessions, bcrypt, register/login/me, requireAuth
    flow.ts             # stateless chat state machine driving the 15 questions
    questions.ts        # the 15-question bank with per-option prediction weights
    engine.ts           # deterministic scoring + CareerPath/roadmap construction
    topology.ts         # loads and flattens docs/career-topology.json
    gemini.ts           # optional narration; every call has a non-AI fallback
    types.ts            # shapes mirrored from client/src/types.ts
```

`docs/career-topology.json` is the dataset (regenerate with
`node docs/parse-topology.mjs`). It is read at boot; a missing file is a
fail-fast startup error.

## 2. Accounts and storage

MongoDB via mongoose, default `mongodb://127.0.0.1:27017/northr`.

| Collection   | Holds                                                        |
| ------------ | ------------------------------------------------------------ |
| `users`      | name, email (unique index), bcrypt hash (cost 10), timestamps |
| `userstates` | one document per user: the client's synced app state          |

Sessions are JWTs (`sub` = user id, 30-day expiry) signed with `JWT_SECRET`,
which is **required in production** and falls back to a dev constant otherwise.
`requireAuth` verifies the token and re-loads the user on every request, so
deleting a user invalidates their sessions immediately.

Guests send the literal token `local_guest_token`, allowed outside production
(or with `ALLOW_GUEST=true`). Guest sessions are sandboxed: `/api/state` reads
`null` and writes are no-ops, so guest data never touches the database.

If MongoDB is unreachable the server boots on an in-memory implementation of the
same repository interface and warns loudly at startup. Dev convenience only —
accounts vanish on restart.

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

## 4. The 15 questions

`questions.ts` holds 15 lifestyle questions in FAB's voice — "a whole workday on
your feet, or at a desk with your setup just right?", "alarms going off, what
happens inside you?", "when do you actually need to start earning?".

Each option carries the prediction weights, which is what makes the quiz
meaningful rather than decorative:

| Field         | Effect                                                        |
| ------------- | ------------------------------------------------------------- |
| `sections`    | points toward the 10 outcome intents                          |
| `types`       | points toward the 6 profile types                             |
| `tags`        | +4 per keyword hit in a candidate's blob                      |
| `avoid`       | −8 per keyword hit (asymmetric: dislikes outweigh likes)      |
| `signal`      | fills the client's `ProfileSignals` dashboard model           |
| `constraint`  | fills `PracticalConstraints` (budget, timeline, geography)    |
| `react`       | FAB's one-line reaction shown before the next question        |
| `reflect`     | a fragment reused in the reflection moment                    |

## 5. Chat flow (`flow.ts`)

The server is **stateless**: the client posts the full message history on every
turn, and `parseState` re-derives position by recognizing its own past questions
via `probe` substrings. No session storage, no ordering assumptions, and a
refresh mid-quiz resumes correctly.

```
name → degree (26 buttons) → 15 questions → reflection → prediction → open chat
```

The reflection moment is mandatory before any recommendation: FAB plays back
what it sees ("The Operator — you make hard things run flawlessly...") built
from the `reflect` fragments, and the student can push back. Disagreement is
acknowledged in the recommendation rather than silently ignored.

Free-text answers that do not match an option are accepted and recorded with
`optionIndex: -1`, contributing no weights instead of guessing wrong.

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
| `GET /api/quiz/questions` | ✅ | question bank for non-chat clients |
| `POST /api/predict` | ✅ | stateless: `{degreeId, answers}` → ranked paths |
| `GET /healthz` | – | liveness, degree count, storage backend |

Rate limits: 150 requests / 5 min per user on the API (a full quiz is ~19), and
a stricter 20 / 15 min per IP on the credential endpoints.

## 8. Environment

All optional in dev. `MONGODB_URI`, `JWT_SECRET` (mandatory in production),
`GEMINI_API_KEY`, `GEMINI_MODEL`, `ALLOW_GUEST`, `PORT`, `NODE_ENV`.
See `.env.example`.
