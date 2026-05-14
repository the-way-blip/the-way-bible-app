-- Supabase migration for "In The Midst" Bible Study App
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ══════════════════════════════════════════════════
-- 1. PROFILES
-- ══════════════════════════════════════════════════
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  faith_stage text,
  reading_plan text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ══════════════════════════════════════════════════
-- 2. HIGHLIGHTS
-- ══════════════════════════════════════════════════
create table if not exists public.highlights (
  id text not null,
  user_id uuid references auth.users on delete cascade not null,
  book text not null,
  chapter integer not null,
  verse_number integer not null,
  color text not null default 'yellow',
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  primary key (id, user_id)
);

alter table public.highlights enable row level security;

create policy "Users can view own highlights"
  on public.highlights for select using (auth.uid() = user_id);
create policy "Users can insert own highlights"
  on public.highlights for insert with check (auth.uid() = user_id);
create policy "Users can update own highlights"
  on public.highlights for update using (auth.uid() = user_id);
create policy "Users can delete own highlights"
  on public.highlights for delete using (auth.uid() = user_id);

-- ══════════════════════════════════════════════════
-- 3. NOTES
-- ══════════════════════════════════════════════════
create table if not exists public.notes (
  id text not null,
  user_id uuid references auth.users on delete cascade not null,
  book text not null,
  chapter integer not null,
  verse_number integer not null,
  text text not null,
  tags text[] default '{}',
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  primary key (id, user_id)
);

alter table public.notes enable row level security;

create policy "Users can view own notes"
  on public.notes for select using (auth.uid() = user_id);
create policy "Users can insert own notes"
  on public.notes for insert with check (auth.uid() = user_id);
create policy "Users can update own notes"
  on public.notes for update using (auth.uid() = user_id);
create policy "Users can delete own notes"
  on public.notes for delete using (auth.uid() = user_id);

-- ══════════════════════════════════════════════════
-- 4. MEMORY VERSES
-- ══════════════════════════════════════════════════
create table if not exists public.memory_verses (
  id text not null,
  user_id uuid references auth.users on delete cascade not null,
  book text not null,
  chapter integer not null,
  verse_number integer not null,
  text text not null,
  "interval" integer default 1,
  ease_factor real default 2.5,
  repetitions integer default 0,
  next_review bigint,
  status text default 'learning',
  practice_count integer default 0,
  topics text[] default '{}',
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  primary key (id, user_id)
);

alter table public.memory_verses enable row level security;

create policy "Users can view own memory verses"
  on public.memory_verses for select using (auth.uid() = user_id);
create policy "Users can insert own memory verses"
  on public.memory_verses for insert with check (auth.uid() = user_id);
create policy "Users can update own memory verses"
  on public.memory_verses for update using (auth.uid() = user_id);
create policy "Users can delete own memory verses"
  on public.memory_verses for delete using (auth.uid() = user_id);

-- ══════════════════════════════════════════════════
-- 5. JOURNAL (includes prayers and bookmarks)
-- ══════════════════════════════════════════════════
create table if not exists public.journal (
  id text not null,
  user_id uuid references auth.users on delete cascade not null,
  title text,
  content text,
  book text,
  chapter integer,
  verse_number integer,
  tags text[] default '{}',
  mood text,
  status text,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  primary key (id, user_id)
);

alter table public.journal enable row level security;

create policy "Users can view own journal"
  on public.journal for select using (auth.uid() = user_id);
create policy "Users can insert own journal"
  on public.journal for insert with check (auth.uid() = user_id);
create policy "Users can update own journal"
  on public.journal for update using (auth.uid() = user_id);
create policy "Users can delete own journal"
  on public.journal for delete using (auth.uid() = user_id);

-- ══════════════════════════════════════════════════
-- 6. READING PROGRESS
-- ══════════════════════════════════════════════════
create table if not exists public.reading_progress (
  user_id uuid references auth.users on delete cascade primary key,
  completed_chapters jsonb default '{}',
  streak integer default 0,
  last_read_date text,
  last_read_book text,
  last_read_chapter integer,
  updated_at timestamptz default now()
);

alter table public.reading_progress enable row level security;

create policy "Users can view own progress"
  on public.reading_progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress"
  on public.reading_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress"
  on public.reading_progress for update using (auth.uid() = user_id);
