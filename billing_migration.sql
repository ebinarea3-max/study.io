-- ====================================================================
-- study.io Premium - Billing & Subscriptions Database Migration (Phase 1)
-- ====================================================================

-- 1. Subscriptions Table
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'razorpay',
  provider_subscription_id text unique,
  plan text check (plan in ('monthly','yearly')),
  status text not null default 'none',
  premium_until timestamptz,
  cancel_at_cycle_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security on subscriptions
alter table public.subscriptions enable row level security;

-- Drop and recreate policy for idempotent execution
drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Note: No insert/update/delete policies are added for users.
-- Only the Supabase service role key (used by server route handlers) writes to this table.


-- 2. Billing Events Idempotency Table
create table if not exists public.billing_events (
  id text primary key,              -- Razorpay event id (e.g. event_LXYZ12345) for idempotency
  type text not null,               -- Razorpay event type (e.g. subscription.activated, subscription.charged)
  payload jsonb not null,           -- Webhook event payload
  received_at timestamptz not null default now()
);

-- Enable Row Level Security on billing_events
alter table public.billing_events enable row level security;
-- Note: No policies created. Neither anon nor authenticated users can read or write.
-- Only the service role key can access and record billing events.

create index if not exists idx_billing_events_received_at on public.billing_events(received_at desc);
