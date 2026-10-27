-- A photo for each prospect, shown on the pipeline cards and the prospect page.
--
-- The prospect-photo Edge Function fills these from public sources (Gravatar,
-- then the leadership and team pages of the prospect's website); a URL can
-- also be pasted by hand. The image stays where it was found and the app
-- hotlinks it without a referrer, so nothing is copied into storage.
alter table public.prospects
  add column photo_url        text,
  add column photo_source     text,
  add column photo_checked_at timestamptz,
  add constraint prospects_photo_url_ok check (
    photo_url is null or (char_length(photo_url) <= 2000 and photo_url ~* '^https://')
  ),
  add constraint prospects_photo_source_len check (photo_source is null or char_length(photo_source) <= 2000);

comment on column public.prospects.photo_url        is 'Headshot URL (https), found by the prospect-photo function or pasted by hand';
comment on column public.prospects.photo_source     is 'Page the photo was found on, or ''gravatar''; null when pasted by hand';
comment on column public.prospects.photo_checked_at is 'Last time prospect-photo looked; null means never, so "Find photos" picks it up';
