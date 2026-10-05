# Permissions matrix (§4) — role × resource × action

Generated from the P1/P2 migrations. Each cell's invariant is enforced by RLS
(`supabase/migrations/`) AND server guards (`src/lib/auth/server.ts`). Frontend hiding is cosmetic only.

Roles: `student`, `parent` (guardian), `volunteer`, `reviewer`, `moderator`, `analyst`, `super_admin`.
Combined roles allowed: parent+volunteer. Never student+admin (DB CHECK `no_student_admin`).

| Resource | Anonymous | Student | Parent | Volunteer | Reviewer | Moderator | Analyst | Super admin |
|---|---|---|---|---|---|---|---|---|
| profiles (own) | — | R/U | R/U | R/U | R/U | R/U | R/U | R/U all |
| profiles (others) | — | — | own children | public fields | R | R | R | R |
| user_roles | — | R own | R own | R own | R | R | R | CRUD |
| consents | — | R/C own | R/C own | R/C own | R | R | R | R |
| guardian_links | — | R own | R/C own | — | R | R | R | CRUD |
| taxonomies (subjects/stages/styles) | R active | R | R | R | R | R | R | CRUD |
| volunteer_applications | — | — | — | C/R own | R all, U | R all | R | U all |
| volunteer_documents (metadata) | — | — | — | R own | R | R | — | R |
| volunteer_documents (content) | — | — | — | — | signed URL | — | — | signed URL |
| volunteer_profiles (public) | R visible¹ | R | R | R/U own | R | R | R | U |
| session_requests | — | C/R own | C/R children | — | R | R/U | R | U |
| sessions | — | R own | R own children | R assigned | R | R/U | R | U² |
| session_participants/events | — | R own | R own children | R assigned | R | R | R | R |
| session_feedback | — | C/R own | C/R children | C/R own | R | R/U moderation | R | U |
| audit_logs | — | — | — | — | R | R | R | R |
| reports (safeguarding) | — | C own | C own | C own | R | R/U | R | U |
| quality_alerts | — | — | — | — | — | R/U | R | U |
| hours/points ledgers | — | — | — | R own | — | — | R | insert via audited helper |
| platform_settings | — | — | — | — | — | — | R | U |
| content_pages | R published | R | R | R | R | R | R | CRUD |
| notifications | — | R own | R own | R own | R own | R own | R own | R own |

¹ visible = `active` + CoC accepted + (ref check not required or passed) + profile complete (§7)
² direct session writes are blocked from clients; booking/cancel runs through audited server helpers (service role), and the GIST exclusion constraints make double-booking impossible regardless of caller.

## Server guard mapping (route handlers)

| Guard | Used by |
|---|---|
| `requireUser()` | any authenticated route |
| `requireRoles(['reviewer','super_admin'])` | application decisions |
| `requireRoles(['moderator','super_admin'])` | reports, sessions admin actions |
| `requireRoles(['analyst','super_admin'])` | ledger reads/exports |
| `requireRoles(['super_admin'])` | roles, settings, content pages |

## Test invariants (each needs a test — §19)

- [ ] Anonymous cannot select volunteer_applications
- [ ] Volunteer sees only own application rows
- [ ] Reviewer sees all applications but cannot change user_roles
- [ ] Non-admin cannot insert sessions (server-only writes)
- [ ] Double-booking a volunteer's slot raises exclusion_violation even via service role
- [ ] audit_logs UPDATE/DELETE raise exception
- [ ] hours/points ledgers UPDATE/DELETE raise exception
- [ ] student cannot be granted reviewer (DB CHECK)
- [ ] reports: reporter sees own; other users cannot
- [ ] documents content inaccessible without reviewer role (signed URL path)
