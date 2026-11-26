-- Daily social media performance snapshots for the dashboard.
--
-- One row per platform per day, written by the fetchSocialAnalytics function
-- (cron + the dashboard refresh button). Followers is a snapshot carried on
-- every row; reach/impressions/engagements/profile visits are that day's value.

create table if not exists public.social_analytics (
  id text primary key default gen_random_uuid()::text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  platform text not null check (platform in ('facebook', 'instagram')),
  metric_date date not null,
  followers integer,
  reach integer,
  impressions integer,
  engagements integer,
  profile_visits integer,
  unique (platform, metric_date)
);

create index if not exists social_analytics_date_idx
  on public.social_analytics (metric_date desc);

alter table public.social_analytics enable row level security;

drop policy if exists "authenticated full access" on public.social_analytics;
create policy "authenticated full access" on public.social_analytics
  for all to authenticated using (true) with check (true);
