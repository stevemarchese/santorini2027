-- 2026-09-25 Supabase exposure audit.
-- Enable RLS on site_content. The app only ever touches this table through
-- the service-role admin client (lib/supabase-admin.ts), which bypasses RLS,
-- so no policies are needed: with RLS on and no policies, the anon and
-- authenticated roles get nothing. Closes the "RLS disabled in public"
-- Security Advisor lint.
alter table site_content enable row level security;
