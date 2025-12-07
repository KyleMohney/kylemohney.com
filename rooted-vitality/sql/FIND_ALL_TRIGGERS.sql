-- Find all triggers on project_practitioner_matches
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'project_practitioner_matches'
ORDER BY trigger_name;

-- Get full trigger definitions
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'project_practitioner_matches'::regclass
ORDER BY t.tgname;

| trigger_name                                   | function_name                           | trigger_definition                                                                                                                                                                                                                                                 |
| ---------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RI_ConstraintTrigger_a_50821                   | RI_FKey_cascade_del                     | CREATE CONSTRAINT TRIGGER "RI_ConstraintTrigger_a_50821" AFTER DELETE ON public.project_practitioner_matches FROM project_messages NOT DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION "RI_FKey_cascade_del"()                                        |
| RI_ConstraintTrigger_a_50822                   | RI_FKey_noaction_upd                    | CREATE CONSTRAINT TRIGGER "RI_ConstraintTrigger_a_50822" AFTER UPDATE ON public.project_practitioner_matches FROM project_messages NOT DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION "RI_FKey_noaction_upd"()                                       |
| RI_ConstraintTrigger_a_51220                   | RI_FKey_noaction_del                    | CREATE CONSTRAINT TRIGGER "RI_ConstraintTrigger_a_51220" AFTER DELETE ON public.project_practitioner_matches FROM opportunities NOT DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION "RI_FKey_noaction_del"()                                          |
| RI_ConstraintTrigger_a_51221                   | RI_FKey_noaction_upd                    | CREATE CONSTRAINT TRIGGER "RI_ConstraintTrigger_a_51221" AFTER UPDATE ON public.project_practitioner_matches FROM opportunities NOT DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION "RI_FKey_noaction_upd"()                                          |
| RI_ConstraintTrigger_c_28375                   | RI_FKey_check_ins                       | CREATE CONSTRAINT TRIGGER "RI_ConstraintTrigger_c_28375" AFTER INSERT ON public.project_practitioner_matches FROM practitioners NOT DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION "RI_FKey_check_ins"()                                             |
| RI_ConstraintTrigger_c_28376                   | RI_FKey_check_upd                       | CREATE CONSTRAINT TRIGGER "RI_ConstraintTrigger_c_28376" AFTER UPDATE ON public.project_practitioner_matches FROM practitioners NOT DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION "RI_FKey_check_upd"()                                             |
| RI_ConstraintTrigger_c_28380                   | RI_FKey_check_ins                       | CREATE CONSTRAINT TRIGGER "RI_ConstraintTrigger_c_28380" AFTER INSERT ON public.project_practitioner_matches FROM clients NOT DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION "RI_FKey_check_ins"()                                                   |
| RI_ConstraintTrigger_c_28381                   | RI_FKey_check_upd                       | CREATE CONSTRAINT TRIGGER "RI_ConstraintTrigger_c_28381" AFTER UPDATE ON public.project_practitioner_matches FROM clients NOT DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION "RI_FKey_check_upd"()                                                   |
| trg_hired_closes_project                       | fn_hired_closes_project                 | CREATE TRIGGER trg_hired_closes_project AFTER UPDATE ON public.project_practitioner_matches FOR EACH ROW EXECUTE FUNCTION fn_hired_closes_project()                                                                                                                |
| trg_hired_deactivates_other_matches            | fn_hired_deactivates_other_matches      | CREATE TRIGGER trg_hired_deactivates_other_matches AFTER UPDATE ON public.project_practitioner_matches FOR EACH ROW WHEN ((new.status = 'hired'::text)) EXECUTE FUNCTION fn_hired_deactivates_other_matches()                                                      |
| trg_notify_practitioner_new_match              | fn_notify_practitioner_new_match        | CREATE TRIGGER trg_notify_practitioner_new_match AFTER INSERT ON public.project_practitioner_matches FOR EACH ROW EXECUTE FUNCTION fn_notify_practitioner_new_match()                                                                                              |
| trg_sync_practitioner_response_to_status       | fn_sync_practitioner_response_to_status | CREATE TRIGGER trg_sync_practitioner_response_to_status BEFORE UPDATE ON public.project_practitioner_matches FOR EACH ROW WHEN ((old.practitioner_response IS DISTINCT FROM new.practitioner_response)) EXECUTE FUNCTION fn_sync_practitioner_response_to_status() |
| update_project_practitioner_matches_updated_at | update_updated_at_column                | CREATE TRIGGER update_project_practitioner_matches_updated_at BEFORE UPDATE ON public.project_practitioner_matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()                                                                                        |