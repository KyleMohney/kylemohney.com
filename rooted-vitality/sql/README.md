# Rooted Vitality Database - SQL Files

## Master Files (Canonical Source of Truth)

These 3 files contain all production logic. Everything else is reference/schema.

### 01_MATCHING_LOGIC_MASTER.sql
**Purpose**: Matching algorithm that finds practitioners for projects

**Key Function**: `match_practitioners(project_uuid UUID)`
- Input: UUID of a project
- Returns: Matching practitioners ordered by profile completion (highest first)
- Logic:
  - PHASE 1: Hard filters (all must pass)
    - Deleted = NO
    - Matching enabled = YES
    - Matching paused = NO
    - Category matches
    - At least one subcategory matches
    - Travel type enabled
    - Geographic match (varies by travel type)
  - PHASE 2: Score 2-100 based on profile_completion_percent
- Output: practitioner_id, serial, name, modalities, conditions, email, phone, match_score

---

### 02_ROW_LEVEL_SECURITY_MASTER.sql
**Purpose**: Security policies ensuring users only see their own data

**Policies for 7 tables**: clients, practitioners, projects, project_practitioner_matches, reviews, notifications, project_messages

---

### 03_SERIAL_NUMBERS_TRIGGERS_MASTER.sql
**Purpose**: Auto-generate serial numbers + manage timestamps

**Serial Numbers**:
- Clients: C1, C2, C3...
- Practitioners: P1, P2, P3...
- Projects: 1, 2, 3...

---

## Reference Files

### SCHEMA.md
Complete database schema documentation

### SQL_MASTER_FILES_README.md
Historical notes on consolidation

---

## Quick Setup

1. Paste `01_MATCHING_LOGIC_MASTER.sql` into Supabase → Run
2. Paste `02_ROW_LEVEL_SECURITY_MASTER.sql` into Supabase → Run
3. Paste `03_SERIAL_NUMBERS_TRIGGERS_MASTER.sql` into Supabase → Run

Done!
