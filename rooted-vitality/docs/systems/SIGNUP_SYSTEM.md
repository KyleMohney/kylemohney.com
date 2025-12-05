# Signup Process & Architecture

## Overview

The Rooted Vitality signup system manages two distinct user types with different registration requirements and database constraints. Both use Supabase Auth for authentication and automated serial number generation via database triggers.

---

## System Architecture

```
client-signup.html (Client Signup Form)
    ↓
Client/Practitioner Tab Selection
    ↓
Form Data Collection + Validation
    ↓
dashboard/client/scripts/client-signup.js (Client) OR dashboard/pro/scripts/practitionerHelpers.js (Practitioner)
    ↓
Supabase Auth (Email + Password)
    ↓
Database Insert (clients OR practitioners table)
    ↓
Trigger: generate_client_serial / generate_practitioner_serial (SERIAL_NUMBER_TRIGGERS.sql)
    ↓
Serial Number Auto-Generated (C1, P1, etc.)
```

---

## Client Signup Flow

### Frontend
- **Entry Point**: `client-signup.html` - Client signup
- **Tab Controller**: `scripts/tabController.js` - Manages client/practitioner tab switching
- **Validation Script**: `dashboard/client/scripts/client-signup.js`

### Form Fields (All Required)
| Field | Type | Validation |
|-------|------|-----------|
| First Name | text | Non-empty |
| Last Name | text | Non-empty |
| Email | email | Must match confirmation |
| Confirm Email | email | Must match email |
| Phone | tel | Non-empty |
| Zip Code | text | Optional |
| Date of Birth | date | Must be 18+ |
| Sex | select | Optional (M/F/Prefer not to say) |
| Password | password | Min 6 characters, must match confirmation |
| Confirm Password | password | Must match password |
| Terms Acceptance | checkbox | Must be checked |

### Data Collection & Validation (client-signup.js)
1. **Collect** all form inputs
2. **Validate**:
   - All required fields are filled
   - Email addresses match
   - Age is 18+ (calculated from DOB)
   - Password meets length requirement
   - Passwords match
   - Terms accepted
3. **Disable** submit button to prevent duplicate submissions
4. **Submit** to Supabase Auth

### Backend Processing
1. **Auth User Created**: `supabaseClient.auth.signUp()`
   - Email validation redirect: `/rooted-vitality/index.html`
2. **Client Record Inserted** into `clients` table:
   ```javascript
   {
     user_id: userId,          // From Supabase Auth
     email: email,
     first_name: firstName,
     last_name: lastName,
     phone: phone,
     zipcode: zipcode,
     dob: dob,
     sex: sex,
     serial_number: null       // Set by trigger
   }
   ```
3. **Trigger Executes**: `generate_client_serial()` 
   - Auto-generates serial number (C1, C2, C3, etc.)
   - Inserted record now has `serial_number = "C1"`

### Database Constraints
- **auth.users**: Email must be unique (handled by Supabase)
- **clients**: user_id must be unique (one client per auth user)

---

### Practitioner Signup Flow

### Frontend
- **Entry Point**: `practitioner-signup.html` - Practitioner onboarding
- **Validation Script**: `dashboard/pro/scripts/practitionerHelpers.js`

### Form Fields (All Required)
| Field | Type | Purpose |
|-------|------|---------|
| legal_name | text | Individual practitioner name |
| legal_business_name | text | Official business name |
| dba_name | text | Doing Business As name |
| year_established | number | Year practice started |
| business_size | select | Employee count range |
| phone | tel | Business phone |
| physical_address | text | Practice location |
| practice_city | text | City |
| practice_state | text | State |
| zipcode | text | Zip code |

### Data Collection & Validation (dashboard/pro/scripts/practitionerHelpers.js)
1. **Collect** all form inputs
2. **Validate** (Frontend):
   - All required fields present and non-empty
   - Phone format valid
   - Year is reasonable (1900-current year)
3. **Validate** (Database via triggers - PRACTITIONER_REQUIRED_FIELDS.sql):
   - NOT NULL constraints on all 10 fields
   - Prevents incomplete records at database level
4. **Submit** to Supabase Auth + practitioners table

### Backend Processing
1. **Auth User Created**: `supabaseClient.auth.signUp()`
   - Email verification required
2. **Practitioner Record Inserted** into `practitioners` table:
   ```javascript
   {
     user_id: userId,              // From Supabase Auth
     email: email,
     legal_name: legalName,        // NEW: Individual name
     legal_business_name: businessName,
     dba_name: dbaName,
     year_established: yearEst,
     business_size: size,
     phone: phone,
     physical_address: address,
     practice_city: city,
     practice_state: state,
     zipcode: zipcode,
     status: 'draft',
     serial_number: null           // Set by trigger
   }
   ```
3. **Trigger Executes**: `generate_practitioner_serial()`
   - Auto-generates serial number (P1, P2, P3, etc.)
   - Inserted record now has `serial_number = "P1"`

### Database Constraints
- **auth.users**: Email must be unique (handled by Supabase)
- **practitioners**: user_id must be unique (one practitioner per auth user)
- **practitioners**: All 10 fields are NOT NULL (enforced via PRACTITIONER_REQUIRED_FIELDS.sql)

---

## Serial Number System (Critical Infrastructure)

### Location
- **Active Triggers**: `sql/SERIAL_NUMBER_TRIGGERS.sql`
- **Database Level**: Both triggers run BEFORE INSERT on their respective tables

### How It Works
1. **Client Serial**: Format `C#` (C1, C2, C3, etc.)
   - Function: `generate_client_serial()`
   - Finds MAX serial number in clients table
   - Increments by 1 and assigns to new record
   - Automatic on every client signup

2. **Practitioner Serial**: Format `P#` (P1, P2, P3, etc.)
   - Function: `generate_practitioner_serial()`
   - Finds MAX serial number in practitioners table
   - Increments by 1 and assigns to new record
   - Automatic on every practitioner signup

### Why Triggers?
- **Guaranteed Uniqueness**: Database enforces, not application logic
- **Auto-Increment Safe**: Works even with concurrent signups
- **Decoupled**: Frontend doesn't generate serials, reducing bugs

---

## Database Constraints

### PRACTITIONER_REQUIRED_FIELDS.sql
Location: `sql/PRACTITIONER_REQUIRED_FIELDS.sql`

Enforces NOT NULL constraints on 10 critical practitioner fields:
- legal_name
- legal_business_name
- dba_name
- year_established
- business_size
- phone
- physical_address
- practice_city
- practice_state
- zipcode

**Status**: Ready to apply after fixing existing practitioners with missing `legal_name`.

---

## File Directory Map

### Frontend
```
client-signup.html                                 # Client signup page
dashboard/client/scripts/client-signup.js          # Client signup validation & submission
dashboard/pro/scripts/practitionerHelpers.js       # Practitioner signup validation & submission
scripts/tabController.js                           # Tab switching (client ↔ practitioner)
scripts/authManager.js                             # Supabase auth management
scripts/authModal.js                               # Auth modal UI
scripts/authHooks.js                               # Auth lifecycle hooks
```

### Backend (SQL)
```
sql/SERIAL_NUMBER_TRIGGERS.sql              # ACTIVE: Auto-generate C# and P# serials
sql/PRACTITIONER_REQUIRED_FIELDS.sql        # NOT NULL constraints (pending)
```

### Documentation
```
docs/signup/signup_process.md         # This file - single source of truth
```

---

## Common Workflows

### Fixing Practitioners with Missing legal_name
**Status**: 2 practitioners affected

Option 1 (Recommended): Delete incomplete records
```sql
DELETE FROM practitioners 
WHERE legal_name IS NULL;
```

Option 2: Auto-populate from email
```sql
UPDATE practitioners 
SET legal_name = split_part(email, '@', 1)
WHERE legal_name IS NULL;
```

After fixing, apply constraints:
```sql
-- Run PRACTITIONER_REQUIRED_FIELDS.sql
```

### Verifying Serial Numbers
```sql
-- Check client serials
SELECT id, user_id, serial_number FROM clients ORDER BY created_at DESC;

-- Check practitioner serials
SELECT id, user_id, serial_number FROM practitioners ORDER BY created_at DESC;
```

### Testing Signup Flow (Development)
1. Open `client-signup.html`
2. Switch to desired tab (Client or Practitioner)
3. Fill in all required fields
4. Submit and check:
   - Auth user created in Supabase Auth
   - Record inserted in appropriate table
   - Serial number auto-generated

---

## Known Issues & Pending Tasks

| Issue | Status | Resolution |
|-------|--------|-----------|
| 2 practitioners with NULL legal_name | Pending | Delete or auto-populate before applying constraints |
| NOT NULL constraints not applied | Pending | Execute PRACTITIONER_REQUIRED_FIELDS.sql after fixing records |

---

## Last Updated
November 6, 2025

## Related Documentation
- [System Prompt](../system_prompt.md)
- [SQL Infrastructure](../../sql/)