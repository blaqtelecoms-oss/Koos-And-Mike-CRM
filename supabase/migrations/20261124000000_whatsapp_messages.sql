-- WhatsApp Cloud API message log (outbound sends + inbound replies handled by the chatbot)

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id text references public.leads(id) on delete set null,
  phone text not null,
  direction text not null check (direction in ('in', 'out')),
  body text,
  template_name text,
  status text not null default 'sent',
  wa_message_id text unique,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_messages_phone_idx on public.whatsapp_messages (phone);
create index if not exists whatsapp_messages_created_idx on public.whatsapp_messages (created_at desc);

alter table public.whatsapp_messages enable row level security;

drop policy if exists "authenticated full access" on public.whatsapp_messages;
create policy "authenticated full access" on public.whatsapp_messages
  for all to authenticated using (true) with check (true);
