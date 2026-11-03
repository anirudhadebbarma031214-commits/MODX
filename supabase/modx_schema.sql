-- MODX backend schema. Already applied to the connected Supabase project.
-- Run only in a fresh project; this file documents the database setup.
create table if not exists public.modx_mods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 90),
  game text not null,
  category text not null,
  description text not null check (char_length(description) between 10 and 2000),
  file_path text not null unique,
  file_name text not null,
  created_at timestamptz not null default now(),
  author_name text not null default 'Creator'
);
create table if not exists public.modx_likes (
  mod_id uuid not null references public.modx_mods(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (mod_id,user_id)
);
create table if not exists public.modx_comments (
  id uuid primary key default gen_random_uuid(),
  mod_id uuid not null references public.modx_mods(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists modx_mods_created_at_idx on public.modx_mods(created_at desc);
create index if not exists modx_comments_mod_created_idx on public.modx_comments(mod_id,created_at desc);
alter table public.modx_mods enable row level security;
alter table public.modx_likes enable row level security;
alter table public.modx_comments enable row level security;

create policy "MODX signed-in users can read mods" on public.modx_mods for select to authenticated using (true);
create policy "MODX users can publish their own mods" on public.modx_mods for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "MODX users can delete their own mods" on public.modx_mods for delete to authenticated using ((select auth.uid()) = user_id);
create policy "MODX signed-in users can read likes" on public.modx_likes for select to authenticated using (true);
create policy "MODX users can like as themselves" on public.modx_likes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "MODX users can remove their likes" on public.modx_likes for delete to authenticated using ((select auth.uid()) = user_id);
create policy "MODX signed-in users can read comments" on public.modx_comments for select to authenticated using (true);
create policy "MODX users can comment as themselves" on public.modx_comments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "MODX users can delete their comments" on public.modx_comments for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('modx-files','modx-files',false,52428800,
array['application/zip','application/x-zip-compressed','application/java-archive','application/octet-stream','application/x-7z-compressed','application/x-rar-compressed'])
on conflict (id) do update set public=false,file_size_limit=52428800;
create policy "MODX authenticated users upload own files" on storage.objects for insert to authenticated
with check (bucket_id='modx-files' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "MODX authenticated users read mod files" on storage.objects for select to authenticated using (bucket_id='modx-files');
create policy "MODX users delete own mod files" on storage.objects for delete to authenticated
using (bucket_id='modx-files' and (storage.foldername(name))[1]=(select auth.uid()::text));
