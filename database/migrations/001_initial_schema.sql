-- StreamNest Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bookmarks table
create table public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  video_id text not null,
  title text not null,
  channel_title text,
  thumbnail_url text,
  playlist text default 'default',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, video_id, playlist)
);

-- Local playlists table
create table public.local_playlists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Local playlist videos table
create table public.local_playlist_videos (
  id uuid default uuid_generate_v4() primary key,
  playlist_id uuid references public.local_playlists on delete cascade not null,
  video_id text not null,
  position integer not null default 0,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(playlist_id, video_id)
);

-- User preferences table
create table public.user_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  theme text default 'system' check (theme in ('light', 'dark', 'system')),
  autoplay boolean default true,
  captions boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.bookmarks enable row level security;
alter table public.local_playlists enable row level security;
alter table public.local_playlist_videos enable row level security;
alter table public.user_preferences enable row level security;

-- RLS Policies

-- Profiles: users can view and edit their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Bookmarks: users can only access their own bookmarks
create policy "Users can view own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can create own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- Local playlists: users can only access their own playlists
create policy "Users can view own playlists"
  on public.local_playlists for select
  using (auth.uid() = user_id);

create policy "Users can create own playlists"
  on public.local_playlists for insert
  with check (auth.uid() = user_id);

create policy "Users can update own playlists"
  on public.local_playlists for update
  using (auth.uid() = user_id);

create policy "Users can delete own playlists"
  on public.local_playlists for delete
  using (auth.uid() = user_id);

-- Local playlist videos: users can access videos in their own playlists
create policy "Users can view own playlist videos"
  on public.local_playlist_videos for select
  using (
    exists (
      select 1 from public.local_playlists
      where id = playlist_id and user_id = auth.uid()
    )
  );

create policy "Users can insert own playlist videos"
  on public.local_playlist_videos for insert
  with check (
    exists (
      select 1 from public.local_playlists
      where id = playlist_id and user_id = auth.uid()
    )
  );

create policy "Users can delete own playlist videos"
  on public.local_playlist_videos for delete
  using (
    exists (
      select 1 from public.local_playlists
      where id = playlist_id and user_id = auth.uid()
    )
  );

-- User preferences: users can only access their own preferences
create policy "Users can view own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can upsert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  
  insert into public.user_preferences (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
