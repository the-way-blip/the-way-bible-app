-- Queue of churches submitted via thewaybible.app/churches. Written only by /api/church-submit (service role).
create table if not exists public.church_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null default 'add',         -- add | update | remove
  church_slug text,
  name text not null,
  city text,
  state text,
  website text,
  address text,
  phone text,
  pastor text,
  times text,
  notes text,
  contact_email text,
  status text not null default 'pending'    -- pending | approved | rejected
);
alter table public.church_submissions enable row level security;  -- no policies: only the service role can read/write
