# Supabase setup

1. Open your project's SQL Editor and run `schema.sql`. It is repeatable and preserves existing rows.
2. Create your actual email/password account in **Authentication > Users**. No default account is created.
3. Copy that user's UUID and run the following SQL after replacing the UUID and name:

```sql
insert into public.farm_members(user_id,name,role,active)
values ('YOUR-AUTH-USER-UUID','Your name','super_admin',true);
```

4. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` and in Vercel's project environment settings. Restart/redeploy after changing them.
5. Sign in to the app with the Auth user's email/password. Add other existing Auth users from the app's Farm access screen. Admins are read-only; super admins can edit.

The tables store workers, batches, schedules, payments, settings and server-written audit events. Record access requires an active farm membership. Direct client writes are denied; `save_farm` validates membership and revision, then commits records together. Constraints enforce references, nonnegative costs, complete schedules and completed batch integrity. Never put Auth passwords or service-role keys into app tables or frontend variables.

The schema has been tested locally against embedded PostgreSQL. Applying it remotely and verifying an authenticated login require project management access. CLI authentication helpers in `scripts/` are optional; verification codes are entered in the local terminal, never in chat.
