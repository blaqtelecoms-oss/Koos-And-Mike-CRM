-- Social platform integrations (Facebook, Instagram, TikTok).
--
-- One row per platform. `credentials` holds the values an admin copies from the
-- platform's developer portal (App ID/secret, Page or Business account id,
-- access token). The Integrations page creates the rows on first save; a
-- platform without a row is shown as "inactive".
--
-- status:
--   active   - posting enabled for the platform
--   inactive - set up but switched off
--   disabled - blocked by an admin until re-activated

create table if not exists public.social_integrations (
  id text primary key default gen_random_uuid()::text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  platform text not null unique check (platform in ('facebook', 'instagram', 'tiktok')),
  status text not null default 'inactive' check (status in ('active', 'inactive', 'disabled')),
  account_name text,
  credentials jsonb not null default '{}'::jsonb
);

alter table public.social_integrations enable row level security;

drop policy if exists "authenticated full access" on public.social_integrations;
create policy "authenticated full access" on public.social_integrations
  for all to authenticated using (true) with check (true);

-- Start with the three supported platforms so the dashboard always has a card
-- to fill in, even before an admin saves anything.
insert into public.social_integrations (platform, status)
values ('facebook', 'inactive'), ('instagram', 'inactive'), ('tiktok', 'inactive')
on conflict (platform) do nothing;
