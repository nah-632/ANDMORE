# AND MORE — Architecture (v2 rebuild)

## Canonical module map (§3B rule 1 — import through `@/` alias only)

| Module | Purpose |
|---|---|
| `@/i18n/request` | locales, defaultLocale, next-intl request config |
| `@/i18n/routing` | locale routing + typed navigation helpers |
| `@/lib/fonts` | the §5B locked four-font set (single source) |
| `@/lib/auth/server` | session/role helpers (P2) |
| `@/lib/db/server` | service-role client + audited helper (P1) |
| `@/lib/db/client` | browser client (P1) |
| `@/lib/**/mappers` | snake_case DB rows → camelCase domain objects (P1) |

Rules: no duplicate helpers, no scratch files, superseded files deleted in the same commit.

## Layers

- `src/app/[locale]/(public)` — public pages (ar/en, RSC-first)
- `src/app/api/*` — route handlers (health/ready are dependency-free/configured-only)
- `src/lib/*` — framework-agnostic domain logic (pure TS, node:test-able)
- `src/components/*` — UI + domain components
- `supabase/migrations` — versioned SQL; RLS on every table
- `scripts/check-*.mjs` — zero-dependency guards wired into `build` and `verify:light`

## Data flow

Browser → Next.js RSC/route handlers → Supabase (RLS enforced at DB; service-role only server-side, wrapped in audited helpers). DB rows snake_case ⇄ domain camelCase via one mapper layer per module.

## CI as source of truth

Local (phone/iSH): `verify:light` (zero-dep guards) + `test:unit` (node:test).
CI (GitHub Actions): `npm ci` → light checks → tsc → lint → unit → `next build`.
Render deploys only from green CI on `main`.
