-- QMES Supabase Security Advisor compatibility fix
-- Created: 2026-07-29
-- Purpose:
--   1. Enable Row Level Security on the 14 public tables reported by Security Advisor.
--   2. Preserve the current browser application's existing access while RLS is introduced.
--
-- IMPORTANT:
--   These compatibility policies allow both anon and authenticated roles to perform all CRUD.
--   This prevents the current QMES screens from suddenly becoming empty or failing after RLS is enabled.
--   They should later be replaced with role/department/owner-specific policies after Supabase Auth is fully connected.
--
-- Run this entire file in Supabase Dashboard > SQL Editor.

begin;

-- 1) Enable RLS
alter table if exists public.users enable row level security;
alter table if exists public.supplier_scores enable row level security;
alter table if exists public.equipments enable row level security;
alter table if exists public.iqc enable row level security;
alter table if exists public.pqc enable row level security;
alter table if exists public.oqc enable row level security;
alter table if exists public.suppliers enable row level security;
alter table if exists public.certificates enable row level security;
alter table if exists public.training_reports enable row level security;
alter table if exists public.worklog enable row level security;
alter table if exists public.worklog_materials enable row level security;
alter table if exists public.instruments enable row level security;
alter table if exists public.audit_logs enable row level security;
alter table if exists public.nonconform enable row level security;

-- 2) Recreate compatibility policies safely
-- users
drop policy if exists "qmes_compat_all" on public.users;
create policy "qmes_compat_all" on public.users
for all to anon, authenticated
using (true)
with check (true);

-- supplier_scores
drop policy if exists "qmes_compat_all" on public.supplier_scores;
create policy "qmes_compat_all" on public.supplier_scores
for all to anon, authenticated
using (true)
with check (true);

-- equipments
drop policy if exists "qmes_compat_all" on public.equipments;
create policy "qmes_compat_all" on public.equipments
for all to anon, authenticated
using (true)
with check (true);

-- iqc
drop policy if exists "qmes_compat_all" on public.iqc;
create policy "qmes_compat_all" on public.iqc
for all to anon, authenticated
using (true)
with check (true);

-- pqc
drop policy if exists "qmes_compat_all" on public.pqc;
create policy "qmes_compat_all" on public.pqc
for all to anon, authenticated
using (true)
with check (true);

-- oqc
drop policy if exists "qmes_compat_all" on public.oqc;
create policy "qmes_compat_all" on public.oqc
for all to anon, authenticated
using (true)
with check (true);

-- suppliers
drop policy if exists "qmes_compat_all" on public.suppliers;
create policy "qmes_compat_all" on public.suppliers
for all to anon, authenticated
using (true)
with check (true);

-- certificates
drop policy if exists "qmes_compat_all" on public.certificates;
create policy "qmes_compat_all" on public.certificates
for all to anon, authenticated
using (true)
with check (true);

-- training_reports
drop policy if exists "qmes_compat_all" on public.training_reports;
create policy "qmes_compat_all" on public.training_reports
for all to anon, authenticated
using (true)
with check (true);

-- worklog
drop policy if exists "qmes_compat_all" on public.worklog;
create policy "qmes_compat_all" on public.worklog
for all to anon, authenticated
using (true)
with check (true);

-- worklog_materials
drop policy if exists "qmes_compat_all" on public.worklog_materials;
create policy "qmes_compat_all" on public.worklog_materials
for all to anon, authenticated
using (true)
with check (true);

-- instruments
drop policy if exists "qmes_compat_all" on public.instruments;
create policy "qmes_compat_all" on public.instruments
for all to anon, authenticated
using (true)
with check (true);

-- audit_logs
drop policy if exists "qmes_compat_all" on public.audit_logs;
create policy "qmes_compat_all" on public.audit_logs
for all to anon, authenticated
using (true)
with check (true);

-- nonconform
drop policy if exists "qmes_compat_all" on public.nonconform;
create policy "qmes_compat_all" on public.nonconform
for all to anon, authenticated
using (true)
with check (true);

commit;

-- Verification query
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'users', 'supplier_scores', 'equipments', 'iqc', 'pqc', 'oqc',
    'suppliers', 'certificates', 'training_reports', 'worklog',
    'worklog_materials', 'instruments', 'audit_logs', 'nonconform'
  )
order by c.relname;
