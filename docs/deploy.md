# Deployment — AND MORE on Render

## Service
- **Service ID:** srv-db0opohsrm7s738hravg → https://andmore.onrender.com
- **Repo:** https://github.com/nah-632/ANDMORE (branch `main`, auto-deploy)
- **Build:** `npm ci --include=dev && npm run build` — **Start:** `npm run start`
- **Health check path:** `/api/health` (zero-dependency liveness; `/api/ready` is readiness and NOT used by Render)
- **Node:** 22 (env var `NODE_VERSION=22`; matches `.nvmrc`, CI, `engines`)
- **Plan/Region:** free / oregon

## Environment variables (all set via Render dashboard or API)

| Key | Notes |
|---|---|
| `NODE_VERSION` | `22` |
| `NEXT_PUBLIC_SITE_URL` | `https://andmore.onrender.com` (used by sitemap + auth redirects) |
| `NEXT_PUBLIC_SUPABASE_URL` | fresh project URL (pending owner) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | fresh project anon key (pending owner) |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only; used by audited helpers |

## Deploy protocol (§3B rule 8)

1. **Nothing deploys unless CI is green** — Render auto-deploy waits for CI checks to pass.
2. Every push to `main` triggers: lockfile check → light checks → typecheck → lint → unit tests → `next build`.
3. If Render's deploy fails despite green CI, read the **first** error in the Render log, fix root cause, add a guard, record in `docs/lessons.md`.

## Deploy incident playbook (learned 2026-10-05)

| Symptom | Root cause | Fix |
|---|---|---|
| `npm ci ... Missing: X from lock file` | dependency added to `package.json` without regenerating the lockfile | run the `lockfile-bootstrap` workflow, `git pull`, redeploy |
| `check-imports FAILED` in Render build | renamed export not updated everywhere | the guard caught it before build; fix the import |
| `Cannot destructure property 'locale'` | not-found boundary prerendered without params | params typed optional + guarded (fixed in commit f915494) |

## Render API notes (ops scripts)

- `PUT /env-vars` = **FULL REPLACEMENT** of the list — always send ALL vars in one body.
- `buildCommand`/`startCommand`/`healthCheckPath` must go inside `serviceDetails.envSpecificDetails` when PATCHing; top-level fields are silently ignored.
- Trigger deploy: `POST /v1/services/{id}/deploys` with `{"clearCache":"clear"}`.
