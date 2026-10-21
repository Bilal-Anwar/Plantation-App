# Plantation Tracker

React/TypeScript/Vite app backed by Supabase PostgreSQL and Supabase Auth. There are no demo records or default passwords.

## Run locally

Use Node 24 and pnpm 11. Copy `.env.example` to `.env.local`, fill in your Supabase project URL and publishable key, then run:

```sh
pnpm install
pnpm dev
```

## Database setup

Run `supabase/schema.sql` in the project's SQL Editor. It is safe to re-run and does not reset records. Create your real account in Supabase Authentication, then add its UUID to `farm_members` with role `super_admin` and `active=true`. See `supabase/README.md`.

## Deployment

Import this repository into Vercel and configure the two environment variables from `.env.example`. `vercel.json` contains the build/output settings. Supabase secrets and service-role keys must never be used as Vite variables.

## Verification

```sh
pnpm lint
pnpm test:database
node tests/cloud-store.mjs
pnpm build
```

Super admins can edit and manage existing farm members. Admin accounts are read-only. Create/invite new Auth users from Supabase before adding them to the farm. Password changes use Supabase Auth.

Changes are grouped into an atomic database transaction, with a revision check to prevent a stale browser overwriting newer records. A visible banner shows pending/saved state. If saving fails, editing stops and unsaved records can be downloaded before reloading. Use Refresh records to load changes from other devices. There is no automatic offline sync. For this small single-farm app, the save transaction sends the complete farm snapshot (maximum 2 MB); a larger deployment should use per-operation transactions instead.

Legacy local records are not uploaded automatically. JSON backups exclude authentication credentials.
