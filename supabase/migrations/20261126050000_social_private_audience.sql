-- Social Studio: a private audience.
--
-- A private post is only visible to its author in the studio and is never
-- published to a channel.

alter table public.social_posts
  drop constraint if exists social_posts_audience_check;

alter table public.social_posts
  add constraint social_posts_audience_check
  check (audience in ('public', 'followers', 'custom', 'private'));
