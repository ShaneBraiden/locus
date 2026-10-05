# Deploying Northr

Northr deploys as **one web service** plus a **Supabase Postgres database**.
The Express server in `server/` serves the API under `/api/*` *and* the built
React client from `client/dist`, so the browser's relative `/api` calls reach
the same origin. There is no CORS to set up and no API URL to configure.

```
 browser ──HTTPS──► Render web service (Node)
                     ├─ /api/*, /healthz → Express API ──► Supabase Postgres
                     │                                 ├─► Gemini
                     │                                 └─► Sarvam
                     └─ everything else  → client/dist (React SPA)
```

| Piece    | Service                                       | Cost                                   |
| -------- | --------------------------------------------- | -------------------------------------- |
| App      | [Render](https://render.com) web service      | Free tier (sleeps when idle, see below) |
| Database | [Supabase](https://supabase.com) Postgres     | Free (500 MB)                          |
| AI       | Your existing Gemini and Sarvam keys          | Whatever your keys already cost        |

**Why not host the app on Supabase too?** Supabase hosts databases and short
Deno "edge functions". It can't run a long-lived Node/Express server like
Northr's, so the app runs on Render and uses Supabase only as its database.

**Supabase is the database only.** Northr keeps its own email + password login
(bcrypt + JWT), and accounts are rows in a `users` table. Supabase's
*Authentication* page stays empty, and that is expected. You don't need the
Supabase `anon` or `service_role` API keys at all. The server only needs the
database connection string.

> **Free-tier caveats.**
> - **Render** puts a free service to sleep after about 15 minutes without
>   traffic. The next visitor waits roughly a minute while it wakes up. Nothing
>   is lost.
> - **Supabase** pauses a free project after about a week with no activity.
>   While it's paused the app can't reach its database. Restore it from the
>   Supabase dashboard with one click, and your data is kept. Regular use keeps
>   it awake.

Everything the deploy needs is already in the repo:

- `render.yaml` is a Render Blueprint that describes the service, its build and
  start commands, the health check and the environment variables.
- `npm run install:all && npm run build` installs and builds both packages.
- `npm start` runs `server/dist/server.js`.
- **The server creates its own tables** (`users`, `user_states`,
  `user_contexts`) on first boot. There is no SQL to run by hand.

---

## Step 1: Create the database (Supabase)

1. Sign in at <https://supabase.com/dashboard> (GitHub login works) and click
   **New project**.
2. Fill in the form:
   - **Name:** `northr`
   - **Database password:** click **Generate a password**, then **copy it
     somewhere safe now**. You need it in a moment, and Supabase won't show it
     again. (If you type your own, avoid `@ : / ? # [ ] %` or URL-encode them,
     because they break the connection string.)
   - **Region:** **Southeast Asia (Singapore)**. That is the same region
     `render.yaml` uses, which keeps database round trips short.
   - If the form asks which connections you'll use, pick **Only Connection
     String**. Northr doesn't use Supabase's Data API. Either choice works,
     because the tables are locked down anyway (see *Security* below).
3. Click **Create new project** and wait a minute or two while it provisions.
4. **Copy the connection string.** Click **Connect** at the top of the project
   page, then open the **Connection String** tab and choose **Session pooler**.

   > ⚠️ Use **Session pooler**, not *Direct connection*. The direct address is
   > IPv6-only and Render can't reach it. The session pooler works over IPv4 and
   > suits a long-running server like this one.

   It looks like this (copy the host exactly as Supabase shows it):

   ```
   postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```

   Replace `[YOUR-PASSWORD]`, **including the square brackets**, with the
   password from step 2. This is your `DATABASE_URL`. Keep it private.

That's all. There's no IP allowlist to configure, because Supabase accepts
connections from anywhere by default and the password protects the database.

---

## Step 2: Push the code to GitHub

Render deploys from GitHub (`ShaneBraiden/locus`, branch `main`). Commit and
push everything, including `render.yaml`:

```bash
git add -A
git commit -m "Prepare for deployment"
git push origin main
```

`.env` is git-ignored and **must stay that way**, because it holds your real
keys. You type the secrets into Render in the next step instead.

---

## Step 3: Create the service on Render

1. Sign up at <https://dashboard.render.com> **with GitHub**, and when asked,
   give Render access to the `locus` repository.
2. Click **New → Blueprint**, pick the `locus` repo, and leave the branch as
   `main`. Render reads `render.yaml` and shows one web service called `northr`.
3. Render prompts for the values marked as secret in the Blueprint. Fill them
   in:

   | Key              | Value                                                  |
   | ---------------- | ------------------------------------------------------ |
   | `DATABASE_URL`   | The Supabase session-pooler string from Step 1         |
   | `GEMINI_API_KEY` | Your Gemini key (same as in your local `.env`)         |
   | `SARVAM_API_KEY` | Your Sarvam key. Leave it empty to hide the mic.       |

   `NODE_ENV=production`, `ALLOW_GUEST=true` and a random `JWT_SECRET` are set
   automatically by the Blueprint.
4. Click **Apply**. The first build takes about 3–5 minutes. In the service's
   **Logs** tab, a healthy start looks like this:

   ```
   [db] connected to Postgres at aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   Northr server listening on http://localhost:10000
   Storage: postgres
   Gemini: enabled (...)
   Sarvam: enabled (...)
   ```

5. **Optional standby keys.** If you use more than one key locally, add them
   under the service's **Environment** tab: `GEMINI_API_KEY_2`…`_4`,
   `SARVAM_API_KEY_2`…`_4`. Saving the environment triggers a redeploy.

Your site is now live at `https://northr.onrender.com`, or `northr-xxxx` if
that name was already taken. The exact URL is at the top of the service page.

<details>
<summary>Setting it up by hand instead of with the Blueprint</summary>

Choose **New → Web Service**, connect the repo, and use these settings:

| Setting           | Value                                   |
| ----------------- | --------------------------------------- |
| Runtime           | Node                                    |
| Branch            | `main`                                  |
| Root directory    | *(leave empty, the repo root)*          |
| Region            | Singapore                               |
| Build command     | `npm run install:all && npm run build`  |
| Start command     | `npm start`                             |
| Health check path | `/healthz`                              |

Then add the environment variables yourself: `NODE_ENV=production`,
`ALLOW_GUEST=true`, a `JWT_SECRET` of at least 32 random characters, and the
three secrets from step 3 above.
</details>

---

## Step 4: Check that it works

1. **Health check.** Open `https://<your-app>.onrender.com/healthz`. You should
   see:
   - `"db":"postgres"`. Anything else means the database is not connected.
   - `"gemini":"enabled"`. `"fallback"` means the key is missing or wrong.
   - `"sarvam":"enabled"`. If it says `disabled`, voice is off.
   - `"degrees":26`, `"careerProfiles":252`, which confirms the datasets loaded.
2. **Register a real account**, complete the first onboarding category, then
   sign in on your phone. Your progress should be there, because state now
   lives in Supabase.
3. **Look at the data.** In Supabase, go to **Table Editor** and check that
   `users`, `user_states` and `user_contexts` exist and that your account is a
   row in `users`. (The *Authentication* page stays empty. That's expected.)
4. **Try "Continue as guest"** in a private window. It should work and save
   nothing to the database.
5. **Try the mic.** It needs HTTPS, which Render provides, so it should appear
   whenever `SARVAM_API_KEY` is set.

---

## Updating the site

Push to `main` and Render rebuilds and redeploys automatically:

```bash
git push origin main
```

If a deploy breaks something, open the service's **Events** tab, find the last
good deploy, and click **Rollback**.

Before pushing, you can rehearse the production build locally:

```bash
npm run build
# PowerShell:
$env:NODE_ENV="production"; $env:PORT="3199"; $env:DATABASE_URL="<a dev database>"; npm start
# then open http://localhost:3199
```

**Local development and Supabase.** Your local `.env` still has the old
`MONGODB_URI`, which is now ignored. Without `DATABASE_URL`, `npm run
dev:server` runs on in-memory storage, which is fine for most work. To keep
accounts locally, set `DATABASE_URL` to a local Postgres or to a **second**
free Supabase project. Don't point dev at the production project, or test
accounts end up mixed in with real students.

---

## Custom domain (optional)

In Render, go to **Settings → Custom Domains → Add**, enter your domain (for
example `northr.app`), and add the DNS record Render shows you at your
registrar. HTTPS is issued automatically once DNS resolves.

---

## Environment variables in production

| Variable                  | Required | Notes |
| ------------------------- | -------- | ----- |
| `NODE_ENV`                | yes      | `production`. Enables the strict checks below. |
| `DATABASE_URL`            | yes      | The Supabase **Session pooler** string. In production the server **refuses to boot** without a reachable database instead of silently falling back to in-memory storage, which would wipe all accounts every time the service sleeps. |
| `JWT_SECRET`              | yes      | 16 characters minimum, longer is better. **Changing it logs everyone out.** |
| `GEMINI_API_KEY`          | no       | Without it, FAB runs as plain multiple choice. Scoring is identical. |
| `SARVAM_API_KEY`          | no       | Without it, the mic is hidden. |
| `ALLOW_GUEST`             | no       | `true` keeps the "Continue as guest" button working. Set it to `false` to require accounts. |
| `DATABASE_SSL_CA`         | no       | Supabase's CA certificate (PEM), from *Project Settings → Database → SSL Configuration*. When set, the database's TLS certificate is verified. When unset, the connection is still encrypted, just not verified. |
| `GEMINI_API_KEY_2..4`, `SARVAM_API_KEY_2..4` | no | Standby keys for quota failover. |
| `GEMINI_MODEL`, `SARVAM_SPEAKER`, … | no | See `.env.example`. |
| `TRUST_PROXY`             | no       | Proxy hops in front of the app (default `1`). See troubleshooting. |
| `PORT`                    | no       | Render sets this itself. Don't override it. |

---

## Troubleshooting

| Symptom | Cause and fix |
| ------- | ------------- |
| Build fails with `vite: not found` or `esbuild: not found` | The build command must be `npm run install:all && npm run build`. `install:all` passes `--include=dev`, which the build tools need. |
| Deploy fails: `Database unreachable in production (DATABASE_URL is not set)` | Add `DATABASE_URL` under *Environment*. |
| `ENETUNREACH`, an IPv6 address, or `db.xxxx.supabase.co` in the error | You copied the *Direct connection* string. Use the **Session pooler** one (`…pooler.supabase.com`). |
| `password authentication failed` | Wrong password, or `[YOUR-PASSWORD]` still has its brackets. Reset the password under *Project Settings → Database* if you lost it, then update `DATABASE_URL` in Render. |
| `Tenant or user not found` | The username or host doesn't match the project. Copy the pooler string again exactly as Supabase shows it; the user must be `postgres.<project-ref>`. |
| `self-signed certificate in certificate chain` | `DATABASE_SSL_CA` holds the wrong certificate. Fix it or remove it. |
| `max clients reached` | The free pooler has a small connection limit. Northr uses at most 5 connections, so check that no other app or local dev server is pointed at the same project. |
| App worked, then every request fails after a quiet week | The Supabase project is paused. Click **Restore project** in the Supabase dashboard. |
| `/healthz` shows `"gemini":"fallback"` | `GEMINI_API_KEY` is missing or misspelled. Fix it in *Environment*, which triggers a redeploy. |
| "Continue as guest" leads to "Invalid or expired session" | `ALLOW_GUEST` isn't `true`. |
| Every student hits "Too many attempts" or "too fast" at once | The rate limiter is seeing the proxy's IP instead of each student's. Set `TRUST_PROXY=2`, and `3` if that doesn't fix it. |
| First page load takes about a minute | The free Render instance was asleep. This is expected on the free tier. |
| Mic button missing | `SARVAM_API_KEY` isn't set, or the page isn't on HTTPS. |
| FAB suddenly falls back to multiple choice | Gemini quota is exhausted. Add `GEMINI_API_KEY_2`… as standbys. |

---

## Security

- **The tables are closed to Supabase's public API.** Supabase automatically
  exposes tables in the `public` schema through its Data API. Northr enables
  row level security on all three tables with *no* policies, so the `anon` and
  `authenticated` roles can read nothing, including password hashes. The
  server connects as the tables' owner and is unaffected. Don't add RLS
  policies unless you deliberately want to expose data through Supabase's API.
- **Checklist:**
  - [ ] `.env` is never committed. It is in `.gitignore`; keep it there.
  - [ ] Secrets live only in Render's *Environment* tab and your local `.env`.
  - [ ] The Supabase database password is a long, generated one.
  - [ ] If a key or the database password ever leaks (a screenshot, a commit,
        a chat), rotate it with the provider, then update it in Render.
