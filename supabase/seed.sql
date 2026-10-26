-- ==============================================================================
-- 🐮💪 MOOSCLES — Seed
-- Aucune fausse donnée : en production, chaque pote crée son compte dans l'app
-- et rejoint le groupe avec le code d'invitation.
--
-- Ce fichier ne sert qu'en local (`supabase db reset`). Il définit un code
-- d'invitation de dev. En prod, le vrai code est stocké dans private.app_config
-- (hors git). Pour le changer :
--   update private.app_config set value = 'NOUVEAU-CODE' where key = 'invite_code';
-- ==============================================================================

insert into private.app_config (key, value) values ('invite_code', 'DEV-LOCAL')
on conflict (key) do nothing;
