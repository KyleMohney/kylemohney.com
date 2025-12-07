# OPPORTUNITIES GENERATION SYSTEM - BUILD PLAN

**Status:** Scaffold Phase - No implementation code yet  
**Branch:** main  
**Date Started:** December 6, 2025

---

## SYSTEM OVERVIEW

### What We're Building
A safe, opt-in opportunity lead generation system that:
- Creates opportunities when clients mark a match as "not-hired"
- Only generates opportunities if client has `open_to_match = true`
- Uses inverted matching (practitioners receive opportunities, not auto-matches)
- Tracks everything via serial numbers for audit trail
- Expires opportunities after 30 days or when project is resolved
- **Respects practitioner choice** - Won't show opportunities for projects they declined or blocked

### Key Safety Principles
1. **No auto-matching** - Opportunities are NOT matches
2. **Respects client preference** - Only if `open_to_match = true`
3. **Excludes blocked/existing** - Won't re-contact practitioners already involved
4. **Respects practitioner choice** - Won't show opportunities for projects they declined or blocked
5. **Time-limited** - 30-day window for opportunities
6. **Reversible** - Can deactivate opportunities at any point
7. **Auditable** - Serial system tracks source and timing

---

## FILES CREATED

### Database Layer
- **06_Opportunities_Generation_System.sql**
  - Phase 1: Foundation functions (serial generation, eligibility check, deactivation)
  - Phase 2: Triggers (on not-hired, in-progress, hired status changes)
  - Phase 3: Maintenance functions (daily expiration, cleanup)
  - Phase 4: Testing helpers (commented)

### JavaScript Layer
- **opportunitiesLeadsManager.js**
  - Practitioner-facing UI for browsing opportunities
  - Load, filter, render opportunities
  - Express interest / decline actions
  - Real-time updates and lifecycle management

### Planning Document
- **OPPORTUNITIES_BUILD_PLAN.md** (this file)
  - Architecture overview
  - Implementation checklist
  - Safety validation points
  - Rollback strategy

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Foundation Functions
- [ ] `fn_generate_opportunity_serial()` - Auto-increment O1, O2, etc.
- [ ] `fn_check_opportunity_eligibility()` - Verify practitioner should receive opp
  - Exclude if practitioner already has match (any status) on this project
  - Exclude if practitioner blocked by client (practitioner_blocks.is_blocked = true)
  - Exclude if practitioner has match with status = 'declined' on this project
  - Exclude if project_practitioner_matches for this practitioner has match_status = 'blocked'
  - Include only if practitioner has matching category and service type
  - Include only if practitioner's location matches project travel_preference
- [ ] `fn_deactivate_opportunity()` - Mark opportunity as inactive
- [ ] **Code Review Checkpoint**

### Phase 2: Triggers
- [ ] `trg_opportunity_on_match_not_hired` - Main trigger
- [ ] `trg_opportunity_on_match_in_progress` - Deactivate when match accepted
- [ ] `trg_opportunity_on_match_hired` - Deactivate when match hired
- [ ] **Test with sample data**
- [ ] **Code Review Checkpoint**

### Phase 3: Maintenance
- [ ] `fn_expire_opportunities_daily()` - 30-day expiration
- [ ] `fn_cleanup_closed_project_opportunities()` - Project closure cleanup
- [ ] **Test expiration logic**
- [ ] **Code Review Checkpoint**

### Phase 4: JavaScript UI
- [ ] Setup DOM elements in opportunities tab
- [ ] Load opportunities for current practitioner
- [ ] Render opportunity cards
- [ ] Filter/sort functionality
- [ ] Express interest button
- [ ] Decline opportunity button
- [ ] Empty state handling
- [ ] **UI Testing with sample data**
- [ ] **Code Review Checkpoint**

---

## SAFETY VALIDATION POINTS

### Before Each Phase Implementation
- [ ] Read through logic carefully
- [ ] Identify edge cases
- [ ] Plan rollback approach
- [ ] Consider concurrent updates

### After Each Phase Implementation
- [ ] Test with sample data
- [ ] Verify no side effects
- [ ] Check error handling
- [ ] Review for security issues
- [ ] Test rollback scenario

### Before Production Deployment
- [ ] Load test with realistic data volume
- [ ] Test with multiple concurrent clients/practitioners
- [ ] Verify expiration logic works correctly
- [ ] Test practitioner blocking/exclusion
- [ ] Verify client `open_to_match` setting is respected
- [ ] Monitor for auto-matching reoccurrence

---

## ROLLBACK STRATEGY

### If Issues Found During Phase 1 (Functions)
- Drop new functions
- No data affected
- Safe to retry

### If Issues Found During Phase 2 (Triggers)
- Disable triggers by dropping them
- Manually deactivate any created opportunities
- Revert trigger code
- Test again

### If Issues Found During Phase 3 (Maintenance)
- Disable scheduled jobs
- Manually fix affected records
- Test cleanup functions separately

### If Issues Found During Phase 4 (UI)
- Hide opportunities tab (CSS display: none)
- Keep database intact
- Fix and redeploy UI

### Full Revert Strategy
```sql
-- Drop all new objects
DROP TRIGGER IF EXISTS trg_opportunity_on_match_not_hired ON project_practitioner_matches;
DROP TRIGGER IF EXISTS trg_opportunity_on_match_in_progress ON project_practitioner_matches;
DROP TRIGGER IF EXISTS trg_opportunity_on_match_hired ON project_practitioner_matches;

DROP FUNCTION IF EXISTS fn_generate_opportunity_serial();
DROP FUNCTION IF EXISTS fn_check_opportunity_eligibility();
DROP FUNCTION IF EXISTS fn_deactivate_opportunity();
DROP FUNCTION IF EXISTS fn_expire_opportunities_daily();
DROP FUNCTION IF EXISTS fn_cleanup_closed_project_opportunities();

-- Deactivate all opportunities
UPDATE opportunities SET is_active = false WHERE is_active = true;

-- Restore previous state
-- (All data remains intact)
```

---

## NEXT STEPS

1. **Review this plan** - Make sure approach aligns with vision
2. **Identify any concerns** - Address before coding
3. **Build Phase 1** - Start with foundation functions
4. **Test thoroughly** - Don't skip testing between phases
5. **Code review** - Get eyes on the logic before moving forward

---

## QUESTIONS TO ANSWER BEFORE CODING

1. Should practitioners be notified when they receive an opportunity?
2. Should there be a limit on opportunities per practitioner per client?
3. Should opportunities show expected client budget/urgency?
4. Should practitioners be able to "snooze" an opportunity?
5. Should we track which opportunities led to actual matches (conversion)?

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-06  
**Status:** Ready for review and Phase 1 implementation
