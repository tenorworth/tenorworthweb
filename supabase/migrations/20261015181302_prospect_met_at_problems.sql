-- Where we met a prospect and what they told us is hard for them. Both are
-- free text, edited on the prospect page; the pipeline filters and searches them.
alter table public.prospects
  add column met_at   text,
  add column problems text,
  add constraint prospects_met_at_len   check (met_at is null or char_length(met_at) <= 200),
  add constraint prospects_problems_len check (problems is null or char_length(problems) <= 5000);

comment on column public.prospects.met_at   is 'Event or place we met, e.g. a field calendar event title';
comment on column public.prospects.problems is 'Problems the prospect described, in their words where possible';
