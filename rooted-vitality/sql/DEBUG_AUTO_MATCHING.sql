-- ============================================================================
-- DEBUG: AUTO-MATCHING BUG INVESTIGATION
-- Run these queries in Supabase SQL Editor to find the root cause
-- ============================================================================

-- ============================================================================
-- QUERY 1: Find all triggers in the database
-- ============================================================================
-- This will show EVERY trigger that exists
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.event_object_table,
  t.action_timing,
  t.action_statement
FROM information_schema.triggers t
WHERE t.trigger_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY t.event_object_table, t.trigger_name;

| trigger_name                                      | event_manipulation | event_object_table             | action_timing | action_statement                                                     |
| ------------------------------------------------- | ------------------ | ------------------------------ | ------------- | -------------------------------------------------------------------- |
| enforce_bucket_name_length_trigger                | INSERT             | buckets                        | BEFORE        | EXECUTE FUNCTION storage.enforce_bucket_name_length()                |
| enforce_bucket_name_length_trigger                | UPDATE             | buckets                        | BEFORE        | EXECUTE FUNCTION storage.enforce_bucket_name_length()                |
| update_client_profiles_timestamp                  | UPDATE             | client_profiles                | BEFORE        | EXECUTE FUNCTION update_timestamp()                                  |
| create_client_notifications_on_signup             | INSERT             | clients                        | AFTER         | EXECUTE FUNCTION trigger_create_client_notification_settings()       |
| set_client_serial                                 | INSERT             | clients                        | BEFORE        | EXECUTE FUNCTION generate_client_serial()                            |
| update_clients_updated_at                         | UPDATE             | clients                        | BEFORE        | EXECUTE FUNCTION update_updated_at_column()                          |
| update_memberships_updated_at                     | UPDATE             | memberships                    | BEFORE        | EXECUTE FUNCTION update_updated_at_column()                          |
| objects_delete_delete_prefix                      | DELETE             | objects                        | AFTER         | EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger()           |
| objects_insert_create_prefix                      | INSERT             | objects                        | BEFORE        | EXECUTE FUNCTION storage.objects_insert_prefix_trigger()             |
| objects_update_create_prefix                      | UPDATE             | objects                        | BEFORE        | EXECUTE FUNCTION storage.objects_update_prefix_trigger()             |
| update_objects_updated_at                         | UPDATE             | objects                        | BEFORE        | EXECUTE FUNCTION storage.update_updated_at_column()                  |
| trg_practitioner_credentials_profile_completeness | UPDATE             | practitioner_credentials       | AFTER         | EXECUTE FUNCTION trigger_update_profile_completeness_credentials()   |
| update_practitioner_credentials_timestamps        | UPDATE             | practitioner_credentials       | BEFORE        | EXECUTE FUNCTION update_practitioner_credentials_timestamps()        |
| update_practitioner_credentials_timestamps        | INSERT             | practitioner_credentials       | BEFORE        | EXECUTE FUNCTION update_practitioner_credentials_timestamps()        |
| update_practitioner_match_settings_updated_at     | UPDATE             | practitioner_match_settings    | BEFORE        | EXECUTE FUNCTION update_updated_at_column()                          |
| trg_practitioner_profiles_profile_completeness    | UPDATE             | practitioner_profiles          | AFTER         | EXECUTE FUNCTION trigger_update_profile_completeness_profiles()      |
| update_practitioner_profiles_timestamps           | INSERT             | practitioner_profiles          | BEFORE        | EXECUTE FUNCTION update_practitioner_profiles_timestamps()           |
| update_practitioner_profiles_timestamps           | UPDATE             | practitioner_profiles          | BEFORE        | EXECUTE FUNCTION update_practitioner_profiles_timestamps()           |
| update_practitioner_arrays_on_service_change      | DELETE             | practitioner_selected_services | AFTER         | EXECUTE FUNCTION update_practitioner_service_arrays()                |
| update_practitioner_arrays_on_service_change      | INSERT             | practitioner_selected_services | AFTER         | EXECUTE FUNCTION update_practitioner_service_arrays()                |
| update_practitioner_arrays_on_service_change      | UPDATE             | practitioner_selected_services | AFTER         | EXECUTE FUNCTION update_practitioner_service_arrays()                |
| update_practitioner_selected_services_updated_at  | UPDATE             | practitioner_selected_services | BEFORE        | EXECUTE FUNCTION update_updated_at_column()                          |
| create_practitioner_notifications_on_signup       | INSERT             | practitioners                  | AFTER         | EXECUTE FUNCTION trigger_create_practitioner_notification_settings() |
| set_practitioner_serial                           | INSERT             | practitioners                  | BEFORE        | EXECUTE FUNCTION generate_practitioner_serial()                      |
| trg_practitioners_profile_completeness            | UPDATE             | practitioners                  | AFTER         | EXECUTE FUNCTION trigger_update_profile_completeness_practitioners() |
| update_practitioners_updated_at                   | UPDATE             | practitioners                  | BEFORE        | EXECUTE FUNCTION update_updated_at_column()                          |
| prefixes_create_hierarchy                         | INSERT             | prefixes                       | BEFORE        | EXECUTE FUNCTION storage.prefixes_insert_trigger()                   |
| prefixes_delete_hierarchy                         | DELETE             | prefixes                       | AFTER         | EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger()           |
| update_project_practitioner_matches_updated_at    | UPDATE             | project_practitioner_matches   | BEFORE        | EXECUTE FUNCTION update_updated_at_column()                          |
| projects_serial_number                            | INSERT             | projects                       | BEFORE        | EXECUTE FUNCTION generate_project_serial()                           |
| reviews_updated_at                                | UPDATE             | reviews                        | BEFORE        | EXECUTE FUNCTION update_reviews_updated_at()                         |
| trg_reviews_profile_completeness                  | INSERT             | reviews                        | AFTER         | EXECUTE FUNCTION trigger_update_profile_completeness_reviews()       |
| tr_check_filters                                  | INSERT             | subscription                   | BEFORE        | EXECUTE FUNCTION realtime.subscription_check_filters()               |
| tr_check_filters                                  | UPDATE             | subscription                   | BEFORE        | EXECUTE FUNCTION realtime.subscription_check_filters()               |
| on_auth_user_created                              | INSERT             | users                          | AFTER         | EXECUTE FUNCTION handle_new_user()                                   |

-- ============================================================================
-- QUERY 2: Find all functions that INSERT into project_practitioner_matches
-- ============================================================================
-- This will show what SQL functions create matches
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%INSERT INTO project_practitioner_matches%'
  AND routine_schema = 'public'
ORDER BY routine_name;

| routine_name              | routine_type | routine_definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| create_practitioner_match | FUNCTION     | true, NOW()

-- ============================================================================
-- QUERY 3: Find all triggers on the projects table
-- ============================================================================
-- Check if projects INSERT/UPDATE triggers auto-create matches
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'projects'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

| trigger_name           | event_manipulation | action_timing | action_statement                           |
| ---------------------- | ------------------ | ------------- | ------------------------------------------ |
| projects_serial_number | INSERT             | BEFORE        | EXECUTE FUNCTION generate_project_serial() |

-- ============================================================================
-- QUERY 4: Find all triggers on the clients table
-- ============================================================================
-- Check if open_to_match changes trigger match creation
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'clients'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

| trigger_name                          | event_manipulation | action_timing | action_statement                                               |
| ------------------------------------- | ------------------ | ------------- | -------------------------------------------------------------- |
| create_client_notifications_on_signup | INSERT             | AFTER         | EXECUTE FUNCTION trigger_create_client_notification_settings() |
| set_client_serial                     | INSERT             | BEFORE        | EXECUTE FUNCTION generate_client_serial()                      |
| update_clients_updated_at             | UPDATE             | BEFORE        | EXECUTE FUNCTION update_updated_at_column()                    |

-- ============================================================================
-- QUERY 5: Find all triggers on the opportunities table
-- ============================================================================
-- Check if opportunities INSERT triggers match creation
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'opportunities'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

Success, No rows returned.

-- ============================================================================
-- QUERY 6: Examine a recent auto-created match record
-- ============================================================================
-- See WHO created the match (timestamp, created_by if tracked)
SELECT 
  ppm.id,
  ppm.project_serial,
  ppm.client_serial,
  ppm.practitioner_serial,
  ppm.status,
  ppm.match_score,
  ppm.created_at,
  ppm.updated_at
FROM project_practitioner_matches ppm
ORDER BY ppm.created_at DESC
LIMIT 10;

| id                                   | project_serial | client_serial | practitioner_serial | status    | match_score | created_at                    | updated_at                    |
| ------------------------------------ | -------------- | ------------- | ------------------- | --------- | ----------- | ----------------------------- | ----------------------------- |
| 03a2c212-f490-4b7e-844d-e440c79c3b3b | 44             | C4            | P1                  | pending   | 89          | 2025-12-06 04:56:44.381+00    | 2025-12-06 04:56:44.381+00    |
| e08a0ea3-3ea7-4637-ab8f-30fb6a41ef67 | 43             | C4            | P1                  | pending   | 89          | 2025-12-06 04:18:25.224+00    | 2025-12-06 04:18:25.224+00    |
| 01586be0-314f-44b5-b610-65236eaeb841 | 40             | C4            | P1                  | not-hired | 89          | 2025-12-06 03:10:49.357478+00 | 2025-12-06 04:01:00.877323+00 |
| 0057eb87-4c9e-4eaa-adb8-d0142894f775 | 40             | C4            | P1                  | not-hired | 89          | 2025-12-06 03:10:44.983+00    | 2025-12-06 03:59:52.343061+00 |
| 3b46ad73-fa65-44fd-a8b1-37706bf246e2 | 39             | C4            | P1                  | not-hired | 89          | 2025-12-06 02:25:02.949424+00 | 2025-12-06 03:11:07.944032+00 |
| b180de5d-4251-46d0-9e64-4c7924c89a97 | 39             | C4            | P1                  | not-hired | 89          | 2025-12-06 02:24:59.75+00     | 2025-12-06 03:11:07.69481+00  |
| 79d9b791-3b4f-49b9-b9d5-d24ab7aed8f6 | 38             | C4            | P1                  | not-hired | 89          | 2025-12-06 02:01:52.791773+00 | 2025-12-06 02:05:01.430078+00 |
| 65345ae2-6d15-422e-ac4d-feb3e0182963 | 38             | C4            | P1                  | not-hired | 89          | 2025-12-06 02:01:43.363+00    | 2025-12-06 02:04:59.579904+00 |
| 40e58268-8b45-4efb-88ee-1a331670a154 | 37             | C4            | P1                  | not-hired | 89          | 2025-12-06 01:30:00.458+00    | 2025-12-06 02:04:57.540981+00 |
| 5737e1c8-65e9-4a28-8fe7-e944e55ac63b | 35             | C4            | P1                  | not-hired | 89          | 2025-12-06 01:23:47.824+00    | 2025-12-06 02:04:55.23033+00  |

-- ============================================================================
-- QUERY 7: Check if matches were created IMMEDIATELY after project creation
-- ============================================================================
-- This shows if matches are created within seconds of project creation
SELECT 
  p.id,
  p.project_serial,
  p.client_serial,
  p.created_at AS project_created_at,
  ppm.created_at AS match_created_at,
  EXTRACT(EPOCH FROM (ppm.created_at - p.created_at)) AS seconds_between,
  ppm.practitioner_serial,
  ppm.status
FROM projects p
LEFT JOIN project_practitioner_matches ppm ON ppm.project_serial = p.project_serial
WHERE p.created_at > NOW() - INTERVAL '24 hours'
ORDER BY p.created_at DESC;

-- ============================================================================
-- QUERY 8: Check opportunities table for auto-creation pattern
-- ============================================================================
-- See if opportunities are being created for ALL matching practitioners
SELECT 
  opp.id,
  opp.project_id,
  opp.practitioner_id,
  opp.created_at,
  opp.status,
  opp.converted_to_match,
  COUNT(*) OVER (PARTITION BY opp.project_id) as opportunities_per_project
FROM opportunities opp
ORDER BY opp.created_at DESC
LIMIT 20;

| id                                   | project_serial | client_serial | project_created_at            | match_created_at              | seconds_between | practitioner_serial | status      |
| ------------------------------------ | -------------- | ------------- | ----------------------------- | ----------------------------- | --------------- | ------------------- | ----------- |
| 3f036f06-28e9-4867-b5f3-355ac8ce0d73 | 44             | C4            | 2025-12-06 04:56:40.897497+00 | 2025-12-06 04:56:44.381+00    | 3.483503        | P1                  | pending     |
| 572aead3-1ff2-4523-8c38-cd9d9ccc2506 | 43             | C4            | 2025-12-06 04:18:22.401156+00 | 2025-12-06 04:18:25.224+00    | 2.822844        | P1                  | pending     |
| f145c38e-914e-4ee6-81c5-6a5a9a09c9aa | 42             | C4            | 2025-12-06 04:05:53.473468+00 | null                          | null            | null                | null        |
| 2c84ecfa-3627-4e60-962f-53227373596b | 41             | C4            | 2025-12-06 04:05:22.712339+00 | null                          | null            | null                | null        |
| 28b2f6d8-6376-4658-9d53-bd1f4b52ea78 | 40             | C4            | 2025-12-06 03:10:42.60565+00  | 2025-12-06 03:10:44.983+00    | 2.377350        | P1                  | not-hired   |
| 28b2f6d8-6376-4658-9d53-bd1f4b52ea78 | 40             | C4            | 2025-12-06 03:10:42.60565+00  | 2025-12-06 03:10:49.357478+00 | 6.751828        | P1                  | not-hired   |
| 37b9fb39-f402-4fbc-b8de-8e71c37bec9a | 39             | C4            | 2025-12-06 02:24:56.839662+00 | 2025-12-06 02:25:02.949424+00 | 6.109762        | P1                  | not-hired   |
| 37b9fb39-f402-4fbc-b8de-8e71c37bec9a | 39             | C4            | 2025-12-06 02:24:56.839662+00 | 2025-12-06 02:24:59.75+00     | 2.910338        | P1                  | not-hired   |
| ec1737a7-7218-4068-a0cf-cd73662f20d2 | 38             | C4            | 2025-12-06 02:01:40.359998+00 | 2025-12-06 02:01:43.363+00    | 3.003002        | P1                  | not-hired   |
| ec1737a7-7218-4068-a0cf-cd73662f20d2 | 38             | C4            | 2025-12-06 02:01:40.359998+00 | 2025-12-06 02:01:52.791773+00 | 12.431775       | P1                  | not-hired   |
| 713807e6-b3f1-4aa5-a012-03595a8324a1 | 37             | C4            | 2025-12-06 01:29:58.233575+00 | 2025-12-06 01:30:00.458+00    | 2.224425        | P1                  | not-hired   |
| 81694500-4ea0-49c4-bae8-d2bc2c2609ba | 36             | C4            | 2025-12-06 01:23:45.394482+00 | null                          | null            | null                | null        |
| 77c9cdb4-7b95-47bf-ae8c-d56261239c46 | 35             | C4            | 2025-12-06 01:23:45.32002+00  | 2025-12-06 01:23:47.824+00    | 2.503980        | P1                  | not-hired   |
| 9c8b9aaf-04dc-4000-8d04-00279dc81d2d | 34             | C4            | 2025-12-06 01:21:32.271417+00 | null                          | null            | null                | null        |
| 89631a4a-fa7b-4d32-988d-2e44b9744865 | 33             | C4            | 2025-12-06 01:21:32.214695+00 | 2025-12-06 01:21:34.512+00    | 2.297305        | P1                  | not-hired   |
| 89631a4a-fa7b-4d32-988d-2e44b9744865 | 33             | C4            | 2025-12-06 01:21:32.214695+00 | 2025-12-06 01:22:59.884+00    | 87.669305       | P1                  | not-hired   |
| 89631a4a-fa7b-4d32-988d-2e44b9744865 | 33             | C4            | 2025-12-06 01:21:32.214695+00 | 2025-12-06 01:21:34.377+00    | 2.162305        | P1                  | not-hired   |
| 89631a4a-fa7b-4d32-988d-2e44b9744865 | 33             | C4            | 2025-12-06 01:21:32.214695+00 | 2025-12-06 01:22:44.29+00     | 72.075305       | P1                  | not-hired   |
| 6aee97f2-264a-434c-bf2a-e43dcc83ddfb | 32             | C4            | 2025-12-06 01:20:27.862237+00 | 2025-12-06 01:20:30.333+00    | 2.470763        | P1                  | not-hired   |
| 6aee97f2-264a-434c-bf2a-e43dcc83ddfb | 32             | C4            | 2025-12-06 01:20:27.862237+00 | 2025-12-06 01:20:30.259+00    | 2.396763        | P1                  | not-hired   |
| a88b627c-ae05-4ffa-bddc-40c0b98156e3 | 31             | C4            | 2025-12-06 01:20:27.846846+00 | null                          | null            | null                | null        |
| c6b73c6a-d476-44ca-a6dd-6c599f69230a | 30             | C4            | 2025-12-06 01:07:26.009832+00 | null                          | null            | null                | null        |
| a5e0d7be-5775-462d-910e-b7d15369af98 | 29             | C4            | 2025-12-06 01:07:25.943745+00 | 2025-12-06 01:07:28.468+00    | 2.524255        | P1                  | not-hired   |
| a5e0d7be-5775-462d-910e-b7d15369af98 | 29             | C4            | 2025-12-06 01:07:25.943745+00 | 2025-12-06 01:07:28.397+00    | 2.453255        | P1                  | not-hired   |
| a5e0d7be-5775-462d-910e-b7d15369af98 | 29             | C4            | 2025-12-06 01:07:25.943745+00 | 2025-12-06 01:07:32.153428+00 | 6.209683        | P1                  | not-hired   |
| 953d98ed-f00e-4d39-9b56-8aa3f3f44f5f | 28             | C2            | 2025-12-06 01:02:05.750477+00 | null                          | null            | null                | null        |
| b3a8964e-387e-4dfe-a866-2b7161dfdbe2 | 27             | C2            | 2025-12-06 01:02:05.701485+00 | 2025-12-06 01:02:08.084+00    | 2.382515        | P1                  | in-progress |
| b3a8964e-387e-4dfe-a866-2b7161dfdbe2 | 27             | C2            | 2025-12-06 01:02:05.701485+00 | 2025-12-06 01:02:53.138588+00 | 47.437103       | P1                  | not-hired   |
| b3a8964e-387e-4dfe-a866-2b7161dfdbe2 | 27             | C2            | 2025-12-06 01:02:05.701485+00 | 2025-12-06 01:02:08.161+00    | 2.459515        | P1                  | not-hired   |
| 5533161f-dec1-4d11-9f9d-d10b7a9c5619 | 26             | C3            | 2025-12-06 00:17:18.789151+00 | null                          | null            | null                | null        |
| 29b75b18-da41-4ada-a88b-6955c0963198 | 25             | C3            | 2025-12-06 00:17:18.754104+00 | 2025-12-06 00:17:21.178+00    | 2.423896        | P1                  | hired       |
| 29b75b18-da41-4ada-a88b-6955c0963198 | 25             | C3            | 2025-12-06 00:17:18.754104+00 | 2025-12-06 00:17:24.515948+00 | 5.761844        | P1                  | hired       |
| 29b75b18-da41-4ada-a88b-6955c0963198 | 25             | C3            | 2025-12-06 00:17:18.754104+00 | 2025-12-06 00:17:21.257+00    | 2.502896        | P1                  | hired       |
| 4fce37bf-e1c1-4b3a-ade2-1ad4d174aea8 | 24             | C3            | 2025-12-05 23:30:57.802298+00 | null                          | null            | null                | null        |
| 39c50371-8efd-4fcc-80f9-9ccc03a637c6 | 23             | C3            | 2025-12-05 23:30:57.694038+00 | 2025-12-05 23:31:02.068+00    | 4.373962        | P1                  | not-hired   |
| 39c50371-8efd-4fcc-80f9-9ccc03a637c6 | 23             | C3            | 2025-12-05 23:30:57.694038+00 | 2025-12-05 23:31:01.954+00    | 4.259962        | P1                  | not-hired   |
| 39c50371-8efd-4fcc-80f9-9ccc03a637c6 | 23             | C3            | 2025-12-05 23:30:57.694038+00 | 2025-12-05 23:31:03.984068+00 | 6.290030        | P1                  | not-hired   |
| 9e921d03-85f5-49b6-adbe-558f5a0a4205 | 22             | C3            | 2025-12-05 23:26:30.695506+00 | 2025-12-05 23:26:35.056+00    | 4.360494        | P1                  | declined    |
| 9e921d03-85f5-49b6-adbe-558f5a0a4205 | 22             | C3            | 2025-12-05 23:26:30.695506+00 | 2025-12-05 23:26:35.14+00     | 4.444494        | P1                  | declined    |
| 9e921d03-85f5-49b6-adbe-558f5a0a4205 | 22             | C3            | 2025-12-05 23:26:30.695506+00 | 2025-12-05 23:26:37.669789+00 | 6.974283        | P1                  | declined    |
| 67ace9a9-ddbb-4caf-b96b-97e7b6ab2429 | 21             | C3            | 2025-12-05 23:26:30.619799+00 | null                          | null            | null                | null        |
| 60ff8d3e-4b1b-4147-b27d-979453a2e77e | 20             | C1            | 2025-12-05 23:25:23.409734+00 | null                          | null            | null                | null        |
| 62e84cb8-c389-4f6b-8474-de5f7e614185 | 19             | C1            | 2025-12-05 23:25:23.334186+00 | 2025-12-05 23:25:25.754+00    | 2.419814        | P1                  | declined    |
| 62e84cb8-c389-4f6b-8474-de5f7e614185 | 19             | C1            | 2025-12-05 23:25:23.334186+00 | 2025-12-05 23:25:25.639+00    | 2.304814        | P1                  | declined    |
| 3c1543b0-800e-4795-9f60-b34f400a6997 | 16             | C1            | 2025-12-05 23:00:44.293696+00 | null                          | null            | null                | null        |
| 7f42246c-f1af-4152-92be-e56a75e4c4ea | 15             | C1            | 2025-12-05 23:00:44.185555+00 | 2025-12-05 23:02:22.848767+00 | 98.663212       | P1                  | declined    |

-- ============================================================================
-- QUERY 9: Find functions that might be called on INSERT projects
-- ============================================================================
-- Check what RPC functions exist and what they do
SELECT 
  p.proname,
  p.prokind,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND (p.proname LIKE '%match%' OR p.proname LIKE '%opportun%')
ORDER BY p.proname;

| proname                                    | prokind | function_definition                                                                             |
| can_enable_matching                        | f       | CREATE OR REPLACE FUNCTION public.can_enable_matching(p_practitioner_serial text)

-- ============================================================================
-- QUERY 10: Check for any event triggers or webhooks
-- ============================================================================
-- PostgreSQL can have event triggers - check if any exist
SELECT 
  evtname,
  evtevent,
  evtenabled,
  evtfoid
FROM pg_event_trigger
ORDER BY evtname;

| evtname                   | evtevent        | evtenabled | evtfoid |
| ------------------------- | --------------- | ---------- | ------- |
| graphql_watch_ddl         | ddl_command_end | O          | 16693   |
| graphql_watch_drop        | sql_drop        | O          | 16693   |
| issue_graphql_placeholder | sql_drop        | O          | 16620   |
| issue_pg_cron_access      | ddl_command_end | O          | 16597   |
| issue_pg_graphql_access   | ddl_command_end | O          | 16618   |
| issue_pg_net_access       | ddl_command_end | O          | 16599   |
| pgrst_ddl_watch           | ddl_command_end | O          | 16609   |
| pgrst_drop_watch          | sql_drop        | O          | 16610   |

-- ============================================================================
-- QUERY 11: Check audit logs if they exist
-- ============================================================================
-- Some systems track who/what modified tables
SELECT *
FROM audit_log
WHERE table_name = 'project_practitioner_matches'
ORDER BY created_at DESC
LIMIT 20;

Error: Failed to run sql query: ERROR: 42P01: relation "audit_log" does not exist LINE 3: FROM audit_log ^

-- ============================================================================
-- QUERY 12: Check if there's a match_practitioners_auto RPC or similar
-- ============================================================================
-- Look for any RPC that might be hidden
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE proname ILIKE '%match%'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- ============================================================================
-- QUERY 13: Check for pg_cron scheduled jobs
-- ============================================================================
-- pg_cron is installed, check if there are any jobs auto-creating matches
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
ORDER BY jobid;

-- ============================================================================
-- QUERY 14: Check for any RLS policy that might be auto-creating matches
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'project_practitioner_matches'
ORDER BY policyname;

| proname                                    | prosrc |

-- ============================================================================
-- QUERY 13: Check for pg_cron scheduled jobs
-- ============================================================================
-- pg_cron is installed, check if there are any jobs auto-creating matches
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
ORDER BY jobid;

-- ============================================================================
-- QUERY 14: Check for any RLS policy that might be auto-creating matches
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'project_practitioner_matches'
ORDER BY policyname;

-- ============================================================================
-- QUERY 15: Get the full definition of trigger_create_client_notification_settings
-- ============================================================================
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'trigger_create_client_notification_settings' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============================================================================
-- THE FIX: Block automatic match creation
-- ============================================================================
-- Once you identify WHERE matches are being auto-created, disable it with:

-- OPTION A: If it's a cron job, disable it:
-- SELECT cron.unschedule(jobid) FROM cron.job WHERE command LIKE '%create_practitioner_match%';

-- OPTION B: If it's a trigger, drop it:
-- DROP TRIGGER IF EXISTS auto_create_matches_on_projects ON projects;

-- OPTION C: If it's an RPC being called, modify the create_practitioner_match function to include a flag:
-- Add a parameter: p_skip_auto_create BOOLEAN DEFAULT FALSE
-- Then check: IF p_skip_auto_create = TRUE THEN RETURN; END IF;

-- OPTION D: Best practice - Add an audit trail to match creation:
-- Add columns to project_practitioner_matches:
-- ALTER TABLE project_practitioner_matches ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'auto';
-- ALTER TABLE project_practitioner_matches ADD COLUMN IF NOT EXISTS creation_source TEXT DEFAULT 'unknown';
-- Then you can track: 'auto' vs 'manual' vs 'edge_function'

-- The key insight: open_to_match should make projects VISIBLE to practitioners in opportunities tab,
-- NOT automatically create matches. Matches should only be created when:
-- 1. Client clicks "connect" in find-practitioners.html
-- 2. Practitioner clicks "connect" in opportunities tab  
-- 3. Admin manually creates match (future feature)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| can_enable_matching                        | 
