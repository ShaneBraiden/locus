# Northr

Your AI career companion and decision intelligence lab, guiding you from
clinical/science chaos to clarity.

## Structure

| Path      | What it is                                                              |
| --------- | ----------------------------------------------------------------------- |
| `client/` | React + TypeScript + Vite frontend. Self-contained: own `package.json`.  |
| `server/` | Express + TypeScript API: auth, the career conversation, prediction.     |
| `docs/`   | Datasets: the 26-degree career topology, the LOCUS psychometric bank, and the degree pivot map. |

## Accounts and storage

Auth is email + password backed by **MongoDB** (`users` collection, bcrypt
hashes, JWT sessions valid 30 days). Per-user app state — chat sessions, career
paths, progress — is mirrored to the `userstates` collection so it follows the
account across devices; `localStorage` remains the fast local cache. Guests can
use the app without an account, but their data stays local only.

If MongoDB is unreachable the server still boots on in-memory storage and warns
loudly — accounts are lost on restart, so that mode is for local dev only.

## The six categories

The instrument is 28 items long. Asked end to end in one sitting it is a
twenty-minute form, and a twenty-minute form put in front of a student before
the app has shown them anything is the most reliable way there is to lose them.
So the bank is cut into six themed categories (`server/src/categories.ts`) and
each is collected on the surface where its questions are least intrusive and
most obviously relevant:

| # | Category          | Items | Where it is asked                        | Gemini |
| - | ----------------- | ----- | ---------------------------------------- | ------ |
| 1 | About you         | 4     | First login, with name, degree and year  | No     |
| 2 | What pulls you    | 6     | First time they open **Career Paths**    | No     |
| 3 | How you work      | 6     | First time they open the **Lab**         | No     |
| 4 | How you think     | 4     | In conversation with FAB                 | Yes    |
| 5 | What drives you   | 5     | In conversation with FAB                 | Yes    |
| 6 | How you decide    | 3     | In conversation with FAB                 | Yes    |

**The first three never touch Gemini.** They are rendered from the committed
item bank exactly as written and answered by tapping, so the student returns an
option id — which is precisely what the scorer wants. There is nothing for a
model to interpret, and putting a network round trip and an outage mode in
front of a new account's first screen would buy nothing. They post to
`POST /api/interview/answers`, which validates each pair against the bank and
scores it with the same tables the conversation uses. A tapped answer and a
spoken one are worth exactly the same thing.

**A gate is not a wall.** Every feature sheet carries a "Later", and a deferred
category simply goes back into FAB's queue. The conversation works through the
chat categories first and then falls through to whatever the modals did not
collect (`chatOrder`), so a student who dismissed every sheet still reaches a
recommendation — it just takes more conversation. Nothing in the product is
unreachable because somebody closed a modal.

**Ranking has a floor.** Career paths and the psychometric read stay hidden
until at least six psychometric items are in — the size of the Holland
category, which carries the largest weight in the fit score. Before that the
ranking is driven by whatever happened to be answered, which is how four
personal questions produced "Graphic Designer, 97.6" for a nursing student:
arithmetically correct, and exactly the confident nonsense that costs a student
their trust in everything else on screen. Category 2 is what lifts the floor,
which is also what that gate is for.

"New conversation" restarts the conversation, not the student: name, degree,
year and every tapped answer carry over, and only the chat categories reset.
"Start fresh" is still the real reset and wipes everything, memory included.

## How prediction works

Inside the conversation FAB just talks to you. Gemini asks each thing in its own
words, reacts to what you actually said, and follows up when an answer is vague
— there are no multiple-choice buttons and the text box is never disabled.

Underneath, every reply is mapped onto the **LOCUS instrument**
(`docs/psychometric-items.json`, parsed from `locus_psychometric_engine.xlsx`):
25 pre-scored scenario items across Holland RIASEC, Big Five OCEAN,
Self-Determination Theory, Multiple Intelligences and Career Decision-Making,
plus 3 practical items covering budget, timeline and geography.

**Gemini classifies; it never scores.** It returns the id of the option a
sentence meant, and every number after that comes from committed data tables:
the CCFS composite, the 252-career fit table (`docs/career-profiles.json`), and
the topology ranking over the student's own degree
(`docs/career-topology.json`). Identical answers produce identical output with
or without an API key — without one, the conversation falls back to the raw
instrument as multiple choice and scoring is unchanged.

Two result sets come out of it: broad career archetypes from the psychometric
profile, and the concrete degree-specific paths the topology engine ranks.
Design details: `SERVER_PLAN.md`.

## Your degree is not your ceiling

A fit score on its own will cheerfully tell a nursing student they would make an
excellent architect. True, and useless. So every career in the table also
carries its **degree gate** — the conventional degree, whether the career is
actually reachable without it, the alternative entry route, and which bachelor's
degrees commonly feed it. Of 252 careers, 195 have no real degree requirement,
36 need one bridging qualification, and 21 genuinely are gated (MBBS, B.Arch,
BPT and the other licensed professions).

Paired with that is `docs/degree-pivots.json`: 48 starting degrees, the first 26
keyed to the topology's own ids, each mapped to its direct-line roles, its
short-bridge pivots, the careers open to any graduate, the bridging
qualification, and a realistic time cost.

At scoring time every match is sorted into one of four tracks against the degree
the student actually holds:

| Track     | Meaning                                                      |
| --------- | ------------------------------------------------------------ |
| `aligned` | Built on the qualification they already have.                |
| `bridge`  | Reachable, but one qualification stands in the way.          |
| `pivot`   | Open regardless of degree.                                   |
| `locked`  | The degree really is the gate. Shown, collapsed, never hidden. |

Two rules keep this honest. A career whose gate is `locked` can never be
presented as a pivot, even if a degree row lists it by mistake. And every
student is shown at least three `pivot` careers even when their scores fall
below the display threshold — a result screen that dead-ends is the failure mode
this layer exists to prevent.

Answers researched per degree beat answers inferred from the gate column, and
are ranked ahead of them, so a lab-science student sees the clinical-research
route that was checked against their degree rather than a generic
"Commercial Pilot is one bridge away".

## Voice, and one shared context

With `SARVAM_API_KEY` set, the student can tap the mic and just talk. **Sarvam
AI** hears them and answers out loud in English or ten Indic languages; Gemini
still runs the interview and still only picks option ids. The two cowork rather
than compete, because a spoken turn is not a separate mode:

1. Sarvam transcribes the clip (`saarika:v2.5`, language auto-detected).
2. The transcript is appended as an ordinary user message and runs through the
   **same `flow.ts` turn** a typed message does — same items, same scoring.
3. FAB's reply is translated to the student's language if needed and spoken
   back (`bulbul:v2`).

So a student can start by speaking, finish by typing, and switch language
mid-conversation without losing a single answer. Nothing about scoring changes:
Sarvam only moves words between audio and text.

**What FAB remembers.** Alongside the per-conversation `assessment`, each
account has a long-term record (`server/src/memory.ts`, `usercontexts`
collection): name, degree, spoken language, the deterministic traits from the
item bank, the paths already ranked, and the things the student said in their
own words. Every Gemini prompt on both channels is given this record, so a new
chat with a returning student picks up where the last one ended instead of
asking their name again. `GET /api/memory` shows it, `DELETE /api/memory`
(also triggered by "Start Fresh") wipes it. Guests are never persisted.

Without a Sarvam key the mic is simply not shown and everything else is
identical.

## Run locally

**Prerequisites:** Node.js, and MongoDB running locally (default
`mongodb://127.0.0.1:27017/northr`).

```bash
# terminal 1 — API on :3000
cd server && npm install && npm run dev

# terminal 2 — client on :5173 (proxies /api/* to :3000)
cd client && npm install && npm run dev
```

From the repo root: `npm run dev` (client), `npm run dev:server`,
`npm run build`, `npm run lint`.

The server needs no configuration in dev: it connects to local MongoDB, allows
guest sessions, and runs the conversation as plain multiple choice. Copy
`.env.example` to `.env` to set `MONGODB_URI`, a real `JWT_SECRET` (required in
production), `GEMINI_API_KEY` — which is what turns the assessment into an
actual conversation — and `SARVAM_API_KEY`, which adds the microphone.

Voice needs a secure context in the browser: `localhost` is fine, but a LAN
address must be served over HTTPS or the mic button will not appear.

## API

Auth routes are public; everything else needs `Authorization: Bearer <token>`
(the literal `local_guest_token` works outside production):

- `POST /api/auth/register` - `{name, email, password}` → `{token, user}`
- `POST /api/auth/login` - `{email, password}` → `{token, user}`
- `GET  /api/auth/me` - validate a token, return the current user
- `GET  /api/state` / `PUT /api/state` - per-user app state (no-op for guests)
- `POST /api/fab/chat` - one conversation turn: `{messages, assessment}` → reply
  plus the updated `assessment`, `progress`, `memory` and (at the end) `psychometrics`
- `POST /api/fab/voice` - the same turn, spoken: `{audio, mimeType, language?,
  messages, assessment, speak?}` → everything `/api/fab/chat` returns, plus the
  `transcript`, the `userMessage` it was turned into, and base64 WAV `audio`
- `POST /api/voice/transcribe` - `{audio, mimeType, language?}` → `{transcript, languageCode}`
- `POST /api/voice/speak` - `{text, language?}` → base64 WAV clips (reads any
  FAB message out loud, including one that was typed)
- `GET  /api/voice/status` - whether voice is configured, and in which languages
- `GET  /api/memory` / `DELETE /api/memory` - what FAB remembers across sessions
- `POST /api/pilot/analyze` - pilot orchestrator sync for the dashboard
- `GET  /api/careers/degrees` / `GET /api/careers/degrees/:id` - the 26-degree topology
- `GET  /api/careers/pivots` / `GET /api/careers/pivots/:degreeId` - the degree
  pivot map: direct-line roles, short-bridge pivots, careers open to any
  graduate, and the bridging qualification for each
- `GET  /api/interview/categories` - the six categories with their questions,
  plus the 26 degrees and the year options: everything onboarding needs in one
  request
- `POST /api/interview/answers` - one batch of tapped answers:
  `{assessment, categoryId?, name?, degreeId?, year?, answers:[{itemId, optionId}]}`
  → the updated `assessment`, `progress`, `categories`, signals, constraints and
  (past the ranking floor) `bestFitPaths` and `psychometrics`. Never calls Gemini
- `POST /api/interview/state` - re-validate an assessment and report where it sits
- `POST /api/state/beacon` - `PUT /api/state` with the token in the body, for
  `navigator.sendBeacon` on tab close (a `fetch` there is routinely cancelled)
- `GET  /api/quiz/questions` - the legacy 15-question bank (still serves `/api/predict`)
- `POST /api/predict` - stateless prediction: `{degreeId, answers: {q1: 0, ...}}` → ranked paths
- `GET  /healthz` - liveness, dataset and storage-backend check (no auth)

`assessment` is the conversation's position. The server is stateless, so the
client hands it back each turn — and the server re-validates every field of it
against the item bank before scoring, so a tampered payload can cost progress
but never forge a result.

To regenerate the datasets after editing a source file:
`node docs/parse-topology.mjs` and `node docs/parse-psychometrics.mjs`.
#   l o c u s 
 
 