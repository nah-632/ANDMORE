# Phase 0 brief — AND MORE v2 rebuild (2026-10-05)

## Assumptions (from Master Prompt v2 defaults, unchallenged)
- Node 22 LTS (Node 20 EOL April 2026), Next.js 15.x + React 19, pinned in package.json/.nvmrc/CI/render.yaml.
- Design: §5B locked — Amiri (AR headings), IBM Plex Sans Arabic (AR body/UI), Source Serif 4 (EN headings), Source Sans 3 (EN body/UI); colors sampled from the owner's logo (navy #082748, blue #114E8B, gold #D5A66A, teal #5C9C9D, paper #FAF9F5, ink #0F192B).
- Security: proportionate baseline (§13 v2). Admin MFA optional (recommended), no automated contact-pattern blocking, plain wa.me handoff link.
- WhatsApp: handoff link only, number `966508342500` in platform_settings (P1), never hard-coded in components.
- Render: web service ( frankfurt region default), health-check `/api/health`, auto-deploy after CI green.

## Architecture
Next.js 15 App Router + next-intl (locale-prefixed `/ar`, `/en`, ar default) · Supabase (Postgres+Auth+Storage, RLS everywhere) · Tailwind with design tokens · Zod validation · zero-dep light checks locally; full suite in CI. Domain logic pure TS in src/lib, tested with node:test (no Vitest on-device — iSH native binary corruption, §3B rule 10).

## Risks
1. Lockfile cannot be generated reliably on iSH → committed lockfile-bootstrap workflow (workflow_dispatch) generates it on a Linux runner; CI pre-step fails fast if missing.
2. Local npm install may silently fail → all heavy validation (tsc, next build) in CI; local = light guards only.
3. Design gate: /styleguide must be owner-approved before any public page (P0 exit gate).

## §22 defaults adopted
1. Own login ≥15 (guardian-linked). 2. Volunteers 18+. 3. Recording off. 4. Individual sessions only. 5. Video = external meeting link adapter. 6. Hosting region: document decision (Render frankfurt + Supabase region TBD at P1; PDPL legal review flagged). 7. Public name: first name + last initial; photo opt-in. 8. Gregorian + Western digits, week starts Sunday, Asia/Riyadh. 9. Admin MFA optional. 10. Email provider abstracted, one real provider configured. 11. Node 22 / latest Next 15.x. 12. Render frankfurt, free plan, cold-start documented.
