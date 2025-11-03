# Match Settings Database Schema - Complete Reference

## Overview

This document explains the complete database schema for match settings, including the holistic health taxonomy, practitioner-specific configurations, and payment information.

The design follows these principles:
- **Root Taxonomy**: Master list of all 22 holistic health categories (reference data)
- **User-Specific Settings**: Each practitioner has their own match preferences and selected services
- **Relational Integrity**: Foreign keys ensure data consistency
- **Security**: Row-level security (RLS) policies ensure practitioners only see their own data

---

## Part 1: Taxonomy Tables (Reference Data)

### Table: `holistic_health_taxonomy`
Master list of all 22 holistic health service categories.

**Purpose**: Provides the root taxonomy that all practitioners can choose from.

**Schema**:
```sql
CREATE TABLE holistic_health_taxonomy (
  id UUID PRIMARY KEY,                    -- Unique ID
  category_id TEXT UNIQUE,                -- URL-safe slug (e.g., "acupuncture")
  name TEXT,                              -- Display name (e.g., "Acupuncture & TCM")
  icon TEXT,                              -- Emoji (e.g., "🧬")
  credential_level TEXT,                  -- 'none', 'certification', 'license'
  credential_description TEXT,            -- e.g., "🔴 License Required"
  description TEXT,                       -- Longer description
  display_order INTEGER,                  -- Sort order in UI
  is_active BOOLEAN,                      -- Can be deactivated
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Example Records** (22 total):
```
id: uuid-1, category_id: acupuncture, name: Acupuncture & TCM, icon: 🧬, credential_level: license
id: uuid-2, category_id: chiropractic, name: Chiropractic Care, icon: 🔧, credential_level: license
id: uuid-3, category_id: wellness_coaching, name: Wellness Coaching, icon: 💪, credential_level: none
... (19 more)
```

**Categories** (All 22 loaded):
1. Acupuncture & TCM - 🧬 - License Required
2. Chiropractic Care - 🔧 - License Required
3. Naturopathic Medicine - 🌿 - Certification Recommended
4. Nutrition & Dietetics - 🥗 - Certification Recommended
5. Wellness Coaching - 💪 - No Credential Required
6. Personal Training - 🏋️ - Certification Recommended
7. Yoga - 🧘 - Certification Recommended
8. Meditation - 🎯 - No Credential Required
9. Mental Health & Counseling - 🧠 - License Required
10. Energy Healing - ⚡ - No Credential Required
11. Herbalism - 🌱 - Certification Recommended
12. Ayurveda - 🎋 - Certification Recommended
13. Homeopathy - 💊 - Certification Recommended
14. Functional Medicine - 🔬 - License Required
15. Physical Therapy - 🤸 - License Required
16. Aromatherapy - 🌸 - Certification Recommended
17. Life Coaching - 🎯 - No Credential Required
18. Hypnotherapy - 🌀 - Certification Recommended
19. Midwifery & Doula Services - 👶 - License Required
20. Reflexology - 🦶 - Certification Recommended
21. Osteopathy - 💀 - License Required

**Queries**:
```sql
-- Get all categories
SELECT * FROM holistic_health_taxonomy ORDER BY display_order;

-- Count by credential level
SELECT credential_level, COUNT(*) FROM holistic_health_taxonomy GROUP BY credential_level;

-- Get one category by ID
SELECT * FROM holistic_health_taxonomy WHERE category_id = 'acupuncture';
```

---

### Table: `taxonomy_subcategories`
Specific services under each category.

**Purpose**: Provides granular service options. Each category has 10-20 subcategories.

**Schema**:
```sql
CREATE TABLE taxonomy_subcategories (
  id UUID PRIMARY KEY,
  taxonomy_id UUID NOT NULL,              -- Foreign key to holistic_health_taxonomy
  name TEXT NOT NULL,                     -- Service name (e.g., "Pain Management")
  display_order INTEGER,                  -- Sort within category
  is_active BOOLEAN,
  created_at TIMESTAMP
);
```

**Example Records** (330+ total - ~15-20 per category):
```
For Acupuncture (category_id: acupuncture):
  - Pain Management
  - Fertility Support
  - Women's Health
  - Stress & Anxiety Relief
  - Digestive Issues
  - ... (15 more)

For Chiropractic (category_id: chiropractic):
  - Spinal Adjustment/Manipulation
  - Back Pain Treatment
  - Neck Pain Treatment
  - ... (15 more)
```

**Queries**:
```sql
-- Get all services under a category
SELECT ts.name FROM taxonomy_subcategories ts
JOIN holistic_health_taxonomy t ON ts.taxonomy_id = t.id
WHERE t.category_id = 'acupuncture'
ORDER BY ts.display_order;

-- Count subcategories per category
SELECT 
  t.name as category,
  COUNT(ts.id) as subcategory_count
FROM holistic_health_taxonomy t
LEFT JOIN taxonomy_subcategories ts ON t.id = ts.taxonomy_id
GROUP BY t.id, t.name
ORDER BY t.display_order;
```

---

## Part 2: Practitioner Match Settings

### Table: `practitioner_match_settings`
Main settings for each practitioner's matching preferences.

**Purpose**: Tracks whether matching is active, paused, and configuration preferences.

**Schema**:
```sql
CREATE TABLE practitioner_match_settings (
  id UUID PRIMARY KEY,
  practitioner_id UUID NOT NULL UNIQUE,   -- Foreign key to practitioners
  is_matching_active BOOLEAN,             -- Global on/off toggle
  matching_activated_at TIMESTAMP,        -- When they turned on matching
  is_paused BOOLEAN,                      -- Currently paused?
  pause_until TIMESTAMP,                  -- Auto-resume time
  pause_reason TEXT,                      -- Why they paused
  paused_at TIMESTAMP,                    -- When pause started
  target_response_time_minutes INTEGER,   -- Expected response time (default: 10)
  min_budget_tier TEXT,                   -- 'low', 'mid', 'high', 'any'
  max_distance_miles INTEGER,             -- Search radius
  notes TEXT,                             -- Internal notes
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Example Record**:
```
practitioner_id: uuid-456,
is_matching_active: true,
matching_activated_at: 2025-11-02 10:00:00,
is_paused: false,
pause_until: NULL,
pause_reason: NULL,
target_response_time_minutes: 10,
min_budget_tier: 'any',
max_distance_miles: 25,
updated_at: 2025-11-02 10:00:00
```

**Queries**:
```sql
-- Get match status for a practitioner
SELECT * FROM practitioner_match_settings WHERE practitioner_id = 'uuid-456';

-- Find all practitioners currently accepting matches
SELECT * FROM practitioner_match_settings 
WHERE is_matching_active = true AND is_paused = false;

-- Find practitioners who will auto-resume soon
SELECT * FROM practitioner_match_settings 
WHERE is_paused = true AND pause_until < NOW() + INTERVAL '1 hour';
```

---

### Table: `practitioner_selected_services`
Which specific services each practitioner offers.

**Purpose**: Links practitioners to the subcategories they've selected. One row per selected service.

**Schema**:
```sql
CREATE TABLE practitioner_selected_services (
  id UUID PRIMARY KEY,
  practitioner_id UUID NOT NULL,          -- Foreign key to practitioners
  taxonomy_id UUID NOT NULL,              -- Foreign key to holistic_health_taxonomy
  subcategory_id UUID NOT NULL,           -- Foreign key to taxonomy_subcategories
  is_active BOOLEAN,                      -- Can deactivate individual services
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Unique Constraint**: One row per (practitioner_id, subcategory_id) pair.

**Example Records** (Multiple rows per practitioner):
```
Practitioner A (uuid-456) offers:
  id: uuid-600, practitioner_id: uuid-456, taxonomy_id: uuid-1, subcategory_id: uuid-101, is_active: true
  id: uuid-601, practitioner_id: uuid-456, taxonomy_id: uuid-1, subcategory_id: uuid-102, is_active: true
  id: uuid-602, practitioner_id: uuid-456, taxonomy_id: uuid-1, subcategory_id: uuid-103, is_active: false
  ... (12 more under Acupuncture)
  id: uuid-610, practitioner_id: uuid-456, taxonomy_id: uuid-3, subcategory_id: uuid-201, is_active: true
  ... (more under other categories)
```

**Queries**:
```sql
-- Get all active services for a practitioner
SELECT 
  t.name as category,
  ts.name as service
FROM practitioner_selected_services pss
JOIN holistic_health_taxonomy t ON pss.taxonomy_id = t.id
JOIN taxonomy_subcategories ts ON pss.subcategory_id = ts.id
WHERE pss.practitioner_id = 'uuid-456'
AND pss.is_active = true
ORDER BY t.display_order, ts.display_order;

-- Count services per category for a practitioner
SELECT 
  t.name as category,
  COUNT(*) as active_services
FROM practitioner_selected_services pss
JOIN holistic_health_taxonomy t ON pss.taxonomy_id = t.id
WHERE pss.practitioner_id = 'uuid-456'
AND pss.is_active = true
GROUP BY t.id, t.name
ORDER BY t.display_order;

-- Check if practitioner offers a specific service
SELECT * FROM practitioner_selected_services
WHERE practitioner_id = 'uuid-456'
AND subcategory_id = 'uuid-101'
AND is_active = true;
```

---

### Table: `practitioner_match_pause_history`
Historical record of when practitioners paused/resumed matching.

**Purpose**: Audit trail for compliance and analytics.

**Schema**:
```sql
CREATE TABLE practitioner_match_pause_history (
  id UUID PRIMARY KEY,
  practitioner_id UUID NOT NULL,          -- Foreign key to practitioners
  pause_start TIMESTAMP NOT NULL,         -- When pause began
  pause_end TIMESTAMP,                    -- When it ended (NULL if still paused)
  pause_reason TEXT,                      -- Why they paused
  pause_duration_minutes INTEGER,         -- How long they paused
  initiated_by TEXT,                      -- 'practitioner', 'auto-resume', 'system'
  created_at TIMESTAMP
);
```

**Example Records**:
```
Practitioner A pause history:
  id: uuid-700, practitioner_id: uuid-456, pause_start: 2025-11-01 14:00:00, 
    pause_end: 2025-11-02 10:00:00, pause_reason: "On vacation", 
    pause_duration_minutes: 1440, initiated_by: "practitioner"
  
  id: uuid-701, practitioner_id: uuid-456, pause_start: 2025-11-02 16:00:00,
    pause_end: NULL, pause_reason: "Temporarily full", 
    initiated_by: "practitioner"
```

**Queries**:
```sql
-- Get pause history for a practitioner
SELECT * FROM practitioner_match_pause_history
WHERE practitioner_id = 'uuid-456'
ORDER BY pause_start DESC;

-- Get current pause status
SELECT * FROM practitioner_match_pause_history
WHERE practitioner_id = 'uuid-456'
AND pause_end IS NULL;

-- Calculate total pause time in last 30 days
SELECT 
  SUM(EXTRACT(EPOCH FROM (COALESCE(pause_end, NOW()) - pause_start))/60) as total_pause_minutes
FROM practitioner_match_pause_history
WHERE practitioner_id = 'uuid-456'
AND pause_start > NOW() - INTERVAL '30 days';
```

---

## Part 3: Payment Information (Practitioners Table)

### Columns Added to `practitioners` Table

**Schema**:
```sql
ALTER TABLE practitioners 
ADD COLUMN payment_methods TEXT,        -- Free-form text of accepted methods
ADD COLUMN accepts_insurance BOOLEAN DEFAULT FALSE;  -- Insurance billing
```

**Purpose**: Store payment method preferences for each practitioner.

**Data Storage**:
- `payment_methods`: Open text field (e.g., "Credit cards, PayPal, Venmo, Cash, Check, FSA/HSA")
- `accepts_insurance`: Boolean flag for insurance acceptance

**Example Records**:
```
practitioner_id: uuid-456
payment_methods: "Visa, Mastercard, Amex, PayPal, Venmo, Cash, Check, FSA/HSA"
accepts_insurance: true

practitioner_id: uuid-457
payment_methods: "Cash only, Check, PayPal"
accepts_insurance: false
```

**Queries**:
```sql
-- Get payment info for a practitioner
SELECT payment_methods, accepts_insurance FROM practitioners WHERE id = 'uuid-456';

-- Find practitioners accepting insurance
SELECT legal_business_name, payment_methods FROM practitioners
WHERE accepts_insurance = true;

-- Find payment methods commonly accepted
SELECT payment_methods FROM practitioners WHERE accepts_insurance = true;
```

---

## Data Relationships Diagram

```
┌─────────────────────────────────────────────────────────┐
│             REFERENCE DATA (Taxonomy)                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  holistic_health_taxonomy                               │
│  ├─ id (PK)                                            │
│  ├─ category_id (UNIQUE)                              │
│  ├─ name (22 categories)                              │
│  └─ credential_level                                   │
│         │                                               │
│         └──> taxonomy_subcategories (330+ records)     │
│              ├─ taxonomy_id (FK)                       │
│              └─ name (15-20 per category)              │
└─────────────────────────────────────────────────────────┘
                        │ (READ ONLY)
                        │
┌─────────────────────────────────────────────────────────┐
│         USER SETTINGS (Per Practitioner)                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  practitioners                                           │
│  ├─ id (PK)                                            │
│  ├─ user_id (FK to auth)                              │
│  ├─ payment_methods (TEXT)                            │
│  ├─ accepts_insurance (BOOLEAN)                       │
│  │                                                     │
│  ├─> practitioner_match_settings (1:1)               │
│  │   ├─ is_matching_active (BOOLEAN)                │
│  │   ├─ is_paused (BOOLEAN)                         │
│  │   ├─ pause_until (TIMESTAMP)                     │
│  │   └─ target_response_time_minutes (INT)          │
│  │                                                     │
│  ├─> practitioner_selected_services (1:N)           │
│  │   ├─ taxonomy_id (FK)                           │
│  │   └─ subcategory_id (FK)                        │
│  │                                                     │
│  └─> practitioner_match_pause_history (1:N)         │
│      ├─ pause_start (TIMESTAMP)                    │
│      ├─ pause_end (TIMESTAMP)                      │
│      └─ initiated_by (TEXT)                        │
│                                                      │
└─────────────────────────────────────────────────────────┘
```

---

## Row-Level Security (RLS) Policies

All practitioner data is protected by RLS policies:

### Policy 1: Match Settings
```sql
-- Practitioners can only see/edit their own match settings
USING (
  practitioner_id IN (
    SELECT id FROM practitioners WHERE user_id = auth.uid()
  )
)
```

### Policy 2: Selected Services
```sql
-- Practitioners can only see/edit their own selected services
USING (
  practitioner_id IN (
    SELECT id FROM practitioners WHERE user_id = auth.uid()
  )
)
```

### Policy 3: Pause History
```sql
-- Practitioners can only view their own pause history
USING (
  practitioner_id IN (
    SELECT id FROM practitioners WHERE user_id = auth.uid()
  )
)
```

### Policy 4: Taxonomy (Read-Only)
```sql
-- All authenticated users can read taxonomy
USING (true)

-- No write permissions for authenticated users
```

---

## Example: Complete Data Flow

### Scenario: Practitioner Adds Acupuncture Service

**Step 1**: User searches for "acupuncture" in match-settings.html
```sql
SELECT * FROM holistic_health_taxonomy WHERE name ILIKE '%acupuncture%'
-- Returns: {id: uuid-1, category_id: "acupuncture", name: "Acupuncture & TCM", ...}
```

**Step 2**: User selects "Acupuncture & TCM" and picks subcategories
```sql
-- Get subcategories for Acupuncture
SELECT * FROM taxonomy_subcategories 
WHERE taxonomy_id = uuid-1
ORDER BY display_order
-- Returns: Pain Management, Fertility Support, Women's Health, ...
```

**Step 3**: User checks specific services (Pain Management, Fertility Support) and clicks Save
```sql
-- Insert selected services for practitioner
INSERT INTO practitioner_selected_services (
  practitioner_id, taxonomy_id, subcategory_id, is_active
) VALUES
  (uuid-456, uuid-1, uuid-101, true),  -- Pain Management
  (uuid-456, uuid-1, uuid-102, true);  -- Fertility Support
```

**Step 4**: User toggles matching on
```sql
-- Update match settings
UPDATE practitioner_match_settings 
SET 
  is_matching_active = true,
  is_paused = false,
  matching_activated_at = NOW(),
  updated_at = NOW()
WHERE practitioner_id = uuid-456;
```

**Step 5**: User pauses matching for 2 hours
```sql
-- Update match settings
UPDATE practitioner_match_settings 
SET 
  is_paused = true,
  pause_until = NOW() + INTERVAL '2 hours',
  pause_reason = 'In a session',
  paused_at = NOW(),
  updated_at = NOW()
WHERE practitioner_id = uuid-456;

-- Record in history
INSERT INTO practitioner_match_pause_history (
  practitioner_id, pause_start, pause_reason, initiated_by
) VALUES
  (uuid-456, NOW(), 'In a session', 'practitioner');
```

**Step 6**: After 2 hours, matching auto-resumes (via application logic)
```sql
-- Application detects pause_until < NOW()
UPDATE practitioner_match_settings 
SET 
  is_paused = false,
  pause_until = NULL,
  updated_at = NOW()
WHERE practitioner_id = uuid-456;

-- Update history
UPDATE practitioner_match_pause_history 
SET pause_end = NOW()
WHERE practitioner_id = uuid-456 AND pause_end IS NULL;
```

---

## Performance Optimization

### Indexes Created
```sql
-- Fast taxonomy lookups
CREATE UNIQUE INDEX idx_taxonomy_category_id ON holistic_health_taxonomy(category_id);

-- Fast subcategory lookups
CREATE INDEX idx_subcategories_taxonomy ON taxonomy_subcategories(taxonomy_id);

-- Fast match settings lookups (unique - one per practitioner)
CREATE UNIQUE INDEX idx_match_settings_practitioner ON practitioner_match_settings(practitioner_id);

-- Fast service lookups
CREATE INDEX idx_practitioner_services_practitioner ON practitioner_selected_services(practitioner_id);
CREATE UNIQUE INDEX idx_practitioner_services_unique ON practitioner_selected_services(practitioner_id, subcategory_id);

-- Fast pause history lookups
CREATE INDEX idx_pause_history_practitioner ON practitioner_match_pause_history(practitioner_id);
```

---

## SQL Execution Order

When setting up the database:

1. **Create taxonomy tables** (reference data)
   - `holistic_health_taxonomy`
   - `taxonomy_subcategories`

2. **Create match settings tables** (user data)
   - `practitioner_match_settings`
   - `practitioner_selected_services`
   - `practitioner_match_pause_history`

3. **Alter practitioners table** (add payment columns)
   - Add `payment_methods`
   - Add `accepts_insurance`

4. **Load taxonomy data** (22 categories)
   - Insert all categories
   - Insert all subcategories

5. **Enable RLS and create policies**
   - Enable RLS on all tables
   - Create SELECT/INSERT/UPDATE policies

6. **Grant permissions**
   - GRANT authenticated users appropriate access

---

## Troubleshooting

### Issue: "permission denied" when inserting services
**Solution**: Check RLS policy - must be authenticated as the practitioner's user

### Issue: Taxonomy categories not loading in dropdown
**Solution**: Verify `holistic_health_taxonomy` table exists and contains 22 rows

### Issue: Pause auto-resume not working
**Solution**: Ensure application logic checks `pause_until` timestamp and updates accordingly

### Issue: Services not appearing after save
**Solution**: Verify `practitioner_selected_services` records were inserted with correct foreign keys

---

## Useful Admin Queries

```sql
-- Total practitioners with matching enabled
SELECT COUNT(*) FROM practitioner_match_settings WHERE is_matching_active = true;

-- Total services offered across platform
SELECT COUNT(DISTINCT subcategory_id) FROM practitioner_selected_services WHERE is_active = true;

-- Most popular services
SELECT 
  ts.name as service,
  COUNT(*) as practitioner_count
FROM practitioner_selected_services pss
JOIN taxonomy_subcategories ts ON pss.subcategory_id = ts.id
WHERE pss.is_active = true
GROUP BY ts.id, ts.name
ORDER BY practitioner_count DESC
LIMIT 20;

-- Practitioners accepting insurance
SELECT COUNT(*) FROM practitioners WHERE accepts_insurance = true;

-- Verify data integrity
SELECT 
  (SELECT COUNT(*) FROM holistic_health_taxonomy) as categories,
  (SELECT COUNT(*) FROM taxonomy_subcategories) as subcategories,
  (SELECT COUNT(*) FROM practitioner_match_settings) as practitioners_with_settings,
  (SELECT COUNT(*) FROM practitioner_selected_services) as total_selected_services;
```
