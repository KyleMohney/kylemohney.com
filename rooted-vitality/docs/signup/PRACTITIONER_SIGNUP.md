# Practitioner Signup System Documentation

**Rooted Vitality, Inc.**  
**Version:** 2.0  
**Last Updated:** October 30, 2025

---

## Overview

The Practitioner Signup System is a comprehensive, multi-step onboarding wizard that guides verified clients through becoming practitioners on the Rooted Vitality platform. The system captures all required information, handles local draft persistence, and writes all data to Supabase.

---

## File Structure

### Core Files
```
/dashboard/practitioner-signup.html  - Main HTML structure
/scripts/practitioner-signup.js      - Complete JavaScript logic
/styles/practitioner-signup.css      - Responsive styling system
```

### Dependencies
- `injections.js` - Header/footer injection
- `config.js` - Supabase client configuration
- `styles.css` - Global Rooted Vitality styles
- Supabase JS SDK (CDN loaded)

---

## Features

### 1. Multi-Step Wizard (6 Steps)

**Step 1: Account Verification**
- Pre-fills user email from authenticated session
- Phone number input with auto-formatting
- Verification badge system

**Step 2: Business Identity**
- Legal business name (private)
- DBA/Public name (public-facing)
- Display name and pronouns
- Profile photo upload (required)
- Practice logo upload (optional)
- Workspace type and coverage type selection
- Travel radius configuration
- Languages spoken (multi-select)
- Years in practice dropdown

**Step 3: Credentials & Verification**
- License upload with type and issuer
- Certifications and training documentation
- Education and institution information
- Liability insurance upload (optional)
- Background check consent
- Accuracy confirmation checkboxes

**Step 4: Services & Operations**
- Modalities offered (multi-select)
- Service description (textarea)
- Availability windows (weekday/weekend)
- Cancellation and reschedule policy
- Accessibility notes (optional)
- Client intake process (optional)
- Preferred contact method

**Step 5: Bio & Presentation**
- Tagline (100 character limit)
- Full bio (minimum 500 characters)
- Ethos statement
- Practice gallery (up to 10 images)
- Intro video upload (optional)
- Character counters with validation

**Step 6: Legal & Waiver**
- Practitioner Participation Agreement (scrollable)
- Terms acceptance checkboxes
- Legal compliance confirmation
- Submit for review button

### 2. Progress Tracking

- **Visual Progress Bar**: Animated fill from 0-100%
- **Step Indicators**: 6 circular step markers with labels
- **Percentage Display**: Real-time completion tracking
- **State Management**: Active, completed, and pending states

### 3. Auto-Save System

**localStorage Draft Persistence**
- Saves form data every 1 second (debounced)
- Restores data on page reload
- Clears draft after successful submission
- Stores: form fields, uploaded files, current step

**Supabase Integration**
- Writes to `practitioners` table after each step
- Updates with timestamps
- Batch file uploads to Supabase Storage
- Transaction-safe operations

### 4. File Upload System

**Supported Upload Types**
- Profile photo (required): JPG, PNG, WebP (max 5MB)
- Practice logo (optional): JPG, PNG, WebP (max 5MB)
- License documents: PDF, JPG, PNG (max 10MB, multiple)
- Certifications: PDF, JPG, PNG (max 10MB, multiple)
- Insurance certificate: PDF, JPG, PNG (max 10MB)
- Gallery images: JPG, PNG, WebP (max 5MB, up to 10 images)
- Intro video: MP4, WebM, MOV (max 50MB)

**Upload Features**
- Real-time file validation
- Image preview with thumbnails
- Remove/replace functionality
- Progress indicators
- Automatic upload to Supabase Storage

### 5. Form Validation

**Field-Level Validation**
- Required field checking
- Minimum character counts (bio: 500 chars)
- File size and type validation
- Email and phone format validation
- Checkbox group validation

**Error Handling**
- Inline error messages
- Red border highlighting
- Scroll to error on submit
- Friendly error text

### 6. Responsive Design

**Breakpoints**
- Desktop: 1024px+ (default)
- Tablet: 768px - 1023px
- Mobile: 480px - 767px
- Small mobile: 360px - 479px

**Mobile Optimizations**
- Stacked form layouts
- Touch-friendly buttons
- Collapsible progress indicators
- Simplified navigation

---

## Technical Architecture

### JavaScript Modules

**1. PractitionerService**
- `fetchUser()` - Get authenticated user
- `createPractitionerProfile()` - Initialize profile
- `updatePractitionerProfile()` - Update profile data
- `uploadFile()` - Upload to Supabase Storage
- `submitPractitionerForReview()` - Submit application

**2. FormState**
- Manages current step
- Stores form data
- Tracks uploaded files
- Handles user session

**3. WizardNavigation**
- `goToStep(stepNumber)` - Navigate to specific step
- `nextStep()` - Advance with validation
- `previousStep()` - Go back
- `saveCurrentStepData()` - Persist to Supabase

**4. ProgressTracker**
- `calculateProgress()` - Compute completion %
- `updateProgress()` - Update UI elements
- Real-time field counting

**5. Validation**
- `validateStep(stepNumber)` - Step-specific validation
- `showError()` - Display error messages
- `clearErrors()` - Remove error states
- `validateFile()` - File validation

**6. FileUploadHandlers**
- Single image uploads with preview
- Multiple document uploads
- Gallery management (max 10)
- Video upload
- Supabase Storage integration

**7. LocalStorage**
- `saveDraft()` - Save to localStorage
- `loadDraft()` - Restore from localStorage
- `clearDraft()` - Remove saved data
- `restoreFormFields()` - Populate form from draft

**8. FormSubmission**
- Final validation
- Submit to Supabase
- Clear draft
- Show completion screen

---

## Database Schema

### Required Supabase Tables

**practitioners table**
```sql
create table practitioners (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) unique not null,
  email text not null,
  phone text,
  legal_name text,
  public_name text,
  display_name text,
  pronouns text,
  profile_photo_url text,
  practice_logo_url text,
  workspace_type text,
  coverage_type text,
  travel_radius int,
  languages text[],
  years_in_practice text,
  license_type text,
  license_issuer text,
  certifications text,
  education text,
  modalities text[],
  service_description text,
  availability text[],
  cancellation_policy text,
  accessibility_notes text,
  intake_process text,
  preferred_contact text,
  tagline text,
  bio text,
  ethos_statement text,
  status text default 'draft',
  submitted_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Enable RLS
alter table practitioners enable row level security;

-- Allow users to update their own profile
create policy "Users can update own practitioner profile"
  on practitioners for update
  using (auth.uid() = user_id);

-- Allow users to read their own profile
create policy "Users can read own practitioner profile"
  on practitioners for select
  using (auth.uid() = user_id);
```

**Supabase Storage Buckets**
```sql
-- Create bucket for practitioner files
insert into storage.buckets (id, name, public)
values ('practitioner-files', 'practitioner-files', true);

-- Allow authenticated users to upload
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (bucket_id = 'practitioner-files' and auth.role() = 'authenticated');
```

---

## Styling System

### Color Palette (from Rooted Vitality brand)
```css
--rooted-primary: #5c9a72;  /* Botanical green */
--rooted-accent: #d4c47c;   /* Herbal gold */
--rooted-sage: #e9ede8;     /* Pale sage */
--rooted-neutral: #f7f5f1;  /* Canvas cream */
--rooted-dark: #2e2b28;     /* Earth brown */
--rooted-light: #ffffff;    /* White */
```

### Key Classes
- `.practitioner-hero` - Hero section with gradient
- `.progress-section` - Sticky progress bar container
- `.step-card` - Main form container with glass effect
- `.form-group` - Individual form field wrapper
- `.file-upload-area` - File upload dropzone
- `.info-banner` - Information callout boxes
- `.legal-document` - Legal agreement display
- `.completion-card` - Success screen

---

## Usage Instructions

### For Practitioners

1. Navigate to `/dashboard/practitioner-signup.html`
2. Complete each step of the wizard
3. Form auto-saves progress every second
4. Upload required credentials and photos
5. Review and accept legal agreement
6. Submit application for review
7. Redirected to dashboard upon completion

### For Administrators

**Review Submitted Applications**
```sql
-- Get all pending applications
select * from practitioners
where status = 'pending_review'
order by submitted_at desc;

-- Approve a practitioner
update practitioners
set status = 'approved'
where id = '<practitioner_id>';
```

**Access Uploaded Files**
- Files stored in `practitioner-files` bucket
- Path format: `{user_id}/{file_type}/{timestamp}_{filename}`
- Access via Supabase Storage dashboard

---

## Scalability Considerations

### Performance Optimizations
✅ Debounced auto-save (1 second delay)  
✅ Lazy file uploads (on selection, not submit)  
✅ Indexed database queries  
✅ Image optimization recommended  
✅ CDN-served assets

### Database Indexes
```sql
-- Add indexes for common queries
create index idx_practitioners_user_id on practitioners(user_id);
create index idx_practitioners_status on practitioners(status);
create index idx_practitioners_submitted_at on practitioners(submitted_at);
```

### Future Enhancements
- Email notifications on status change
- Background check integration
- Document OCR for license verification
- Profile preview before submission
- Admin review dashboard
- Automated credential verification
- Video compression
- Image optimization pipeline

---

## Testing Checklist

### Functional Testing
- [ ] All 6 steps navigate correctly
- [ ] Form validation prevents invalid submissions
- [ ] Auto-save restores data after refresh
- [ ] File uploads work for all types
- [ ] Progress bar updates in real-time
- [ ] Character counters display correctly
- [ ] Phone formatting works
- [ ] Error messages display properly
- [ ] Completion screen appears after submit
- [ ] Data saved to Supabase correctly

### Responsive Testing
- [ ] Desktop (1920px)
- [ ] Laptop (1366px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)
- [ ] Small mobile (360px)

### Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] ARIA labels present
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Focus indicators visible

---

## Troubleshooting

### Common Issues

**Problem:** Form doesn't save to Supabase  
**Solution:** Check Supabase credentials in `config.js`, verify user is authenticated, check browser console for errors

**Problem:** File upload fails  
**Solution:** Verify file size under limits, check Supabase Storage bucket exists and has correct policies, check file type is allowed

**Problem:** Progress not restoring on reload  
**Solution:** Check browser localStorage is enabled, verify STORAGE_KEY matches, check for console errors

**Problem:** Form validation not working  
**Solution:** Ensure required fields have `required` attribute, check JavaScript console for errors, verify validation logic in step-specific code

**Problem:** Mobile layout breaks  
**Solution:** Check media queries in CSS, test on actual device (not just browser dev tools), verify viewport meta tag is present

---

## Support & Maintenance

**File Ownership:** Development Team  
**Last Review:** October 30, 2025  
**Next Review:** December 1, 2025

For bugs or feature requests, update `/docs/BUG_TRACKER.md`

---

## License

© 2025 Rooted Vitality, Inc. All rights reserved.
