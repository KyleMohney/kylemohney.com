# Rooted Vitality Profile System - Single Source of Truth

## Overview
Unified profile system for both practitioners and clients, supporting avatars, business info, credentials, insurance, payment, badges, and modern healthcare marketplace features. All logic, schema, and UI flows are documented here.

---

## 1. Database Schema
### Practitioners Table
- `legal_business_name` (TEXT)
- `dba_name` (TEXT)
- `year_established` (INTEGER)
- `years_in_practice` (TEXT)
- `business_size` (TEXT)
- `bio` (TEXT)
- `ethos_statement` (TEXT)
- `phone` (TEXT)
- `email` (TEXT)
- `practice_logo_url` (TEXT) — avatar/logo image
- `gallery_photos` (JSONB) — up to 6 photos
- `modalities` (TEXT[]) — specialties/tags
- `conditions_treated` (TEXT[]) — multi-select
- `insurance_accepted` (TEXT[]) — multi-select
- `accepts_insurance` (BOOLEAN)
- `pricing` (TEXT)
- `practice_type` (TEXT)
- `intro_video_url` (TEXT)
- `continuing_education` (JSONB)
- `credentials` (JSONB) — uploaded licenses/certifications
- `profile_completion_percent` (INTEGER)
- `status` (TEXT)

### Clients Table (profiles)
- `avatar_url` (TEXT)
- `first_name`, `last_name`, `email` (from auth)
- Preferences, insurance, etc. (future expansion)

---

## 2. Avatar & Logo Logic
- **Practitioner**: Shows `practice_logo_url` if present, else first initial of business name
- **Client**: Shows `avatar_url` if present, else first initial of name
- **Upload**: Avatar upload updates display immediately (uses `<img>` tag)
- **Universal Header**: Avatar/logo shown in all headers via `injections.js` logic

---

## 3. Edit/Save Flow & UI States
- **Header Fields**: Inline editing, auto-save with debounce
- **Content Sections**: Read-only by default, click to edit, manual save
- **Completeness Meter**: Tracks profile completion based on required fields
- **Photo Gallery**: Upload, preview, and display up to 6 photos
- **Modalities/Specialties**: Tag-based input, displayed as badges
- **Insurance**: Multi-select grid of 10 providers
- **Pricing**: Fixed, range, tier, sliding scale, notes
- **Practice Type**: Solo/Group, Private/Clinic/Hospital, In-person/Virtual/Hybrid
- **Video Introduction**: 30-60 sec upload, preview, validation
- **Conditions Treated**: Multi-select grid of 20+ conditions
- **Continuing Education**: Add/edit/delete CE courses

---

## 4. Credential Verification & Badges
- **Credentials Section**: Upload licenses/certifications, stored in `credentials` JSONB
- **Verification Logic**: Only verified practitioners can add license-required categories
- **Badges**: Licensed, Verified, Certified — shown in profile header, light up as earned
- **Credential Gate Modal**: Blocks adding licensed categories without valid credentials
- **Admin Review**: Credentials must be manually verified before badge is active

---

## 5. Payment & Insurance
- **Payment Methods**: Textarea for accepted payment types
- **Insurance**: Checkbox for insurance acceptance, multi-select for providers
- **Database Fields**: `payment_methods` (TEXT), `accepts_insurance` (BOOLEAN), `insurance_accepted` (TEXT[])
- **Pro Tip**: Specific payment details improve conversion

---

## 6. Universal Header System
- **injections.js**: Renders avatar/logo in header for all roles
- **Practitioner**: Uses `practice_logo_url` or initial
- **Client**: Uses `avatar_url` or initial
- **Logo/Avatar Cache**: Cleared on upload for instant update

---

## 7. Credential Gating & Security
- **Credential Verification**: Practitioners must upload valid credentials for license-required categories
- **State Validation**: Checks practitioner location/state against category requirements
- **Credential Gate Modal**: Shown if credentials missing
- **Security**: Only practitioner and admin can view credentials; GDPR compliant

---

## 8. UI/UX Best Practices
- **Badges**: Visual indicators for credentials
- **Tooltips**: Section descriptions + actionable pro tips
- **Accessibility**: Responsive, color-coded, descriptive labels
- **Edit/Save**: Clear distinction between read-only and edit states
- **Photo/Video Guidance**: Upload instructions, validation

---

## 9. Testing & Verification
- Avatar/logo upload updates display
- Legal business name shows full value with hover tooltip
- All profile fields save/load correctly
- Credential gate blocks unqualified category additions
- Badges light up as credentials are verified
- Completeness meter reflects all sections
- No console errors

---

## 10. File Map
```
dashboard/pro/profile.html           # Practitioner profile UI
scripts/proProfile.js                # Practitioner profile logic
scripts/practitionerHeaderAvatar.js  # Avatar header logic
scripts/dashboard-client.js          # Client profile logic
sql/PROFILE_DATABASE_MIGRATION.sql   # One-time migration (archive if not needed)
docs/profile/PROFILE_SYSTEM_MASTER.md # This file
```

---

## 11. Summary
Rooted Vitality's profile system is:
- **Unified**: One system for clients and practitioners
- **Modern**: All healthcare marketplace features
- **Credential-aware**: Badges, gating, verification
- **Flexible**: Edit/save flows, completeness meter, photo/video, insurance, payment
- **Secure**: Privacy, admin review, GDPR compliance

This document is your single source of truth for all profile system features, logic, and schema.