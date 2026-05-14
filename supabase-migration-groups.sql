-- Supabase migration for Study Groups feature
-- Run this in the Supabase SQL Editor AFTER the base migration

-- ══════════════════════════════════════════════════
-- STEP 1: CREATE ALL TABLES FIRST
-- ══════════════════════════════════════════════════

create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  cover_verse text,
  created_by uuid references auth.users on delete set null,
  invite_code text unique default substr(md5(random()::text), 1, 8),
  is_private boolean default false,
  member_count integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.group_members (
  group_id uuid references public.groups on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_posts (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  post_type text default 'insight' check (post_type in ('insight', 'prayer', 'question', 'verse')),
  verse_ref text,
  verse_text text,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.post_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.group_posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists public.post_likes (
  post_id uuid references public.group_posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

-- ══════════════════════════════════════════════════
-- STEP 2: ENABLE RLS ON ALL TABLES
-- ══════════════════════════════════════════════════

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_likes enable row level security;

-- ══════════════════════════════════════════════════
-- STEP 3: ADD POLICIES (all tables exist now)
-- ══════════════════════════════════════════════════

-- Groups policies
create policy "Anyone can view public groups"
  on public.groups for select using (
    not is_private
    or created_by = auth.uid()
    or exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id
      and group_members.user_id = auth.uid()
    )
  );
create policy "Authenticated users can create groups"
  on public.groups for insert with check (auth.uid() = created_by);
create policy "Group creator can update"
  on public.groups for update using (auth.uid() = created_by);
create policy "Group creator can delete"
  on public.groups for delete using (auth.uid() = created_by);

-- Group members policies
create policy "Members can view group members"
  on public.group_members for select using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
    )
  );
create policy "Users can join groups"
  on public.group_members for insert with check (auth.uid() = user_id);
create policy "Users can leave groups"
  on public.group_members for delete using (
    auth.uid() = user_id
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
    )
  );

-- Group posts policies
create policy "Members can view group posts"
  on public.group_posts for select using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = group_posts.group_id
      and group_members.user_id = auth.uid()
    )
  );
create policy "Members can create posts"
  on public.group_posts for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.group_members
      where group_members.group_id = group_posts.group_id
      and group_members.user_id = auth.uid()
    )
  );
create policy "Authors can update own posts"
  on public.group_posts for update using (auth.uid() = user_id);
create policy "Authors can delete own posts"
  on public.group_posts for delete using (auth.uid() = user_id);

-- Post comments policies
create policy "Members can view comments"
  on public.post_comments for select using (
    exists (
      select 1 from public.group_posts gp
      join public.group_members gm on gm.group_id = gp.group_id
      where gp.id = post_comments.post_id
      and gm.user_id = auth.uid()
    )
  );
create policy "Members can create comments"
  on public.post_comments for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.group_posts gp
      join public.group_members gm on gm.group_id = gp.group_id
      where gp.id = post_comments.post_id
      and gm.user_id = auth.uid()
    )
  );
create policy "Authors can delete own comments"
  on public.post_comments for delete using (auth.uid() = user_id);

-- Post likes policies
create policy "Members can view likes"
  on public.post_likes for select using (true);
create policy "Users can like"
  on public.post_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike"
  on public.post_likes for delete using (auth.uid() = user_id);

-- ══════════════════════════════════════════════════
-- STEP 4: TRIGGERS
-- ══════════════════════════════════════════════════

create or replace function public.update_group_member_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.groups set member_count = member_count + 1 where id = NEW.group_id;
  elsif TG_OP = 'DELETE' then
    update public.groups set member_count = member_count - 1 where id = OLD.group_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_member_change on public.group_members;
create trigger on_member_change
  after insert or delete on public.group_members
  for each row execute function public.update_group_member_count();

create or replace function public.update_post_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.group_posts set likes_count = likes_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.group_posts set likes_count = likes_count - 1 where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_like_change on public.post_likes;
create trigger on_like_change
  after insert or delete on public.post_likes
  for each row execute function public.update_post_likes_count();

create or replace function public.update_post_comments_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.group_posts set comments_count = comments_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.group_posts set comments_count = comments_count - 1 where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_comment_change on public.post_comments;
create trigger on_comment_change
  after insert or delete on public.post_comments
  for each row execute function public.update_post_comments_count();
