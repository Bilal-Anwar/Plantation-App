# Pineapple Plantation Tracker

React, TypeScript and Vite application for plantation batches, nourishment schedules, workers, payments and Excel import/export.

Demo data and default login accounts have been removed. See [Supabase setup](supabase/README.md) for database preparation and the remaining integration steps.

## Development

Install dependencies with pnpm install, then pnpm dev. Run pnpm lint for TypeScript checks and pnpm build for a production build.

Current persistence is localStorage. Supabase preparation is included; live cloud authentication and CRUD are not yet enabled.
