-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: User Settings
-- Stores configuration for the bot
create table public.user_settings (
    id uuid references auth.users not null primary key, -- Linked to Supabase Auth User
    github_username text unique not null,
    min_contributions int default 1,
    pause_bot boolean default false,
    custom_deadline_hour int default 23, -- Hour in 24h format (IST)
    custom_deadline_minute int default 45,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Generated History
-- Stores hashes of generated content to prevent duplicates
create table public.generated_history (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.user_settings(id) not null,
    content_snippet text, -- First 50 chars for preview
    content_hash text not null, -- SHA256 hash of the full content
    language text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Row Level Security)
-- Ensure users can only see their own data
alter table public.user_settings enable row level security;
alter table public.generated_history enable row level security;

create policy "Users can view their own settings"
on public.user_settings for select
using ( auth.uid() = id );

create policy "Users can update their own settings"
on public.user_settings for update
using ( auth.uid() = id );

create policy "Users can insert their own settings"
on public.user_settings for insert
with check ( auth.uid() = id );

create policy "Users can view their own history"
on public.generated_history for select
using ( auth.uid() = user_id );

-- Function to handle new user signup (Optional, but good for auto-creating settings)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (id, github_username)
  values (new.id, new.raw_user_meta_data->>'github_username');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
