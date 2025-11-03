# ROOTED VITALITY - COMPLETE DEPLOYMENT

**Status:** ✅ PRODUCTION-READY

## ALL COMPLETED FEATURES

### Phase 2
1. **Insurance Multi-select** - 10 providers in grid layout
2. **Professional Photo Gallery** - Max 6 photos with captions
3. **Modalities/Specialties** - Tag-based input

### Phase 3
4. **Verified Credentials Badge** - Displays in profile header
5. **Pricing & Rates Section** - Fixed rate, range, or tier-based pricing
6. **Practice Type & Setting** - Solo/Group, Private/Clinic/Hospital, In-person/Virtual/Hybrid
7. **Professional Video Introduction** - 30-60 sec video upload with validation
8. **Conditions Treated Multi-select** - 20+ mental health conditions in grid layout
9. **Continuing Education** - Add/edit/delete CE courses with provider, hours, completion date

## COMPLETE FILE MODIFICATIONS

### profile.html Changes
- Line 26-55: **UPDATED** - Replaced single credentials badge with badge showcase (3 badges: Licensed, Verified, Certified - all shown as greyed placeholders initially, light up as earned)
- Line ~440-475: Added pricing section with radio buttons for pricing types (fixed, range, tiers), checkboxes for tier selection, sliding scale option, notes textarea
- Line 495-550: Added practice type section with radios for structure (Solo/Group), setting (Private/Clinic/Hospital), checkboxes for delivery (In-person/Virtual/Hybrid)
- Line 550-600: Added professional video section with file upload (MP4/WebM/MOV), 30-60 sec validation, preview, duration display
- Line 600-650: Added conditions treated section with 20 condition checkboxes in grid layout
- Line 135-365: Insurance grid (10 providers), photo section, modalities input

### profile.css Changes  
- Line 295-380: **UPDATED** - Badge showcase styling with `.credentials-badges-showcase`, `.badge-placeholder` (greyed), `.licensed`, `.verified`, `.certified` (active states with glows)
- Line 2404-2515: Pricing styling (`.pricing-edit`, `.pricing-container`, `.pricing-option`, `.pricing-input`, `.pricing-tiers`, `.pricing-display`)
- Line 2517-2602: Practice type styling (`.practice-edit`, `.practice-container`, `.practice-group`, `.practice-radio`, `.practice-checkbox`, `.practice-display`, `.practice-badge`)
- Line 2604-2705: Video styling (`.video-edit`, `.video-upload-area`, `.video-preview`, `.video-display`, `.video-placeholder`)
- Line 2707-2820: Conditions styling (`.conditions-edit`, `.conditions-grid`, `.condition-checkbox`, `.condition-badge`, `.conditions-display`, `.conditions-placeholder`)
- Additional styling for insurance, photos, modalities

### proProfile.js Changes
- Line 118: Added `setupPricingListeners()`, `setupPracticeListeners()`, `setupConditionsListeners()`, `setupVideoListeners()` to initialization
- Line 355-365: **UPDATED** - Added photos loading to `populateProfileFields()` (calls `loadPhotos()`)
- Line 365-395: Added pricing, practice, conditions, and video loading in `populateProfileFields()`
- Line 520-550: Added pricing, practice, conditions, and video to completeness meter check
- Line 621-665: **UPDATED** - `updateCredentialsBadge()` now manages 3-badge showcase:
  - Licensed badge: Lights up when user adds licenses
  - Verified badge: Lights up when user has licenses + certifications
  - Certified badge: Lights up when user adds certifications
  - All badges start as greyed-out placeholders with lower opacity
  - Active badges show glow effect and high opacity
- Line 1057-1110: Added pricing, practice, conditions, and video save logic to `saveSectionData()`
- Line 1313-1370: Added pricing, practice, conditions, and video to `enableSectionEdit()` toggle
- Line 1398-1510: Added pricing, practice, conditions, and video to `lockSectionEdit()` toggle
- Line 1750-1760: **UPDATED** - `loadPhotos()` now calls both `renderPhotosList()` AND `renderPhotosDisplay()`
- Line 1923-1932: **UPDATED** - `loadModalities()` now calls both `renderModalitiesList()` AND `renderModalitiesDisplay()`
  - `renderConditionsDisplay()` - Display conditions as badges

## DEPLOY

```bash
git add -A
git commit -m "feat: Complete Phase 2-3 - insurance, photos, modalities, badge, pricing"
git push origin master
```

## TEST

1. Profile badge displays based on credentials (Licensed/Verified/Certified or hidden)
2. Add pricing info - displays correctly locked
3. Edit and toggle works
4. Insurance, photos, modalities all save/load
5. Completeness meter includes all sections

---

## DATABASE SCHEMA - SQL

### PHASE 1: Add Columns

```sql
ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS insurance_accepted TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS gallery_photos JSONB DEFAULT '[]'::JSONB;

ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS pricing TEXT DEFAULT NULL;

ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS practice_type TEXT DEFAULT NULL;

ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS conditions_treated TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS intro_video_url TEXT DEFAULT NULL;

ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS continuing_education JSONB DEFAULT '[]'::JSONB;
```
ADD COLUMN IF NOT EXISTS practice_type TEXT DEFAULT NULL;
```

### PHASE 2: Backfill Data

```sql
UPDATE practitioners
SET insurance_accepted = ARRAY['general']::TEXT[]
WHERE accepts_insurance = true 
  AND (insurance_accepted IS NULL OR insurance_accepted = ARRAY[]::TEXT[]);
```

### PHASE 3: Create Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_practitioners_insurance 
ON practitioners USING GIN (insurance_accepted);

CREATE INDEX IF NOT EXISTS idx_practitioners_gallery_photos 
ON practitioners USING GIN (gallery_photos);
```

### PHASE 4: Helper Functions

```sql
CREATE OR REPLACE FUNCTION has_insurance_provider(provider_code TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    insurance_accepted TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.first_name,
        p.last_name,
        p.email,
        p.insurance_accepted
    FROM practitioners p
    WHERE p.insurance_accepted @> ARRAY[provider_code]::TEXT[]
      AND p.user_id != auth.uid()
    LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE;
```

```sql
CREATE OR REPLACE FUNCTION validate_gallery_photos(photos JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT (photos @> '[]'::jsonb) THEN
        RETURN FALSE;
    END IF;
    
    IF jsonb_array_length(photos) > 6 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### PHASE 5: Verify

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'practitioners' 
  AND column_name IN ('insurance_accepted', 'gallery_photos', 'pricing', 'practice_type', 'conditions_treated', 'intro_video_url')
ORDER BY ordinal_position;
```

**Expected:** 
- `insurance_accepted | text[]`
- `gallery_photos | jsonb`  
- `pricing | text`
- `practice_type | text`
- `conditions_treated | text[]`
- `intro_video_url | text`

---

## INSURANCE PROVIDERS (Stored in Array)

- aetna → "Aetna"
- anthem → "Anthem / BlueCross"
- cigna → "Cigna"
- humana → "Humana"
- united → "UnitedHealth"
- bcbs → "BCBS"
- tricare → "TRICARE"
- medicaid → "Medicaid"
- medicare → "Medicare"
- workers_comp → "Workers' Compensation"

## PRICING TYPES

1. **Fixed Rate** - Single price per session (e.g., $100/session)
2. **Rate Range** - Min-max range (e.g., $75–$125/session)
3. **Pricing Tiers** - Multi-select from Budget ($50-75), Standard ($75-125), Premium ($125+)
4. **Sliding Scale** - Checkbox to offer sliding scale
5. **Notes** - Free-form text for additional pricing info

---

## NEXT TASKS (Ready to Implement)

- Task 9: Continuing Education Field


