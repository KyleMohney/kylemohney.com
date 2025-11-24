# Rooted Vitality Database - SQL Setup Guide

## Overview

This directory contains the canonical SQL files for Rooted Vitality's database. Three consolidated files contain all production logic.

## Master Files

### 1. `01_Schema.sql` (138 lines)
**Purpose**: Core database schema and table structures

**Contains**:
- CRM integration tables (crm_integrations, crm_sync_logs, crm_field_mappings, crm_sync_queue)
- Calendar integration tables (calendar_integrations, synced_calendar_events)
- RLS policies for all CRM/Calendar tables
- Indexes for performance optimization

**When to run**: Initial database setup or schema modifications

---

### 2. `02_Security.sql` (243 lines)
**Purpose**: Row Level Security (RLS) policies for all tables

**Contains**:
- RLS policies for: clients, practitioners, projects, project_practitioner_matches, reviews, notifications, project_messages
- Auth-based access control ensuring users only see their own data
- Admin role elevation for system operations

**Key Concept**: Users can only view/modify their own records. Admins have elevated access via user role.

**When to run**: After initial schema setup or when resetting security policies

---

### 3. `03_Functions_Triggers.sql` (383 lines)
**Purpose**: Matching algorithms, RPC functions, triggers, and utilities

**Contains**:

**Serial Number Generation**:
- `generate_client_serial()` - Creates C1, C2, C3... serial numbers
- `generate_practitioner_serial()` - Creates P1, P2, P3... serial numbers
- `generate_project_serial()` - Creates 1, 2, 3... serial numbers

**Timestamp Management**:
- Auto-updates `created_at` and `updated_at` on all tables
- Triggers on: clients, practitioners, projects, project_practitioner_matches, reviews

**Matching Algorithm**:
- `match_practitioners(project_id UUID)` - Two-phase matching:
  - PHASE 1: Hard filters (category, subcategory, travel type, geography)
  - PHASE 2: Scoring 2-100 based on profile_completion_percent
  - Returns practitioners ordered by match quality

**RPC Functions** (for frontend):
- `create_practitioner_match()` - Creates new match, called from client connection workflow
- `create_project_message()` - Inserts project messages

**Indexes**:
- Match status lookups
- Practitioner/client serial searches
- Project serial lookups
- Review searches

**When to run**: After schema/security setup. This is where all business logic lives.

---

## Reference & Maintenance

These files are the **canonical record** of the production database schema. The database is already set up and running in Supabase.

**Use these files for:**
- Understanding the database structure
- Making schema changes or adding new functions
- Running migrations when needed
- Reference when building features

**To make changes:**
1. Edit the relevant SQL file
2. Test changes in Supabase SQL Editor
3. Once verified, commit the updated file

---

## Key Design Patterns

### Serial Numbers
- **Clients**: C1, C2, C3... (stored in `clients.serial_number`)
- **Practitioners**: P1, P2, P3... (stored in `practitioners.serial_number`)
- **Projects**: 1, 2, 3... (stored in `projects.project_serial` as INTEGER)
- **Auto-generated**: No manual IDs needed, guaranteed unique via sequences

### ID vs Serial Consistency
- `id` = UUID (system primary keys for table relationships)
- `serial_number` / `project_serial` = Human-readable, auto-increment for UI display
- Foreign keys use `id` (UUID), serial joins use text/int serials

### Type Consistency
- `projects.id` = UUID (primary key)
- `projects.project_serial` = INTEGER (serial for humans)
- Cross-table joins:
  - Use `id` for foreign key relationships (UUID)
  - Use `project_serial`, `client_serial`, `practitioner_serial` for serial lookups (TEXT/INT)

### Row Level Security
- All tables protected with auth-based RLS
- User can only see records where their ID matches the owner field
- Admins identified by user role can bypass restrictions

### Profile Completion Scoring
- Practitioners: Match score = 2 to 100 based on `profile_completeness_percent`
- Higher score = higher priority in search results
- Only practitioners passing all hard filters get scored

---

## Troubleshooting

**"Permission denied" errors**:
- Run `02_Security.sql` to ensure RLS policies are in place
- Check that user_id in auth is correctly set

**"Function does not exist" errors**:
- Run `03_Functions_Triggers.sql` to create RPC functions
- Verify function syntax in SQL editor output

**Serial numbers not auto-incrementing**:
- Check that triggers are created (run `03_Functions_Triggers.sql`)
- Verify sequences exist: `client_serial_seq`, `practitioner_serial_seq`, `project_serial_seq`

---

## Table Reference

See `TABLES.md` for complete schema documentation including all columns, data types, and relationships.
