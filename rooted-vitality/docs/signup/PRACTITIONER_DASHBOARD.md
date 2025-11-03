# Practitioner Dashboard Documentation

## Overview

The **Practitioner Dashboard** is a post-signup control center where practitioners manage their Rooted Vitality profiles, track onboarding progress, and navigate back to the signup wizard to complete or edit sections.

**Location:** `/dashboard/practitioner-dashboard.html`

**Version:** v2.1 | **Status:** Production-Ready

---

## User Experience Flow

```
Signup Completion Screen
        ↓
Redirect to Dashboard
        ↓
Auth Check (if not logged in → redirect to signup)
        ↓
Load Practitioner Profile + Related Data from Supabase
        ↓
Calculate Completion Percentage
        ↓
Render: Hero + Status Cards + Activity Log
        ↓
Practitioner interacts with dashboard:
    • View progress percentage
    • See completion status of all sections
    • Click "Edit" button to go back to wizard
    • Preview public profile (if 50%+ complete)
    • Sign out
```

---

## System Architecture

### Files Involved

| File | Type | Purpose |
|------|------|---------|
| `practitioner-dashboard.html` | HTML | Page structure, hero, status grid, activity log |
| `practitioner-dashboard.css` | CSS | All styling, animations, responsive design |
| `practitioner-dashboard.js` | JavaScript | Logic, Supabase queries, dynamic rendering |
| `supabaseClient.js` | JavaScript | Supabase client initialization |
| `practitionerHelpers.js` | JavaScript | Helper functions for CRUD operations |

### Data Flow

```
┌─────────────────────────────────────────────────────┐
│ Supabase Database                                   │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│ │practitioners│  │credentials  │  │background_  │ │
│ │             │  │             │  │checks       │ │
│ └─────────────┘  └─────────────┘  └─────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │memberships                                      │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         ↑
                   Queries via SDK
                         ↑
┌─────────────────────────────────────────────────────┐
│ practitioner-dashboard.js                           │
│ • fetchPractitionerProfile(userId)                  │
│ • fetchCredentials(userId)                          │
│ • fetchBackgroundCheckStatus(userId)                │
│ • fetchMembershipStatus(userId)                     │
│ • calculateCompletion()                             │
│ • renderDashboard()                                 │
└─────────────────────────────────────────────────────┘
                         ↓
                    DOM Elements
                         ↓
┌─────────────────────────────────────────────────────┐
│ Browser Display                                     │
│ • Hero Section (greeting + progress bar)            │
│ • Status Cards (6 sections)                         │
│ • Activity Log (milestones + verification)          │
└─────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Hero Section

**Purpose:** Welcome practitioner and show overall progress

**Elements:**
- Personalized greeting: "Welcome Back, [Legal Name]"
- Contextual subtitle based on completion (0-50%, 51-75%, 76-99%, 100%)
- Animated progress bar (white fill on green background)
- Completion percentage (0-100%)
- "Preview Public Profile" button (only shows if ≥50% complete)

**CSS Classes:** `.practitioner-hero`, `.progress-bar-wrapper`, `.progress-bar-fill`

**Dynamic Content:**
```javascript
// Example greeting
"Welcome Back, Dr. Sarah Chen"

// Example subtitle
"You're 25% away from a complete profile"

// Progress percentage updates
completionPercentage = 75%
```

---

### 2. Status Grid (6 Section Cards)

The dashboard displays 6 progress cards representing key onboarding sections:

#### Card 1: Business Information
- **Icon:** 🏢
- **Data Source:** `practitioners` table (legal_name, dba_name, workspace_type)
- **Completion Criteria:** All of {legal_name, dba_name, workspace_type} must be set
- **Status Indicators:** Complete (green) | Incomplete (grey)
- **Action:** Links to Step 2 of signup wizard
- **Fields Displayed:**
  - Workspace Type (Solo practice, Clinic, Retreat center, etc.)
  - DBA Name (Business operating name)

#### Card 2: Credentials & Licenses
- **Icon:** 📜
- **Data Source:** `credentials` table (linked to practitioner_id)
- **Completion Criteria:** At least 1 credential record exists
- **Status Indicators:** Complete (green) | Incomplete (grey)
- **Action:** Links to Step 3 of signup wizard
- **Fields Displayed:**
  - Count of credentials added
  - Latest credential license type (if available)

#### Card 3: Services & Modalities
- **Icon:** 💆
- **Data Source:** `practitioners` table (modalities array, availability)
- **Completion Criteria:** modalities array has ≥1 entry
- **Status Indicators:** Complete (green) | Incomplete (grey)
- **Action:** Links to Step 4 of signup wizard
- **Fields Displayed:**
  - Number of modalities offered
  - Availability (if set)

#### Card 4: Bio & Presentation
- **Icon:** ✍️
- **Data Source:** `practitioners` table (bio, tagline)
- **Completion Criteria:** bio.length ≥ 20 characters
- **Status Indicators:** Complete (green) | Incomplete (grey)
- **Action:** Links to Step 5 of signup wizard
- **Fields Displayed:**
  - Character count (0-500)
  - Preview of tagline

#### Card 5: Background Check
- **Icon:** 🔍
- **Data Source:** `background_checks` table
- **Completion Criteria:** status = 'approved'
- **Status Indicators:** 
  - Complete (green) if approved
  - Pending (amber) if pending/rejected
  - Incomplete (grey) if not started
- **Action:** Navigate to background check provider (future integration)
- **Fields Displayed:**
  - Current status (Approved ✓ | Pending Review | Not Started)
  - Completion date (if available)

#### Card 6: Membership Tier
- **Icon:** ⭐
- **Data Source:** `memberships` table
- **Completion Criteria:** Membership exists and status = 'active'
- **Status Indicators:**
  - Complete (green) if active
  - Pending (amber) if inactive
- **Action:** Upgrade/manage membership
- **Fields Displayed:**
  - Current tier (Free, Basic, Premium, etc.)
  - Start date of membership

### Card Styling

Each card has:
- **Color-coded left border:**
  - Green (#1db584) for complete sections
  - Amber (#f59e0b) for pending items
  - Grey (#d1d5db) for incomplete sections
- **Status badge** with color matching border
- **Last updated date** footer
- **Action button** to edit that section

---

### 3. Activity Log / Status Feed

**Purpose:** Show historical milestones and status changes

**Example Activity Items:**
```
📋 Profile Created
   Welcome to Rooted Vitality, Dr. Sarah Chen!
   Started Oct 30, 2025

🏢 Business Information Added
   Set up as a solo practice
   Updated Oct 30, 2025

📜 2 Credentials Added
   Your credentials have been recorded
   Added Oct 30, 2025

✓ Background Check Approved
   You are verified
   Oct 31, 2025

⭐ Premium Membership Active
   Membership tier: Premium
   Oct 31, 2025
```

**Activity Item Types:**
- **info** (blue): Profile updates, credentials added, services listed, bio added
- **warning** (orange): Background check pending, membership inactive
- **success** (green): Background check approved, profile complete

**Generation Logic:**
1. Start with "Profile Created" event
2. Add event for each completed section (business info, credentials, services, bio)
3. Add background check status event
4. Add membership status event
5. Reverse chronological order (most recent first)

---

## JavaScript Logic

### Module: `PractitionerDashboard`

**IIFE Structure:** All logic wrapped in `PractitionerDashboard` object for namespace safety

### Key Functions

#### `initialize()`
**Purpose:** Entry point - runs on DOMContentLoaded

**Steps:**
1. Check Supabase authentication
   - If not logged in → redirect to signup with message
2. Fetch practitioner profile
   - If no profile exists → redirect to signup
3. Parallel fetch: credentials, background check, membership
4. Calculate completion percentage
5. Render all sections
6. Set isLoading = false

**Error Handling:** Try/catch with user-friendly error display

---

#### `fetchPractitionerProfile(userId)`
**Returns:** Practitioner object or null

**Calls:** `window.getPractitionerProfile(userId)` from practitionerHelpers.js

**Data Retrieved:**
```javascript
{
  id: "user-id",
  legal_name: "Dr. Sarah Chen",
  dba_name: "Wellness Center",
  workspace_type: "solo_practice",
  email: "sarah@example.com",
  bio: "Holistic wellness practitioner...",
  tagline: "Healing through natural modalities",
  modalities: ["massage", "acupuncture", "herbal"],
  availability: "Mon-Fri 9am-6pm",
  cancellation_policy: "24 hours notice",
  created_at: "2025-10-30T...",
  updated_at: "2025-10-30T..."
}
```

---

#### `fetchCredentials(userId)`
**Returns:** Array of credential objects

**Calls:** `window.getCredentials(userId)` from practitionerHelpers.js

**Data Retrieved (per credential):**
```javascript
{
  id: "credential-id",
  license_type: "Licensed Massage Therapist",
  license_number: "LMT-12345",
  issuing_body: "State Board of Massage Therapy",
  expiration_date: "2026-12-31",
  status: "active",
  created_at: "2025-10-30T..."
}
```

---

#### `fetchBackgroundCheckStatus(userId)`
**Returns:** Background check object or null

**Supabase Query:**
```javascript
const { data } = await supabaseClient
  .from('background_checks')
  .select('*')
  .eq('practitioner_id', userId)
  .single();
```

**Data Retrieved:**
```javascript
{
  id: "check-id",
  practitioner_id: "user-id",
  status: "approved|pending|rejected",
  provider: "third_party_service",
  completed_at: "2025-10-31T...",
  created_at: "2025-10-30T...",
  updated_at: "2025-10-31T..."
}
```

---

#### `fetchMembershipStatus(userId)`
**Returns:** Membership object or null

**Supabase Query:**
```javascript
const { data } = await supabaseClient
  .from('memberships')
  .select('*')
  .eq('practitioner_id', userId)
  .single();
```

**Data Retrieved:**
```javascript
{
  id: "membership-id",
  practitioner_id: "user-id",
  tier: "premium|basic|free",
  status: "active|inactive",
  started_at: "2025-10-31T...",
  created_at: "2025-10-31T...",
  updated_at: "2025-10-31T..."
}
```

---

#### `calculateCompletion()`
**Purpose:** Determine completion percentage and section status

**Calculation:**
```javascript
const checks = {
  businessInfo: !!(legal_name && dba_name),
  credentials: credentials.length > 0,
  services: modalities && modalities.length > 0,
  bio: bio && bio.length > 20,
  backgroundCheck: backgroundCheck?.status === 'approved',
  membership: !!membership
};

completed = Object.values(checks).filter(v => v).length;
total = 6;
percentage = Math.round((completed / total) * 100);
```

**Result:** Stored in `state.practitioner.completion_percentage`

---

#### `renderDashboard()`
**Purpose:** Main render orchestrator

**Calls:**
1. `renderHeroSection()`
2. `renderStatusGrid()`
3. `renderActivityLog()`
4. `setupEventListeners()`

---

#### `renderHeroSection()`
**Purpose:** Update hero with personalized content

**DOM Updates:**
- `#practitionerGreeting` → User's legal name
- `#completionSubtitle` → Context-based message
- `#completionPercentage` → Percentage value
- `#progressBarFill` → CSS width based on percentage

**Subtitle Logic:**
```javascript
if (percentage === 100) → "✓ Profile Complete - Ready to Connect with Clients"
else if (percentage >= 75) → "You're X% away from a complete profile"
else → "Complete X% more to go live"
```

---

#### `createStatusCards()`
**Purpose:** Generate individual card HTML

**6 Functions (one per card):**
1. `createBusinessInfoCard()`
2. `createCredentialsCard()`
3. `createServicesCard()`
4. `createBioCard()`
5. `createBackgroundCheckCard()`
6. `createMembershipCard()`

**Card Properties:**
- Dynamically set class to `.status-card.complete|pending|incomplete`
- Icon emoji representing the section
- Title and status badge
- Details rows (relevant fields)
- Last updated timestamp
- Edit button with `data-step` attribute

**Status Badge Colors:**
- Complete → Green (#d1fae5 bg, #047857 text)
- Pending → Amber (#fed7aa bg, #92400e text)
- Incomplete → Grey (#f3f4f6 bg, #6b7280 text)

---

#### `generateActivityFeed()`
**Purpose:** Create activity items based on profile state

**Return:** Array of activity objects:
```javascript
{
  type: 'info|warning|success',
  icon: 'emoji',
  title: 'Activity Title',
  description: 'Detailed description',
  timestamp: 'Formatted date string'
}
```

**Activity Generation Order:**
1. Profile created (always first)
2. Business info (if complete)
3. Credentials (if ≥1 added)
4. Services (if ≥1 modality)
5. Bio (if ≥20 chars)
6. Background check (current status)
7. Membership (current status)

**Reversed** to show newest first

---

#### `setupEventListeners()`
**Purpose:** Attach interactive handlers

**Event Listeners:**
1. **Edit Section Buttons** (`.btn-edit-section`)
   - On click → Store step in localStorage
   - Navigate to signup wizard

2. **Preview Profile Button** (`#previewProfileBtn`)
   - On click → Navigate to public profile view (future feature)

---

### Event Handlers

#### `handleEditSection(e)`
```javascript
const step = e.target.dataset.step; // "2", "3", "4", etc.
localStorage.setItem('practitioner_edit_step', step);
window.location.href = '/dashboard/practitioner-signup.html';
```

**Steps:**
- 1 = Account Verification
- 2 = Business Identity
- 3 = Credentials & Licenses
- 4 = Services & Modalities
- 5 = Bio & Presentation
- 6 = Legal Waiver

**Wizard Implementation Note:** The signup wizard should check localStorage on load:
```javascript
const editStep = localStorage.getItem('practitioner_edit_step');
if (editStep) {
  jumpToStep(parseInt(editStep));
  localStorage.removeItem('practitioner_edit_step');
}
```

---

#### `handlePreviewProfile(e)`
```javascript
// Currently: placeholder alert
// Future: Navigate to /profile/{practitioner_id}
```

---

### Utility Functions

#### `formatDate(dateString)`
**Purpose:** Human-readable date formatting

**Logic:**
- Today → "Today at HH:MM"
- Yesterday → "Yesterday"
- Other dates → "Mon DD" (or "Mon DD, YYYY" for other years)

**Example Outputs:**
```javascript
formatDate('2025-11-05T14:30:00Z') → "Today at 2:30 PM"
formatDate('2025-11-04T09:15:00Z') → "Yesterday"
formatDate('2025-11-02T10:00:00Z') → "Nov 2"
formatDate('2024-11-05T08:00:00Z') → "Nov 5, 2024"
```

---

#### `redirectToSignup(message)`
```javascript
alert(message);
window.location.href = '/dashboard/practitioner-signup.html';
```

**Used when:**
- User not authenticated
- Practitioner profile doesn't exist

---

## CSS Architecture

### Structure

**File:** `practitioner-dashboard.css` (1200+ lines)

### Sections

1. **Hero Section** (60 lines)
   - Gradient background (green to cream)
   - Animated headline entrance
   - Progress bar styling

2. **Progress Bar** (50 lines)
   - Wrapper with transparent background
   - Animated fill with cubic-bezier easing
   - Percentage text display

3. **Dashboard Sections** (40 lines)
   - Generic section padding and spacing
   - Section title styling (Lora serif font)

4. **Status Grid** (250 lines)
   - CSS Grid layout (auto-fit, minmax 300px)
   - Card container with shadow
   - Border-left color coding
   - Hover effects (shadow + translateY)
   - Status badge styling (6 badge types)
   - Status-specific button colors

5. **Activity Log** (150 lines)
   - Flexbox column layout
   - Activity item styling with left border
   - Activity icon and content styling
   - Empty state styling

6. **Animations** (80 lines)
   - `slideDown` - Hero content entrance
   - `fadeInUp` - Card staggered entrance
   - `slideInLeft` - Activity items entrance
   - `spin` - Loading spinner

7. **Error States** (40 lines)
   - Error container styling (red background)
   - Error title and message text
   - Loading spinner animation

8. **Mobile Responsive** (200 lines)
   - **768px breakpoint:** Stack sections, adjust fonts
   - **480px breakpoint:** Reduced padding, font sizes, grid to 1 column

9. **Accessibility & Print** (30 lines)
   - `@media print` rules (hide buttons, remove shadows)
   - `prefers-reduced-motion` (disable animations)

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Green | #1db584 | Hero gradient, complete status, borders |
| Light Green | #a8d5ba | Hero gradient secondary |
| Cream Background | #f9f7f4 | Section backgrounds |
| White | #ffffff | Card backgrounds |
| Amber/Warning | #f59e0b | Pending status, warning activities |
| Grey | #d1d5db | Incomplete status, borders |
| Dark Text | #2c2c2c | Primary text |
| Medium Text | #666666 | Secondary text |
| Light Text | #999999 | Timestamps, labels |

---

## Responsive Design

### Breakpoints

| Breakpoint | Layout | Changes |
|-----------|--------|---------|
| 1024px+ | Desktop | 3-column grid (auto-fit), full spacing |
| 768px | Tablet | 3→2 columns, adjusted fonts, smaller gap |
| 480px | Mobile | 1 column, reduced padding, small fonts |
| 360px | Small Phone | Minimal padding, 0.85rem base font |

### Key Responsive Changes

**Hero Section:**
- Desktop: 3rem padding, 2rem title
- Tablet: 2rem padding, 1.5rem title
- Mobile: 1.5rem padding, 1.25rem title

**Status Cards:**
- Desktop: 3-column grid
- Tablet: 2-column grid
- Mobile: 1-column full-width

**Activity Log:**
- Desktop: max-width 700px centered
- Mobile: Full-width with reduced padding

---

## Accessibility Features

1. **Semantic HTML:** `<section>`, `<article>`, `<header>`, `<footer>`
2. **ARIA Labels:** Appropriate for dynamic content
3. **Keyboard Navigation:** All buttons and links keyboard-accessible
4. **Color Contrast:** WCAG AA compliant
5. **Focus Indicators:** Visible focus states on buttons
6. **Motion:** Respects `prefers-reduced-motion` media query
7. **Text Sizing:** Scalable fonts, not fixed pixels
8. **Timestamps:** Machine-readable dates with human-readable display

---

## Error Handling

### Scenarios

1. **User Not Authenticated**
   ```javascript
   const { data: { user } } = await supabaseClient.auth.getUser();
   if (!user) {
     redirectToSignup('Authentication required. Please sign up first.');
   }
   ```

2. **No Practitioner Profile Found**
   ```javascript
   const practitionerData = await fetchPractitionerProfile(user.id);
   if (!practitionerData) {
     redirectToSignup('No practitioner profile found. Please complete the signup process.');
   }
   ```

3. **Supabase Query Failure**
   ```javascript
   try {
     // fetch operations
   } catch (err) {
     state.error = err.message;
     renderError();
   }
   ```

4. **Missing Dependencies**
   ```javascript
   if (typeof window.getPractitionerProfile !== 'function') {
     console.error('practitionerHelpers.js not loaded');
     return null;
   }
   ```

### Error Display

```html
<div class="error-container">
  <div class="error-title">⚠️ Unable to Load Dashboard</div>
  <div class="error-message">{error message}</div>
  <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
</div>
```

---

## Integration Points

### With Signup Wizard

**Navigation → Dashboard:**
- Wizard completion screen has button linking to `/dashboard/practitioner-dashboard.html`
- Dashboard loads and displays progress

**Dashboard → Wizard Editing:**
- Click "Edit" button on any status card
- Store step number in localStorage
- Navigate to signup wizard
- Wizard jumps to that step

**localStorage Keys:**
- `practitioner_edit_step` → Step number (1-6) to edit

---

### With Supabase Tables

**Direct Queries:**
- `practitioners` - Main profile data
- `credentials` - Linked via practitioner_id
- `background_checks` - Linked via practitioner_id (via helpers)
- `memberships` - Linked via practitioner_id (via helpers)

**Expected Table Structure:**

```sql
-- practitioners table
{
  id: uuid (primary key),
  legal_name: text,
  dba_name: text,
  workspace_type: text,
  email: text,
  bio: text,
  tagline: text,
  modalities: jsonb (array),
  availability: text,
  cancellation_policy: text,
  created_at: timestamp,
  updated_at: timestamp
}

-- credentials table
{
  id: uuid,
  practitioner_id: uuid (foreign key),
  license_type: text,
  license_number: text,
  issuing_body: text,
  expiration_date: date,
  status: text,
  created_at: timestamp
}

-- background_checks table
{
  id: uuid,
  practitioner_id: uuid (foreign key),
  status: text (approved|pending|rejected),
  provider: text,
  completed_at: timestamp,
  created_at: timestamp,
  updated_at: timestamp
}

-- memberships table
{
  id: uuid,
  practitioner_id: uuid (foreign key),
  tier: text (free|basic|premium),
  status: text (active|inactive),
  started_at: timestamp,
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## Security Considerations

1. **Authentication Check:**
   - Always verify `supabaseClient.auth.getUser()` before rendering
   - Redirect unauthenticated users to signup

2. **Row-Level Security:**
   - Dashboard should only read the logged-in user's data
   - Supabase RLS policies must restrict access by `auth.uid()`

3. **No Admin Panels:**
   - This dashboard is practitioner-only
   - Admin review features are separate (future development)

4. **localStorage:**
   - Only stores step number (not sensitive data)
   - Cleared after use

---

## Performance Optimization

1. **Parallel Data Fetching:**
   ```javascript
   const [credentials, backgroundCheck, membership] = await Promise.all([
     fetchCredentials(user.id),
     fetchBackgroundCheckStatus(user.id),
     fetchMembershipStatus(user.id)
   ]);
   ```

2. **Single Render Pass:**
   - Fetch all data first
   - Calculate completion once
   - Then render all sections in one pass

3. **Minimal DOM Operations:**
   - Use `innerHTML` once per section (not repeated assignments)
   - Batch event listener attachment

4. **CSS Animations:**
   - GPU-accelerated (transform, opacity only)
   - Respects `prefers-reduced-motion`

---

## Future Enhancements

### Phase 3 (Planned)

1. **Background Check Integration**
   - Link to third-party background check provider
   - Real-time status updates via webhooks

2. **Public Profile Preview**
   - Navigate to `/profile/{practitioner_id}`
   - Display how clients see the practitioner's info

3. **Edit Inline**
   - Edit some fields directly on dashboard (without wizard)
   - Save via practitionerHelpers functions

4. **Notifications**
   - Alert when background check completes
   - Remind to upgrade membership

5. **Statistics Dashboard**
   - View profile views count
   - Booking request metrics
   - Client feedback/ratings

6. **Batch Actions**
   - Download profile as PDF
   - Export credentials list
   - Share profile link

---

## Testing Checklist

- [ ] Dashboard loads successfully for authenticated practitioner
- [ ] All 6 status cards display correctly
- [ ] Completion percentage calculated accurately
- [ ] Activity log shows appropriate events
- [ ] Progress bar width updates with percentage
- [ ] Edit buttons navigate to correct wizard step
- [ ] localStorage stores step number
- [ ] Mobile responsive at 360px, 480px, 768px, 1024px
- [ ] Error handling works (no profile → redirects to signup)
- [ ] Animations smooth (no jank)
- [ ] Accessibility: keyboard navigation, color contrast
- [ ] Print-friendly layout

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Dashboard blank after signup | Auth check failing | Verify user is authenticated in browser console |
| Cards show "Not set" | Data not in database | Check practitioner profile was saved to Supabase |
| Progress bar not animating | CSS not loaded | Verify practitioner-dashboard.css is linked |
| "practitionerHelpers not found" | Script import error | Ensure supabaseClient.js and practitionerHelpers.js are in `<script>` tags |
| Activity log empty | No milestone events | Check completion_percentage calculation logic |
| Edit button doesn't work | localStorage issue | Verify browser localStorage is enabled |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.1 | Nov 5, 2025 | Initial release |
| 2.0 | Oct 30, 2025 | Signup wizard released (prerequisite) |

---

**Last Updated:** November 5, 2025  
**Maintained By:** Rooted Vitality Development Team  
**License:** Internal Use Only
