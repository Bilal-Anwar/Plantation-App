# Supabase preparation

Demo seeds and built-in accounts have been removed. Existing known sample IDs are cleaned once at browser startup; other locally created records are retained. Demo reset and fast-forward controls are removed.

1. Run schema.sql in your project's SQL Editor once.
2. In Authentication > Users, create your real user (email/password).
3. In SQL Editor, add that user's UUID to farm_members with your name and super_admin role. Never store passwords in this table.
4. The project URL and publishable key are configured in .env.local. Copy .env.example for other environments.

Current stage: preparation only. The application still uses the localStorage repository. Supabase client and RLS-protected tables are ready for the next migration phase; login, CRUD transactions, admin management and import must be adapted before live use. All database writes are deliberately denied by the current policies. The publishable key cannot execute this schema or create users.

No cloud data has been written. Do not upload legacy admin/password backups. Keep a JSON backup of any real local records before migrating. Browser-local data does not sync between devices.
