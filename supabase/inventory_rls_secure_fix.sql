-- NAMO QMES / Supabase Security Advisor fix for inventory tables
-- Created: 2026-08-26
--
-- Current architecture note:
--   The inventory module is accessed through the Express server (/api/inventory/*)
--   using a server-side PostgreSQL connection (DATABASE_URL) and session login checks.
--   Therefore browser-side anon/authenticated PostgREST access is not required for these tables.
--
-- Goal:
--   1) Enable RLS on all seven public inventory tables reported by Security Advisor.
--   2) Remove direct anon/authenticated table privileges so inventory stays server-API only.
--   3) Do NOT use permissive USING (true) / WITH CHECK (true) policies for anon.
--
-- Run in Supabase Dashboard > SQL Editor.

begin;

alter table if exists public.inventory_items enable row level security;
alter table if exists public.inventory_locations enable row level security;
alter table if exists public.inventory_lots enable row level security;
alter table if exists public.inventory_balances enable row level security;
alter table if exists public.inventory_transactions enable row level security;
alter table if exists public.inventory_reservations enable row level security;
alter table if exists public.inventory_counts enable row level security;

-- Inventory is served by the QMES backend, not direct browser PostgREST calls.
-- Remove direct client-role access to these underlying tables.
revoke all privileges on table public.inventory_items from anon, authenticated;
revoke all privileges on table public.inventory_locations from anon, authenticated;
revoke all privileges on table public.inventory_lots from anon, authenticated;
revoke all privileges on table public.inventory_balances from anon, authenticated;
revoke all privileges on table public.inventory_transactions from anon, authenticated;
revoke all privileges on table public.inventory_reservations from anon, authenticated;
revoke all privileges on table public.inventory_counts from anon, authenticated;

-- Clean up any accidentally-added broad compatibility policies on these tables.
drop policy if exists "qmes_compat_all" on public.inventory_items;
drop policy if exists "qmes_compat_all" on public.inventory_locations;
drop policy if exists "qmes_compat_all" on public.inventory_lots;
drop policy if exists "qmes_compat_all" on public.inventory_balances;
drop policy if exists "qmes_compat_all" on public.inventory_transactions;
drop policy if exists "qmes_compat_all" on public.inventory_reservations;
drop policy if exists "qmes_compat_all" on public.inventory_counts;

commit;

-- Verification 1: all seven tables should show rls_enabled = true
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'inventory_items',
    'inventory_locations',
    'inventory_lots',
    'inventory_balances',
    'inventory_transactions',
    'inventory_reservations',
    'inventory_counts'
  )
order by c.relname;

-- Verification 2: anon/authenticated should have no direct table privileges
select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'inventory_items',
    'inventory_locations',
    'inventory_lots',
    'inventory_balances',
    'inventory_transactions',
    'inventory_reservations',
    'inventory_counts'
  )
  and grantee in ('anon','authenticated')
order by table_name, grantee, privilege_type;
