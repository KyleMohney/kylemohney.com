# Rooted Vitality - Database Schema

## Core Tables

### Categories & Subcategories
- **Category**: id (UUID), name (TEXT), description (TEXT)
- **Subcategory**: id (UUID), category_id (FK), name (TEXT), description (TEXT)

### Clients
- **id** (UUID): Primary key
- **serial_number** (TEXT): C1, C2, C3... (unique, auto-generated)
- **name** (TEXT): Client name
- **email** (TEXT): Contact email
- **phone** (TEXT): Contact phone
- **address**: street, city, state, zipcode (location data)
- **timestamps**: created_at, updated_at, deleted_at

### Practitioners
- **id** (UUID): Primary key
- **serial_number** (TEXT): P1, P2, P3... (unique, auto-generated)
- **name** (TEXT): Practitioner name
- **email** (TEXT): Contact email
- **phone** (TEXT): Contact phone
- **modalities** (TEXT[]): Treatment modalities offered
- **conditions** (TEXT[]): Conditions they treat
- **travel_type** (TEXT): "in_person", "virtual", "hybrid"
- **travel_distance** (INT): Miles willing to travel
- **address**: street, city, state, zipcode (practitioner location)
- **profile_completion_percent** (INT): 0-100 (drives match scoring)
- **matching_enabled** (BOOLEAN): Can be matched with clients
- **matching_paused** (BOOLEAN): Temporarily disable matching
- **timestamps**: created_at, updated_at, deleted_at

### Projects
- **id** (UUID): Primary key
- **project_id** (INT): Serial number (1, 2, 3... auto-increment, NOT C1/P1)
- **client_id** (FK): Reference to clients table
- **category_id** (FK): Reference to categories table
- **subcategory_id** (FK): Reference to subcategories table
- **name** (TEXT): Project name
- **description** (TEXT): Project details
- **address**: street, city, state, zipcode (treatment location)
- **budget** (DECIMAL): Project budget
- **timeline** (TEXT): Timeline for treatment
- **status** (TEXT): "active", "paused", "completed"
- **timestamps**: created_at, updated_at, deleted_at

### Project Practitioner Matches
- **id** (UUID): Primary key
- **project_id** (INT): Serial number from projects table (INTEGER, not UUID)
- **practitioner_id** (FK): Reference to practitioners table
- **client_serial** (TEXT): Serial of client (C#)
- **practitioner_serial** (TEXT): Serial of practitioner (P#)
- **match_score** (INT): 0-100 calculated from profile_completion_percent
- **match_status** (TEXT): "matched", "contacted", "accepted", "rejected"
- **timestamps**: created_at, updated_at, deleted_at

### Reviews
- **id** (UUID): Primary key
- **project_id** (INT): Serial number (same as projects table)
- **client_id** (FK): Reference to clients table
- **client_serial** (TEXT): Serial of client (C#)
- **practitioner_id** (FK): Reference to practitioners table
- **practitioner_serial** (TEXT): Serial of practitioner (P#)
- **rating** (INT): 1-5 star rating
- **review_text** (TEXT): Written review
- **timestamps**: created_at, updated_at, deleted_at

### Notifications
- **id** (UUID): Primary key
- **user_type** (TEXT): "client" or "practitioner"
- **user_id** (FK): UUID of recipient
- **event_type** (TEXT): "match", "review", "message", etc.
- **event_id** (UUID): ID of the related entity
- **title** (TEXT): Notification title
- **message** (TEXT): Notification body
- **read** (BOOLEAN): Read status
- **timestamps**: created_at, updated_at

### Project Messages
- **id** (UUID): Primary key
- **project_id** (INT): Serial number
- **sender_type** (TEXT): "client" or "practitioner"
- **sender_id** (FK): UUID of sender
- **recipient_type** (TEXT): "client" or "practitioner"
- **recipient_id** (FK): UUID of recipient
- **message** (TEXT): Message body
- **attachment_url** (TEXT): Optional file attachment
- **timestamps**: created_at, updated_at, deleted_at

## Key Design Patterns

### Serial Numbers
- **Clients**: C1, C2, C3... (stored in `clients.serial_number`)
- **Practitioners**: P1, P2, P3... (stored in `practitioners.serial_number`)
- **Projects**: 1, 2, 3... (stored in `projects.project_id` as INTEGER)
- All auto-generated via triggers, guaranteed unique

### Type Consistency
- `projects.id` = UUID (primary key)
- `projects.project_id` = INTEGER (serial for humans)
- Foreign key joins use `id` (UUID)
- Serial number joins use `project_id`, `client_serial`, `practitioner_serial` (TEXT/INT)

### Row Level Security
- All tables protected with auth-based RLS policies
- Users can only see their own records
- Admins have elevated access via user role

### Profile Completion Scoring
- Practitioners: Match score = 2 to 100 based on profile_completion_percent
- Used to order matches (highest profile = highest priority)
- Only practitioners passing all hard filters get scored
