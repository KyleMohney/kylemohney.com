# Serial Number System - Rooted Vitality

## Overview

Serial numbers are unique identifiers assigned to each client and practitioner account for support, analytics, and record-keeping purposes.

### Format
- **Clients**: C1, C2, C3, ... C100000000000
- **Practitioners**: P1, P2, P3, ... P100000000000

### Storage
- Stored in `clients.serial_number` column
- Stored in `practitioners.serial_number` column
- No separate registry table needed

---

## How It Works

### 1. Generation
Serial numbers are auto-generated during signup:

**Client Signup Flow** (`signupHandler.js`):
1. Client completes signup form
2. `serialNumberManager.generateSerialNumber('client')` called
3. Manager counts existing client records
4. Generates next number (e.g., "C" + count + 1)
5. Serial stored in `clients.serial_number` field

**Practitioner Signup Flow** (`practitioner-signup.js`):
1. Practitioner completes 2-step wizard
2. `serialNumberManager.generateSerialNumber('practitioner')` called
3. Manager counts existing practitioner records
4. Generates next number (e.g., "P" + count + 1)
5. Serial stored in `practitioners.serial_number` field

### 2. Database
PostgreSQL counts existing records to determine the next sequence number:
```sql
SELECT COUNT(*) FROM clients WHERE serial_number IS NOT NULL;
-- If 42 records exist, next serial will be "C43"
```

This avoids gaps and ensures sequential numbering without requiring a separate sequences table.

### 3. Retrieval
Use the manager to fetch a user's serial:
```javascript
const serial = await window.serialNumberManager.getSerialNumber(userId, 'client');
// Returns: "C42"
```

### 4. Display Formatting (Optional)
Format serials with padding for display:
```javascript
const formatted = window.serialNumberManager.formatSerialForDisplay('C42', 7);
// Returns: "C-0000042"
```

---

## API Reference

### `serialNumberManager.generateSerialNumber(type)`
**Parameters:**
- `type` (string): 'client' or 'practitioner'

**Returns:** Promise<string> - Serial number like 'C1', 'P42'

**Example:**
```javascript
const serial = await window.serialNumberManager.generateSerialNumber('client');
console.log(serial); // "C1"
```

### `serialNumberManager.getSerialNumber(userId, type)`
**Parameters:**
- `userId` (string): UUID of the user
- `type` (string): 'client' or 'practitioner'

**Returns:** Promise<string|null> - Serial number or null if not found

**Example:**
```javascript
const serial = await window.serialNumberManager.getSerialNumber(userUUID, 'practitioner');
console.log(serial); // "P5"
```

### `serialNumberManager.formatSerialForDisplay(serialNumber, padLength)`
**Parameters:**
- `serialNumber` (string): Raw serial like 'C1'
- `padLength` (number): Optional, default 7 - padding for number part

**Returns:** string - Formatted serial

**Example:**
```javascript
const formatted = window.serialNumberManager.formatSerialForDisplay('C1');
console.log(formatted); // "C-0000001"
```

---

## Integration Points

### Files Modified:
1. **`scripts/serialNumberManager.js`** (NEW)
   - Core serial number generation and retrieval logic

2. **`scripts/signupHandler.js`**
   - Added serial generation during client signup
   - Serial assigned to `clientData.serial_number`

3. **`scripts/practitioner-signup.js`**
   - Added serial generation during practitioner signup
   - Serial assigned to `payload.serial_number`

4. **`signup.html`**
   - Added `<script src="./scripts/serialNumberManager.js"></script>`

5. **`dashboard/practitioner-signup.html`**
   - Added `<script src="../scripts/serialNumberManager.js"></script>`

---

## Usage Examples

### Display Serial in Dashboard
```javascript
// In profile or dashboard page
const user = window.authManager.getCurrentUser();
const serial = await window.serialNumberManager.getSerialNumber(user.id, user.role);

// Display in UI
document.getElementById('userSerial').textContent = 
  window.serialNumberManager.formatSerialForDisplay(serial);
// Shows: "C-0000001" or "P-0000001"
```

### Query Serials in Analytics
```sql
-- Get all client serials
SELECT user_id, serial_number, created_at FROM clients ORDER BY serial_number;

-- Get practitioner count
SELECT COUNT(*) FROM practitioners WHERE serial_number IS NOT NULL;

-- Find user by serial
SELECT * FROM clients WHERE serial_number = 'C42';
```

---

## Why No Registry Table?

A separate `serial_number_registry` table would introduce:
- **Redundancy**: Serial already stored in `clients` and `practitioners`
- **Sync Issues**: Registry and user tables could become out of sync
- **Performance**: Extra join required for every lookup
- **Complexity**: More tables to maintain

**Better approach**: Each user record owns their serial, PostgreSQL handles counting.

---

## Future Enhancements

1. **Display Serial on Dashboard**
   - Show serial in user profile header
   - Display formatted serial (C-0000001) in UI

2. **Analytics Dashboard**
   - Track serial number generation over time
   - Analyze signup patterns

3. **Support Ticket Integration**
   - Associate support tickets with serial numbers
   - Easier customer identification

4. **Export & Reporting**
   - Export user lists with serials
   - Generate support reports by serial range

---

## Notes

- Serial numbers begin at 1 (not 0)
- If a user record is deleted, gaps may appear in sequence (this is fine)
- Serial numbers are immutable after creation (good for referential consistency)
- Both client and practitioner can have serials (users with both roles get separate serials for each)
