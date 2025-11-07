# Practitioner Matching System - Single Source of Truth

## Overview
Rooted Vitality's practitioner matching system enables holistic health professionals to discover, manage, and activate service categories, control matching status, and interact with clients—all backed by a robust, credential-aware database and modern UI/UX.

---

## 1. Database Architecture & Taxonomy
- **Main SQL File**: `/sql/4_MATCH_SETTINGS_SCHEMA.sql` (650+ lines)
- **Tables**:
  - `holistic_health_taxonomy`: 22 master categories
  - `taxonomy_subcategories`: 330+ services
  - `practitioner_match_settings`: Matching status, pause/resume
  - `practitioner_selected_services`: Services offered per practitioner
  - `practitioner_match_pause_history`: Audit trail for pause/resume
  - `practitioners`: +2 columns for payment methods & insurance
- **Reference Data**: All practitioners access the same taxonomy; categories are credential-labeled (license, certification, none).

---

## 2. Service Category Selection & Credential Logic
- **Dual-Method Discovery**:
  1. **Search & Auto-Fill**: Type category name, get instant autocomplete
  2. **Browse Modal**: Visual grid of all categories, organized by credential requirements
- **Credential Gating**:
  - Categories split into: License Required, Certification Available, No Requirements
  - Credential gate modal blocks adding license-required categories unless credentials are uploaded
  - Credential status shown on category cards (red/pink = license, green = none, yellow = certification)
- **UI/UX**:
  - Modern cards with icons, badges, service counts
  - Responsive grid, hover effects, "Already Added" state
  - Tooltips and pro tips for best practices

---

## 3. Matching Activation, Pause/Resume, & Status
- **Activation Toggle**:
  - Large, color-coded switch (green = active, gray = inactive)
  - Only enables if ≥1 active categories
  - Persists in localStorage
- **Pause Until Feature**:
  - "Pause Until..." button opens modal with date/time pickers
  - Live preview of resume time
  - Auto-resume when time expires
  - Manual resume available
  - Full audit trail in `practitioner_match_pause_history`
- **Status Display**:
  - "Active", "Inactive", or "Paused" with color-coded badges
  - Helper text and legal/risk messaging
  - Real-time feedback and notifications

---

## 4. Payment Methods & Insurance
- **Profile Section**: Practitioners specify accepted payment methods and insurance
- **Database Fields**:
  - `payment_methods` (TEXT)
  - `accepts_insurance` (BOOLEAN)
- **UI**:
  - Textarea for payment methods
  - Checkbox for insurance acceptance
  - Pro tip box for best practices

---

## 5. UI/UX & Tooltips
- **Section Descriptions**: Clear explanations for each section
- **Pro Tips**: Green card with actionable advice (e.g., "Multiple Categories = More Inquiries")
- **Status Badges**: Visual indicators for active/inactive categories
- **Preferences Modal**: Select subcategories/services with safe ID generation
- **Accessibility**: Responsive, tooltips, color-coded, descriptive labels

---

## 6. Integration & Technical Guide
- **Integration Guide**: See `INTEGRATION_GUIDE.md` for full code examples
- **Key Functions**:
  - `initializeMatchSettingsManager(practitionerId)`
  - `addCategoryFromBrowse(categoryId, categoryName)`
  - `toggleCategoryActive(categoryId)`
  - `removeCategory(categoryId)`
  - `savePreferencesModal()`
  - `updateDayAvailability(day, isAvailable, openTime, closeTime)`
  - `updateTimezone(timezone)`
  - `loadSettingsIntoUI()`
- **Data Persistence**: All state saved in localStorage and database; survives refresh and navigation

---

## 7. Testing & Verification
- **Checklist**:
  - Add categories via search and browse
  - Credential gating blocks unlicensed categories
  - Activate/deactivate categories, see status badges
  - Activate matching, pause/resume, verify status
  - Payment methods and insurance saved/loaded
  - Preferences modal works for all subcategories
  - All UI elements responsive and accessible
  - No console errors
- **Verification Queries**:
  - `SELECT COUNT(*) FROM holistic_health_taxonomy;` (should be 22)
  - `SELECT COUNT(*) FROM taxonomy_subcategories;` (should be 330+)

---

## 8. File Map
```
/sql/4_MATCH_SETTINGS_SCHEMA.sql                # Main schema
/sql/SQL_IMPLEMENTATION_CHECKLIST.md            # Step-by-step setup
/docs/matching/practitioner/MATCH_SETTINGS_DATABASE_SCHEMA.md   # Full schema reference
/docs/matching/practitioner/TAXONOMY_DATA_REFERENCE.md          # All categories/services
/docs/matching/practitioner/IMPLEMENTATION_SUMMARY.md           # Project summary
/docs/matching/practitioner/INTEGRATION_GUIDE.md                # Integration code
/dashboard/pro/match-settings.html              # Main UI
/data/practitioner-categories.json              # Category data
```

---

## 9. Summary
Rooted Vitality's practitioner matching system is:
- **Credential-aware**: License, certification, and open categories
- **Modern UX**: Dual-method discovery, responsive cards, tooltips
- **Secure**: RLS policies, audit trails, credential gating
- **Flexible**: Pause/resume, payment methods, preferences
- **Production-ready**: Fully documented, tested, and integrated

This document is your single source of truth for all practitioner matching and interaction features.