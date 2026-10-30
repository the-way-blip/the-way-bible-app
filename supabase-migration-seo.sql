-- State for /api/seo-crawl: one row per sitemap URL with Google's last
-- inspection, a log of runs, and a view of index coverage per site.
-- Only the service role reads or writes these; no client access.

create table if not exists public.seo_urls (
  site text not null,
  url text not null,
  lastmod text,
  priority int not null default 0,
  in_sitemap boolean not null default true,
  indexnow_at timestamptz,
  checked_at timestamptz,
  verdict text,
  coverage_state text,
  last_crawl timestamptz,
  google_canonical text,
  robots_state text,
  fetch_state text,
  primary key (site, url)
);
create index if not exists seo_urls_unchecked on public.seo_urls (site, priority, url) where checked_at is null;
create index if not exists seo_urls_checked on public.seo_urls (site, checked_at);
create index if not exists seo_urls_indexnow on public.seo_urls (site) where indexnow_at is null;

create table if not exists public.seo_runs (
  id bigint generated always as identity primary key,
  ran_at timestamptz not null default now(),
  daily boolean not null default false,
  result jsonb not null
);

alter table public.seo_urls enable row level security;
alter table public.seo_runs enable row level security;

create or replace view public.seo_coverage with (security_invoker = true) as
  select site,
         coalesce(coverage_state, case when checked_at is null then 'Not checked yet' else 'Unknown' end) as coverage_state,
         count(*)::int as urls
  from public.seo_urls
  where in_sitemap
  group by 1, 2;

revoke all on public.seo_urls, public.seo_runs, public.seo_coverage from anon, authenticated;
