-- TheWay: bring the live sync tables up to what the app writes.
-- Safe to run more than once. Only ADDs columns / relaxes NOT NULL — no data is changed or removed.
-- Run in Supabase → SQL Editor for project yylvpnkmbbdctgsgpycd.

alter table public.notes          add column if not exists verse_number integer;
alter table public.notes          add column if not exists tags text[] default '{}';
alter table public.highlights     add column if not exists verse_number integer;

alter table public.journal        add column if not exists tags text[] default '{}';
alter table public.journal        add column if not exists mood text;
alter table public.journal        add column if not exists book text;
alter table public.journal        add column if not exists chapter integer;
alter table public.journal        add column if not exists verse_number integer;
alter table public.journal        add column if not exists verse_text text;
alter table public.journal        add column if not exists status text;
alter table public.journal        add column if not exists prayer_type text;
alter table public.journal        add column if not exists last_prayed_at bigint;
alter table public.journal        add column if not exists answered_at bigint;

alter table public.memory_verses  add column if not exists interval integer;
alter table public.memory_verses  add column if not exists repetitions integer;
alter table public.memory_verses  add column if not exists status text;
alter table public.memory_verses  add column if not exists topics text[] default '{}';
alter table public.memory_verses  add column if not exists last_practiced bigint;

-- The older "verse" column must not block rows written with verse_number only
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notes' and column_name = 'verse') then
    alter table public.notes alter column verse drop not null;
    update public.notes set verse_number = verse where verse_number is null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'highlights' and column_name = 'verse') then
    alter table public.highlights alter column verse drop not null;
    update public.highlights set verse_number = verse where verse_number is null;
  end if;
end $$;

-- PostgREST caches the schema; tell it to reload so the new columns are usable immediately
notify pgrst, 'reload schema';
