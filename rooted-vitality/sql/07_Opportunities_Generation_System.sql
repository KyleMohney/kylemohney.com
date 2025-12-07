/*
╔════════════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                                     ║
║  File: rooted-vitality/sql/06_Opportunities_Generation_System.sql          ║
║  Purpose: Build safe opportunity lead generation system                    ║
║  Holistic Wellness · Modern Connection Platform                            ║
║  rootedvitality.com | 2025                                                 ║
╚════════════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
=================

PHASE 1: FOUNDATION
  1.1 - Serial Number Generation Function
  1.2 - Opportunity Eligibility Check Function
  1.3 - Opportunity Deactivation Function

PHASE 2: TRIGGERS
  2.1 - Trigger on project_practitioner_matches status → not-hired
  2.2 - Trigger on project_practitioner_matches status → in-progress
  2.3 - Trigger on project_practitioner_matches status → hired

PHASE 3: MAINTENANCE
  3.1 - Daily expiration job function
  3.2 - Cleanup function for closed projects

PHASE 4: TESTING HELPERS
  4.1 - Test data setup (commented)
  4.2 - Query helpers for verification

NOTES
=====
- This system only creates opportunities when client has open_to_match = true
- Opportunities are never created automatically on project creation
- Opportunities expire after 30 days OR when project match is hired/in-progress
- Uses serial system for audit trail: client_serial, practitioner_serial, project_serial
- Inverted matching: practitioners receive opportunities, not automatic matches
*/

-- ============================================================================
-- PHASE 1: FOUNDATION FUNCTIONS
-- ============================================================================

-- 1.1 Serial Number Generation Function
-- [PLACEHOLDER - Code will go here]

-- 1.2 Opportunity Eligibility Check Function
-- [PLACEHOLDER - Code will go here]

-- 1.3 Opportunity Deactivation Function
-- [PLACEHOLDER - Code will go here]


-- ============================================================================
-- PHASE 2: TRIGGERS
-- ============================================================================

-- 2.1 Trigger on project_practitioner_matches status → not-hired
-- [PLACEHOLDER - Code will go here]

-- 2.2 Trigger on project_practitioner_matches status → in-progress
-- [PLACEHOLDER - Code will go here]

-- 2.3 Trigger on project_practitioner_matches status → hired
-- [PLACEHOLDER - Code will go here]


-- ============================================================================
-- PHASE 3: MAINTENANCE
-- ============================================================================

-- 3.1 Daily expiration job function
-- [PLACEHOLDER - Code will go here]

-- 3.2 Cleanup function for closed projects
-- [PLACEHOLDER - Code will go here]


-- ============================================================================
-- PHASE 4: TESTING HELPERS (COMMENTED)
-- ============================================================================

-- 4.1 Test data setup
-- [PLACEHOLDER - Code will go here]

-- 4.2 Query helpers for verification
-- [PLACEHOLDER - Code will go here]
