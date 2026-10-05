# Supabase project setup — AND MORE (one-time, ~10 minutes)

## Step 1 — Create the project
1. Go to **https://supabase.com/dashboard** and sign in (GitHub login works).
2. Click **New project**.
3. Fill in:
   - **Name:** `andmore`
   - **Database Password:** click *Generate* → **save it somewhere safe now** (you'll never see it again; we don't need it in the app, only for direct DB access)
   - **Region:** closest to Saudi Arabia → choose **Frankfurt (eu-central-1)** or **London** (avoid US regions for PDPL data-hosting posture)
   - **Plan:** Free
4. Click **Create new project** and wait ~2 minutes for provisioning.

## Step 2 — Collect the keys
From the project's **Settings → API** page, copy these three values:

| Key | Where |
|---|---|
| Project URL | Settings → API → Project URL (`https://xxxx.supabase.co`) |
| anon public key | Settings → API → Project API keys → `anon` / `public` |
| service_role key | Settings → API → Project API keys → `service_role` (⚠️ secret — server only) |

## Step 3 — Give them to me
Set these environment variables (I'll wire everything from there):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Security note:** paste these ONLY into the environment variables store (not into chat). The service_role key bypasses all RLS — I'll reference it by env name only and never print it.

## Step 4 — What I'll do after (no action needed from you)
1. Link the repo to the project (Supabase CLI config in `supabase/config.toml`).
2. Apply migrations 0001–0005.
3. Verify: every table has RLS, sample queries as anonymous/authenticated/admin roles.
4. Update Render env vars + add the RLS test job to CI (pgTAP-style suite runs against the real project).
5. Enable daily backups note + connect auth email settings (Step 5 below when we reach P2).

## Step 5 — Auth settings (P2, preview)
When you're in the dashboard, also check **Authentication → Providers → Email**: leave "Confirm email" ON (spec requires verified email). Custom SMTP can wait — Supabase's built-in email sender is fine to start (rate-limited to a few emails/hour, fine for testing; we'll wire a real provider at P2).
