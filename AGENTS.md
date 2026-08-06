# AGENTS.md

## Cursor Cloud specific instructions

Next.js 16 (App Router, Turbopack) + React 19 app ("마음써방" / adoor diary). Package manager is npm (`package-lock.json`). Node 22 works.

### Run
- Dev server: `npm run dev` (http://localhost:3000). `/` 307-redirects to `/mix/edit`, the core screen where users generate/enter a 4-letter Korean word (roulette or direct write).

### Supabase is optional for local dev
- Env vars live in `.env.local` (see `.env.example`); Supabase setup SQL is in `supabase/` (see `supabase/README.md`).
- Without `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, the app still runs: the roulette words fall back to `data/roulette-words.json` (`GET /api/roulette-words` returns `{"source":"static",...}`).
- Visitor-card / guestbook features need Supabase; `/api/visitor-cards` returns HTTP 503 ("Supabase is not configured") when env vars are absent.

### Known broken (pre-existing, not environment issues)
- `npm run build` FAILS: `app/components/mix/MixArtworkScreen.tsx` imports `./MixModalOverlay` and `./mixInstagramExport`, which do not exist in the repo (never committed). This breaks the production build and the `/mix/artwork` route. Dev mode compiles on-demand, so unrelated routes (e.g. `/mix/edit`) still work.
- `npm run lint` FAILS: the script calls `next lint`, which was removed in Next 16, and there is no `eslint.config.*` file, so ESLint cannot run either.
