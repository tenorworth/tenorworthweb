-- Company or personal website, stored as a full http(s) URL so it can be linked.
alter table public.prospects
  add column website text,
  add constraint prospects_website_ok check (
    website is null or (char_length(website) <= 200 and website ~* '^https?://')
  );

comment on column public.prospects.website is 'Website as a full URL; the form adds https:// when it is left off';
