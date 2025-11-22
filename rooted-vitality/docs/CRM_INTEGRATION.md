# CRM Integration for Rooted Vitality

## Overview

Practitioners pay a **fixed monthly membership fee** (not per-lead). Clients match with them through the platform, then they manage the relationship **outside the app** via conversation.

**This integration solves a key problem**: How do practitioners track matched clients in their existing CRM workflow?

**Solution**: 
- **CRM Integration** - Auto-sync matched clients to HubSpot/Pipedrive so practitioners manage everything in one place

---

## What Was Added

### Frontend: Match Settings Page
- JavaScript CRM manager framework ready for implementation
- Button implementation deferred to future phase

### Backend: API Handlers (Ready to Deploy)
- HubSpot contact/deal creation
- Pipedrive person/deal creation  
- Token encryption + refresh logic

### Database: Schema & Security
- 5 new CRM integration tables
- Row-level security (RLS) - practitioners only see their own data
- Encrypted API key storage
- Audit logging of all syncs

---

## SQL Setup

**Location**: `rooted-vitality/sql/04_CRM_INTEGRATION_SCHEMA.sql`

Run this entire file in your Supabase SQL editor once to create:
- `crm_integrations` - Provider configs + encrypted API keys
- `crm_sync_logs` - Audit trail of all syncs
- `crm_sync_queue` - Background job queue with retry logic
- `crm_field_mappings` - Maps Rooted fields to CRM fields
- All indexes and RLS policies

---

## CRM Tables Overview

| Table | Purpose |
|-------|---------|
| `crm_integrations` | CRM API keys (encrypted), provider config, sync frequency |
| `crm_sync_logs` | Audit log - every sync attempt with status/error |
| `crm_sync_queue` | Pending syncs waiting to be processed (with retry logic) |
| `crm_field_mappings` | Maps Rooted fields (name, email) to CRM fields per provider |

---

## CRM Sync Flow (When Client Matches)

```
Client matches with Practitioner
         ↓
System calls crmManager.syncClientTooCRM()
         ↓
Sync job queued in crm_sync_queue
         ↓
Background worker picks up job
         ↓
Creates contact in HubSpot/Pipedrive
         ↓
Creates deal/opportunity linked to contact
         ↓
Logs result in crm_sync_logs
         ↓
Practitioner sees matched client in their CRM
```

---

## HubSpot Integration Details

**Contact Created With:**
- Name, email, phone
- Lifecycle stage: "lead"
- Source: "rooted_vitality"

**Deal Created With:**
- Deal Name: "{Client Name} - Services Match"
- Stage: "negotiation"
- Amount: $0 (practitioner sets later)
- Close Date: 30 days from now
- Associated Contact: The contact created above
- Description: Services offered

---

## Pipedrive Integration Details

**Person Created With:**
- Name, email, phone

**Deal Created With:**
- Title: "{Client Name} - Services Match"
- Stage: "open"
- Person: Linked to person created above
- Pipeline: Default

---

## Security Architecture

### API Key Management
- All CRM API keys encrypted at rest (AES-256)
- Never sent to frontend
- Decrypted only during backend sync operations

### Data Privacy
- RLS enforces: Practitioners only see their own data
- No cross-practitioner access
- Deleted practitioners: all data cascade deleted
- Audit log in `crm_sync_logs` tracks all activity

### Error Handling
- Failed syncs queued with retry logic
- Max 3 retries with exponential backoff
- Error messages logged for debugging

---

## Check Syncs in Database

**In Supabase SQL Editor:**

View CRM syncs:
```sql
SELECT * FROM crm_sync_logs 
WHERE practitioner_serial = 'P1' 
ORDER BY timestamp DESC 
LIMIT 10;
```

View failed syncs:
```sql
SELECT * FROM crm_sync_logs 
WHERE error_message IS NOT NULL 
ORDER BY timestamp DESC;
```

View pending syncs:
```sql
SELECT * FROM crm_sync_queue 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

---

## Files Modified

| File | Status |
|------|--------|
| `rooted-vitality/sql/04_CRM_INTEGRATION_SCHEMA.sql` | ✅ Ready - Run this |
| `rooted-vitality/functions/crm-integration-api.js` | ✅ Ready - Backend handlers |
| `rooted-vitality/dashboard/pro/pages/match-settings.html` | ✅ Clean - Button removed |
| `rooted-vitality/docs/CRM_INTEGRATION.md` | ✅ This doc |

---

## Timeline to Production

- **Phase 1 (Now)**: SQL schema deployed
- **Phase 2**: Backend API endpoints implemented + tested
- **Phase 3**: Frontend button + UI added when needed
- **Phase 4**: HubSpot integration active
- **Phase 5**: Pipedrive integration active

---

## Next Steps

1. Run `04_CRM_INTEGRATION_SCHEMA.sql` in Supabase
2. Verify tables + RLS policies created
3. When ready to implement: Use templates in `crm-integration-api.js`
4. Add button to frontend when UI needed

---

## Questions?

Check the SQL file for:
- Table schemas
- RLS policies
- Index definitions
- All constraints

Code templates available in:
- Backend API: `crm-integration-api.js`
- Frontend framework: `match-settings.html`
