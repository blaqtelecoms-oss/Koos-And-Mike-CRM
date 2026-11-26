-- Social Studio: a Facebook/Instagram-style post composer and per-post analytics.
--
-- social_posts gains the content an admin actually writes (title, body, media,
-- audience, link) plus the publishing result (status, Meta post id) and the
-- latest insights snapshot for that published post (reach, likes, …).

alter table public.social_posts
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists media jsonb not null default '[]'::jsonb,
  add column if not exists audience text not null default 'public',
  add column if not exists audience_note text,
  add column if not exists link_url text,
  add column if not exists status text not null default 'draft',
  add column if not exists published_id text,
  add column if not exists published_at timestamptz,
  add column if not exists publish_error text,
  add column if not exists insights jsonb not null default '{}'::jsonb,
  add column if not exists insights_updated_at timestamptz;

do $$ begin
  alter table public.social_posts
    add constraint social_posts_audience_check check (audience in ('public', 'followers', 'custom'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.social_posts
    add constraint social_posts_status_check check (status in ('draft', 'published', 'failed'));
exception when duplicate_object then null; end $$;

-- Posts logged before the composer existed were posted by hand, so they are
-- already live — never show them as drafts.
update public.social_posts
set status = 'published', published_at = coalesce(published_at, created_date)
where status = 'draft';

create index if not exists social_posts_status_idx
  on public.social_posts (status, published_at desc);

-- Public bucket: Meta fetches the image URL itself when publishing, and the
-- post media is public on the platforms anyway.
insert into storage.buckets (id, name, public)
values ('social-media', 'social-media', true)
on conflict (id) do nothing;

drop policy if exists "public read social media" on storage.objects;
create policy "public read social media" on storage.objects
  for select to anon using (bucket_id = 'social-media');

drop policy if exists "auth read social media" on storage.objects;
create policy "auth read social media" on storage.objects
  for select to authenticated using (bucket_id = 'social-media');

drop policy if exists "auth write social media" on storage.objects;
create policy "auth write social media" on storage.objects
  for insert to authenticated with check (bucket_id = 'social-media');

drop policy if exists "auth update social media" on storage.objects;
create policy "auth update social media" on storage.objects
  for update to authenticated using (bucket_id = 'social-media');

drop policy if exists "auth delete social media" on storage.objects;
create policy "auth delete social media" on storage.objects
  for delete to authenticated using (bucket_id = 'social-media');

-- Keep the per-post insights fresh without anyone opening the page.
do $$ begin
  perform cron.unschedule('fetch-post-insights');
exception when others then null; end $$;

select cron.schedule(
  'fetch-post-insights',
  '40 5 * * *',
  $$select internal.invoke_edge('fetchPostInsights', '{"limit":50}'::jsonb)$$
);
