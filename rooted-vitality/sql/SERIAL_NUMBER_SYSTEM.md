# Serial Number System - Rooted Vitality

## Overview
Auto-generates simple serial numbers for every user:
- **Clients**: C1, C2, C3...
- **Practitioners**: P1, P2, P3...

Uses PostgreSQL sequences (same pattern as `projects.project_id` - bulletproof).

## How It Works

**Triggers automatically assign on INSERT:**
```sql
CREATE SEQUENCE client_serial_seq START 1 INCREMENT 1;
CREATE SEQUENCE practitioner_serial_seq START 1 INCREMENT 1;

-- Trigger fires on every new client signup
CREATE TRIGGER set_client_serial
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION generate_client_serial();

-- Function calls sequence for unique number
CREATE FUNCTION generate_client_serial() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := 'C' || nextval('client_serial_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Deployment

If sequences/triggers are missing, run this in Supabase SQL Editor:

```sql
DROP TRIGGER IF EXISTS set_client_serial ON clients;
DROP TRIGGER IF EXISTS set_practitioner_serial ON practitioners;
DROP FUNCTION IF EXISTS generate_client_serial();
DROP FUNCTION IF EXISTS generate_practitioner_serial();

CREATE SEQUENCE IF NOT EXISTS client_serial_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS practitioner_serial_seq START 1 INCREMENT 1;

CREATE OR REPLACE FUNCTION generate_client_serial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := 'C' || nextval('client_serial_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_practitioner_serial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := 'P' || nextval('practitioner_serial_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_client_serial
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION generate_client_serial();

CREATE TRIGGER set_practitioner_serial
  BEFORE INSERT ON practitioners
  FOR EACH ROW
  EXECUTE FUNCTION generate_practitioner_serial();

-- Initialize sequences to next available number
DO $$
DECLARE
  max_client_num INT;
  max_practitioner_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(serial_number, 2) AS INTEGER)), 0)
  INTO max_client_num
  FROM clients
  WHERE serial_number ~ '^C[0-9]+$';
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(serial_number, 2) AS INTEGER)), 0)
  INTO max_practitioner_num
  FROM practitioners
  WHERE serial_number ~ '^P[0-9]+$';
  
  PERFORM setval('client_serial_seq', GREATEST(max_client_num + 1, 1));
  PERFORM setval('practitioner_serial_seq', GREATEST(max_practitioner_num + 1, 1));
END;
$$;
```

## Verification

Check it's working:
```sql
-- View current sequence values
SELECT last_value FROM client_serial_seq;
SELECT last_value FROM practitioner_serial_seq;

-- Check recent signups got serials
SELECT email, serial_number FROM clients WHERE serial_number IS NOT NULL ORDER BY created_at DESC LIMIT 5;
SELECT email, serial_number FROM practitioners WHERE serial_number IS NOT NULL ORDER BY created_at DESC LIMIT 5;
```

## Database Columns

**clients table:**
- `serial_number` TEXT UNIQUE - Auto-assigned C1, C2, C3... on insert

**practitioners table:**
- `serial_number` TEXT UNIQUE - Auto-assigned P1, P2, P3... on insert

## Database Schema

### 1. `clients` Table
```
- id (UUID, PK) - Supabase Auth user ID
- serial_number (TEXT, UNIQUE) - AUTO-ASSIGNED by trigger (C1, C2, C3...)
- email (TEXT)
- first_name (TEXT)
- last_name (TEXT)
- phone (TEXT)
- zipcode (TEXT)
- age (INTEGER)
- sex (TEXT)
- account_status (TEXT)
- account_standing (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 2. `practitioners` Table
```
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- serial_number (TEXT, UNIQUE) - AUTO-ASSIGNED by trigger (P1, P2, P3...)
- legal_name (TEXT)
- legal_business_name (TEXT)
- dba_name (TEXT)
- email (TEXT)
- status (TEXT) - draft, active, suspended, closed
- credentials_verified (BOOLEAN)
- profile_completion_percent (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 3. `opportunities` Table (Optional - for Lead Tracking)
```
- id (UUID, PK)
- serial_number (TEXT, UNIQUE) - AUTO-ASSIGNED by trigger (O1, O2, O3...)
- client_id (UUID FK) - Reference to client
- practitioner_id (UUID FK) - Reference to practitioner
- service_type (TEXT) - What service is being requested
- description (TEXT) - Details about the opportunity
- status (TEXT) - new, open, contacted, in_progress, completed, cancelled
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## How Serial Assignment Works

**Automatic Assignment via Database Triggers** - This is NOT manual, NOT application-level:

1. **Client Signs Up** → `signupHandler.js` inserts into `clients` table WITHOUT serial_number
2. **Database Trigger Fires** → `generate_client_serial()` trigger detects NULL serial_number
3. **Serial Calculated** → Finds MAX numeric portion of existing serials, increments by 1
4. **Serial Assigned** → Row gets `serial_number = 'C' + nextNumber` (e.g., C47)
5. **Profile Loads** → Client can immediately see their serial (e.g., "Client #C47")

**Same process for Practitioners:**
1. Practitioner signs up
2. `createPractitionerProfile()` inserts without serial_number
3. `generate_practitioner_serial()` trigger fires
4. Gets `serial_number = 'P' + nextNumber` (e.g., P23)

**Trigger SQL** (in migrations.sql):
```sql
CREATE OR REPLACE FUNCTION generate_client_serial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := 'C' || COALESCE(
      (SELECT MAX(CAST(SUBSTRING(serial_number, 2) AS INTEGER)) FROM clients WHERE serial_number ~ '^C[0-9]+$'),
      0
    ) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_client_serial ON clients;
CREATE TRIGGER set_client_serial
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION generate_client_serial();
```

## Functions

### `generate_serial_number(entity_type, entity_id, email, name)`
Generates a new serial number and registers it.

**Parameters:**
- `entity_type`: 'CLIENT' or 'PRACTITIONER'
- `entity_id`: UUID of the user/practitioner
- `email`: Email address (for reference)
- `name`: Display name (for reference)

**Returns:** Serial number as string (e.g., "C00010001")

**Usage:**
```sql
SELECT generate_serial_number('CLIENT', 'uuid-here', 'john@example.com', 'John Smith');
-- Returns: 'C00010001'
```

### `lookup_by_serial(serial_number)`
Look up any account or opportunity by serial number.

**Parameters:**
- `serial_number`: The serial to look up (e.g., "C00010001")

**Returns:** Record with serial_number, entity_type, entity_id, email, name, created_at

**Usage:**
```sql
SELECT * FROM lookup_by_serial('C00010001');
-- Returns full account details
```

### `generate_opportunity_serial(client_id, practitioner_id, service_type, description)`
Creates a new opportunity/lead.

**Usage:**
```sql
SELECT generate_opportunity_serial(
    client_uuid, 
    NULL, 
    'Massage Therapy', 
    'Initial consultation needed'
);
-- Returns: 'O00030001'
```

## Integration Points

### Client Signup Flow
```
1. Client fills signup form (signup.html)
2. signupHandler.js calls supabaseClient.auth.signUp()
3. Supabase creates auth user
4. signupHandler.js inserts into clients table WITHOUT serial_number:
   {
     user_id: auth_user_id,
     email: email,
     first_name: firstName,
     last_name: lastName,
     phone: phone,
     zipcode: zipcode,
     age: age,
     sex: sex,
     account_status: 'active',
     account_standing: 'good',
     created_at: now,
     updated_at: now
     // NOTE: NO serial_number field
   }
5. Database trigger generate_client_serial() fires
6. Trigger calculates next serial (e.g., C47)
7. Row inserted with serial_number automatically set
8. Client lands on dashboard, can see their serial (C47)
```

### Practitioner Signup Flow
```
1. Practitioner fills signup form (pro/ pages)
2. authManager.js calls supabaseClient.auth.signUp()
3. Supabase creates auth user
4. practitionerHelpers.js createPractitionerProfile() inserts into practitioners WITHOUT serial_number:
   {
     user_id: auth_user_id,
     email: email,
     status: 'draft',
     created_at: now,
     updated_at: now
     // NOTE: NO serial_number field
   }
5. Database trigger generate_practitioner_serial() fires
6. Trigger calculates next serial (e.g., P23)
7. Row inserted with serial_number automatically set
8. Practitioner profile loads, can see their serial (P23)
```

## Key Points

✅ **Automatic** - No manual entry required
✅ **Guaranteed Unique** - Database constraint ensures uniqueness
✅ **Simple Format** - Easy to communicate (C47, P100, O5)
✅ **System of Record** - Kyle Mohney's custom Rooted Vitality serial system
✅ **NOT 8-Digit Legacy System** - That old format is deprecated

**Support Team Lookup:**
- Client calls in: "Hi, I'm account C47"
- Support queries: `SELECT * FROM clients WHERE serial_number = 'C47'`
- Gets immediate: email, name, phone, account status

**Practitioner Lookup:**
- Practitioner calls in: "I'm practitioner P12"
- Support queries: `SELECT * FROM practitioners WHERE serial_number = 'P12'`
- Gets immediate: business name, credentials, contact info, profile status

## Implementation Details

### Backend Files
- **signupHandler.js** - Client signup, inserts without serial_number (trigger handles it)
- **practitionerHelpers.js** - `createPractitionerProfile()`, inserts without serial_number (trigger handles it)
- **migrations.sql** - Contains `generate_client_serial()` and `generate_practitioner_serial()` triggers

### No Manual Assignment Needed
❌ **Don't do this:**
```javascript
// WRONG - the trigger will handle it automatically
const serial = 'C' + nextNumber;
insert_record({ ...data, serial_number: serial });
```

✅ **Do this:**
```javascript
// CORRECT - let the trigger assign it
insert_record({ ...data }); // NO serial_number field
// Row gets serial automatically on INSERT via trigger
```

## Verification

### Check that a new user gets a serial:
```sql
-- Query clients created in last hour
SELECT id, email, serial_number, created_at FROM clients 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Should see: id | email | serial_number | created_at
--            uuid | test@example.com | C47 | 2025-11-06 14:22:33
```

### Check practitioner serials:
```sql
-- Query practitioners created in last hour
SELECT id, email, serial_number, created_at FROM practitioners
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Should see: id | email | serial_number | created_at
--            uuid | test@practitioner.com | P23 | 2025-11-06 14:18:22
```

### If a serial is NULL (shouldn't happen, but):
```sql
-- This should never happen, but if it does:
-- The trigger should catch it on next INSERT
UPDATE clients SET serial_number = NULL WHERE id = 'some-uuid';
-- Now update: would trigger the function and assign a new serial

-- Or manually run trigger function:
SELECT generate_client_serial();
```

## Benefits of Kyle's System

✅ **Simple & Memorable** - C47, P100, O5 vs uuid-123456789...
✅ **Automatic Assignment** - No manual work required
✅ **Scalable** - Works for 1 user or 1 million users
✅ **Unique Guaranteed** - Database constraint ensures no duplicates
✅ **Support-Friendly** - "Hi, I'm C47" is easy to remember and communicate
✅ **Fast Lookup** - Index on serial_number for quick queries
✅ **Zero Manual Entry** - Completely automated via database triggers
✅ **Custom System** - This is NOT a third-party or legacy system, it's Kyle's Rooted Vitality system

## Example Support Conversations

**Chat with Client:**
- Client: "Hi, I can't access my account"
- Support: "What's your account number?"
- Client: "C47"
- Support: *types* `SELECT * FROM clients WHERE serial_number = 'C47'` ← instant lookup

**Chat with Practitioner:**
- Practitioner: "I need to update my credentials"
- Support: "Which practitioner ID?"
- Practitioner: "P12"
- Support: *types* `SELECT * FROM practitioners WHERE serial_number = 'P12'` ← instant lookup

**Internal:**
- Dev: "There's an issue with C47's profile"
- Admin: *queries* `SELECT * FROM clients WHERE serial_number = 'C47'` ← gets full record
- Admin: Can now see email, phone, account status, created date

## Troubleshooting

**Problem:** New user created but no serial_number
- **Check:** Is the trigger enabled? `SELECT * FROM pg_trigger WHERE tgname = 'set_client_serial';`
- **Fix:** Manually trigger: `UPDATE clients SET serial_number = NULL WHERE serial_number IS NULL LIMIT 1;` (forces recalculation)

**Problem:** Serial_number is NULL for existing record
- **Fix:** Run: `UPDATE clients SET serial_number = generate_client_serial() WHERE serial_number IS NULL;`

**Problem:** Duplicate serial numbers (shouldn't happen with UNIQUE constraint)
- **Root Cause:** Someone manually inserted duplicate values before constraint was added
- **Fix:** Remove constraint, clean duplicates, re-add constraint

**Support Ticket:**
> Customer ID: C00010042
> Issue: Can't reset password
>
> Solution: Reset password token sent to associated email

**Internal Chat:**
> "P00020089 just submitted verification docs for review"
> "O00030156 (Massage for C00010042) scheduled for tomorrow"
> "Follow up with practitioner P00020001 about missing credentials"

## Performance

- Serial number lookup: O(1) via unique index
- Entity lookup: O(1) via (entity_type, entity_id) index
- Opportunity status queries: O(n) filtered by status, indexed for fast range queries
- All common queries have dedicated indexes

## Security Notes

- Serials are sequential but not guessable without pattern knowledge
- If privacy is concern, could randomize prefix + hash, but sequential is simpler for humans
- Support team access should be controlled via role-based permissions
- All lookup queries should be logged for audit trail

