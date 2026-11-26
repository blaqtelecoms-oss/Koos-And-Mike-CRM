-- Automatically send the WhatsApp welcome template to every newly created lead.
--
-- The existing `lead_created_automation` trigger already runs internal.on_lead_created(),
-- which invokes edge functions through internal.invoke_edge() (pg_net + the service-role
-- key from Vault). This adds the WhatsApp welcome to that chain. Leads that arrived over
-- WhatsApp are skipped: the webhook already replies to them, and a second message would
-- be noise.

-- The edge gateway accepts any valid JWT, so the functions cannot trust the caller from
-- the Authorization header alone. internal.invoke_edge() therefore sends a private header
-- whose value lives in Vault, and the functions compare it against the
-- INTERNAL_EDGE_SECRET secret. The value is generated here, never committed.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'internal_edge_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'internal_edge_secret',
      'Shared header secret for internal edge-function calls'
    );
  end if;
end $$;

create or replace function internal.invoke_edge(fn text, payload jsonb default '{}'::jsonb)
  returns bigint
  language plpgsql
  security definer
  set search_path to 'internal', 'public', 'extensions'
as $function$
declare
  svc_key text;
  internal_secret text;
begin
  select decrypted_secret into svc_key from vault.decrypted_secrets where name = 'edge_service_key' limit 1;
  select decrypted_secret into internal_secret from vault.decrypted_secrets where name = 'internal_edge_secret' limit 1;
  return net.http_post(
    url := 'https://xiqwiiwyjuwrfdezvnoi.supabase.co/functions/v1/' || fn,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || svc_key)
      || coalesce(jsonb_build_object('x-internal-secret', internal_secret), '{}'::jsonb),
    body := payload,
    timeout_milliseconds := 120000
  );
end;
$function$;

create or replace function internal.on_lead_created()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'internal', 'public'
as $function$
begin
  perform internal.invoke_edge('assignLeadToConsultant', jsonb_build_object('leadId', new.id));
  perform internal.invoke_edge('sendLeadWelcomeEmail', jsonb_build_object('lead', to_jsonb(new)));
  if coalesce(new.phone, '') <> '' and coalesce(new.source, '') <> 'WhatsApp' then
    perform internal.invoke_edge('whatsappLeadWelcome', jsonb_build_object('lead', to_jsonb(new)));
  end if;
  return new;
end;
$function$;
