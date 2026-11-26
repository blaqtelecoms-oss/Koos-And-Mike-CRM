-- Social Studio: a cover thumbnail per post.
--
-- Uploaded from the composer (or the post card itself) and shown next to the
-- post in the feed. Stored in the public 'social-media' bucket like post media.

alter table public.social_posts
  add column if not exists thumbnail_url text;
