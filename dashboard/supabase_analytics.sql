-- Analytics Table for Page Views
create table public.analytics (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.user_settings(id), -- Optional, NULL if visitor
    path text not null,
    user_agent text,
    country text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Allow anyone to insert (tracking), but only Owner to read
alter table public.analytics enable row level security;

create policy "Anyone can insert analytics"
on public.analytics for insert
with check ( true );

create policy "Only Owner can view analytics"
on public.analytics for select
using ( 
  auth.uid() in (
    select id from public.user_settings where plan_type = 'owner'
  )
);
