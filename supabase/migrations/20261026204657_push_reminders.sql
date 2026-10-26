-- ==============================================================================
-- 🔔 Rappels push quotidiens (19h heure de Paris)
-- Les secrets (clés VAPID, cron_secret, code d'invitation) sont dans
-- private.app_config et ne sont PAS versionnés dans git.
-- ==============================================================================

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- Lecture de la config serveur, réservée à la fonction Edge (service_role)
create or replace function public.get_server_config()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
  from private.app_config
  where key in ('vapid_public', 'vapid_private', 'vapid_subject', 'cron_secret');
$$;

revoke execute on function public.get_server_config() from public, anon, authenticated;
grant execute on function public.get_server_config() to service_role;

-- Appelle la fonction Edge "push"
create or replace function private.trigger_daily_push()
returns bigint language sql security definer set search_path = '' as $$
  select net.http_post(
    url := 'https://wjaiofzrzorxtvrulplc.supabase.co/functions/v1/push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select value from private.app_config where key = 'cron_secret')
    ),
    body := '{"action":"daily"}'::jsonb,
    timeout_milliseconds := 30000
  );
$$;

-- 17h et 18h UTC : la fonction n'envoie que quand il est 19h à Paris
-- (gère automatiquement l'heure d'été / d'hiver).
select cron.unschedule('mooscles-daily-push')
where exists (select 1 from cron.job where jobname = 'mooscles-daily-push');

select cron.schedule('mooscles-daily-push', '0 17,18 * * *', 'select private.trigger_daily_push();');
