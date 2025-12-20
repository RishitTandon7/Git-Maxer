-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: User Settings
-- Stores configuration for the bot
create table public.user_settings (
    id uuid references auth.users not null primary key, -- Linked to Supabase Auth User
    github_username text unique not null,
    github_access_token text, -- Store user's GitHub OAuth token
    repo_name text,
    repo_visibility text default 'public',
    preferred_language text default 'any',
    commit_time text, -- 'HH:MM' or null for random
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

-- Table: Payments
-- Stores Razorpay payment records
create table public.payments (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.user_settings(id) not null,
    order_id text not null,
    payment_id text,
    amount int not null, -- in paise (e.g., 3000 for ₹30.00)
    status text default 'created', -- 'created', 'captured', 'failed'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Check policy for payments (Admin only or User view own)
alter table public.payments enable row level security;

create policy "Users can view their own payments"
on public.payments for select
using ( auth.uid() = user_id );

-- Update user_settings to include payment status and PLANS
alter table public.user_settings 
add column if not exists is_paid boolean default false,
add column if not exists plan_type text default 'free', -- 'free', 'pro', 'enterprise', 'owner'
add column if not exists plan_expiry timestamp with time zone,
add column if not exists daily_commit_count int default 0,
add column if not exists last_commit_ts timestamp with time zone,
add column if not exists project_goal text, -- For Enterprise
add column if not exists project_start_date timestamp with time zone;

-- Table: Invites (For Owner to give free access)
create table public.invites (
    code text primary key,
    plan_type text not null, -- 'pro', 'enterprise'
    is_used boolean default false,
    used_by uuid references public.user_settings(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Invites
alter table public.invites enable row level security;
create policy "Anyone can read invites to redeem"
on public.invites for select
using ( true ); -- Loophole needed for public redemption, or secure via API


