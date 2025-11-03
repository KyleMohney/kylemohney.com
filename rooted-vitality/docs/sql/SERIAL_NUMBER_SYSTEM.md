# Serial Number System - Implementation Guide

## Overview

A Thumbtack-style serial number system for tracking clients, practitioners, and opportunities/leads. This enables support and internal teams to quickly locate accounts using human-friendly serial numbers instead of UUIDs.

## Serial Number Formats

### Client Serial: `C00010001`
- Prefix: `C` (Client)
- Format: C + 8 digits
- Examples: C00010001, C00010002, C00010100

### Practitioner Serial: `P00020001`
- Prefix: `P` (Practitioner)
- Format: P + 8 digits
- Examples: P00020001, P00020050, P00021000

### Opportunity Serial: `O00030001`
- Prefix: `O` (Opportunity/Lead)
- Format: O + 8 digits
- Examples: O00030001, O00030500, O00031000

## Database Tables

### 1. `serial_number_registry` (Master Lookup)
```
- id (UUID, PK)
- serial_number (TEXT, UNIQUE) - The actual serial like "C00010001"
- entity_type (TEXT) - CLIENT, PRACTITIONER
- entity_id (UUID) - Reference to profiles.id or practitioners.id
- email (TEXT) - For quick reference
- name (TEXT) - For quick reference
- created_at (TIMESTAMP) - When account was created
```

### 2. `opportunities` (Lead Tracking)
```
- id (UUID, PK)
- serial_number (TEXT, UNIQUE) - The opportunity serial like "O00030001"
- client_id (UUID FK) - Optional reference to client
- practitioner_id (UUID FK) - Optional reference to practitioner
- service_type (TEXT) - What service is being requested
- description (TEXT) - Details about the opportunity
- status (TEXT) - new, open, contacted, in_progress, completed, cancelled
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 3. Updated Columns
```
profiles.serial_number (TEXT, UNIQUE)
practitioners.serial_number (TEXT, UNIQUE)
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

### 1. Client Signup (profiles table)
When a new client signs up, call:
```sql
SELECT generate_serial_number('CLIENT', user_id, email, full_name)
```

Store the returned serial in `profiles.serial_number`

### 2. Practitioner Signup (practitioners table)
When a new practitioner signs up, call:
```sql
SELECT generate_serial_number('PRACTITIONER', practitioner_id, email, legal_business_name)
```

Store the returned serial in `practitioners.serial_number`

### 3. Opportunity Creation
When a client books a service or submits a request, call:
```sql
SELECT generate_opportunity_serial(client_id, practitioner_id, service_type, description)
```

This creates a trackable lead/opportunity

### 4. Support Lookup
For support team to find an account:
```sql
SELECT * FROM lookup_by_serial('C00010042')
-- Gets client info, email, name, UUID
```

## JavaScript Integration

### Store serial number after signup
```javascript
// After user registration
const serialNumber = await generateSerialNumber(userId, email, fullName);
localStorage.setItem('user_serial', serialNumber);

// Display to user
console.log(`Your account ID is: ${serialNumber}`);
```

### Retrieve serial on profile load
```javascript
// In profile page
const serial = localStorage.getItem('user_serial');
if (serial) {
    document.getElementById('account-serial-display').textContent = serial;
}
```

### Create opportunity when booking
```javascript
// When client books a service
const opportunitySerial = await createOpportunity(
    clientId,
    practitionerId,
    serviceType,
    description
);
console.log(`Booking ID: ${opportunitySerial}`);
```

## Support Team Usage

### Quick lookup in chat/tickets:
- "Customer C00010042 is having login issues"
- "Practitioner P00020089 needs document verification"
- "Opportunity O00030156 is ready for fulfillment"

### Finding account info:
1. Customer provides serial (e.g., "C00010042")
2. Support runs: `SELECT * FROM lookup_by_serial('C00010042')`
3. Get instant access to email, name, account UUID

### Tracking leads:
1. Each new service request gets serial (e.g., "O00030001")
2. Follow up on opportunity status
3. Link to client and/or practitioner who's involved

## Migration Script

For existing users, run this to backfill serials:

```sql
-- This generates serials for all existing clients
INSERT INTO serial_number_registry (serial_number, entity_type, entity_id, email, name)
SELECT 
    'C' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 8, '0'),
    'CLIENT',
    id,
    (SELECT email FROM auth.users WHERE auth.users.id = profiles.id),
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE auth.users.id = profiles.id)
FROM profiles
WHERE id NOT IN (SELECT entity_id FROM serial_number_registry WHERE entity_type = 'CLIENT')
ON CONFLICT DO NOTHING;

-- Similar for practitioners
INSERT INTO serial_number_registry (serial_number, entity_type, entity_id, email, name)
SELECT 
    'P' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 8, '0'),
    'PRACTITIONER',
    id,
    email,
    legal_business_name
FROM practitioners
WHERE id NOT IN (SELECT entity_id FROM serial_number_registry WHERE entity_type = 'PRACTITIONER')
ON CONFLICT DO NOTHING;
```

## Benefits

✅ Human-friendly identifiers (vs long UUIDs)
✅ Instant account lookup by support team
✅ Built-in numbering system scales infinitely
✅ Separate tracking for clients, practitioners, and opportunities
✅ Easy to reference in conversations and tickets
✅ Full audit trail (created_at timestamps)
✅ Optional email/name caching for quick reference

## Example Conversation

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

