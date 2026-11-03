-- Highlight styles and note ranges (2026-11-02).
-- Safe to run more than once; only adds nullable columns.
-- Until it runs, the app keeps these fields on the device and simply doesn't sync them
-- (supabaseSync drops columns the table lacks), so nothing breaks either way.
-- Run in Supabase → SQL Editor for project yylvpnkmbbdctgsgpycd.

alter table public.highlights add column if not exists style text;      -- null = fill; 'underline' | 'dashed' | 'dotted'
alter table public.notes      add column if not exists verse_end integer; -- a note on verse_number..verse_end; verse_number 0 = whole chapter
