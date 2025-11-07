# Changelog - Rooted Vitality

## November 5, 2025 (v2.1)
### Added - Practitioner Dashboard
- **NEW:** Practitioner control center (`/dashboard/practitioner-dashboard.html`)
  - Welcome hero section with personalized greeting
  - Real-time progress bar showing profile completion percentage
  - Status grid with 6 section cards (Business Info, Credentials, Services, Bio, Background Check, Membership)
  - Color-coded status indicators (green/complete, amber/pending, grey/incomplete)
  - Dynamic card rendering from Supabase data
  - Activity log showing profile milestones and verification status
  - Links to edit specific wizard steps with localStorage navigation markers
  - Preview public profile button (for profiles 50%+ complete)
- **NEW:** Dashboard JavaScript logic (`/scripts/practitioner-dashboard.js`)
  - Auth check and redirect to signup if not logged in
  - Supabase data fetching (practitioners, credentials, background_checks, memberships tables)
  - Completion percentage calculation based on profile sections
  - Dynamic status card rendering with context-specific actions
  - Activity feed generation with timestamps
  - Edit handlers that store step number in localStorage
  - Error handling with user-friendly messages
- **NEW:** Dashboard stylesheet (`/styles/practitioner-dashboard.css`)
  - Glass-morphism hero section with gradient
  - Animated progress bar with cubic-bezier easing
  - Responsive status card grid (3 columns desktop, 1 mobile)
  - Activity log styling with type indicators (info, warning, success)
  - 4 mobile breakpoints (480px, 768px, 1024px+)
  - Accessibility-focused (prefers-reduced-motion support)
  - Print-friendly styling

```markdown
# Changelog - Rooted Vitality

## November 5, 2025 (v2.2)
### Added - Client Project Management System
- **NEW:** My Projects page (`/dashboard/client-my-projects.html`)
  - Hero section with project overview
  - Educational sidebar with 3 info cards about projects, practitioners, and collaboration
  - Create New Project button and modal
  - Project cards grid showing project details, creation date, and matched practitioners
  - Project status badges (Active, Paused, Completed)
  - Practitioner badges with avatar, name, and specialty
  - Statistics display (Total Projects, Active Practitioners)
  - Filter by status dropdown
  - View Details and Find Practitioners action buttons on each card
  - Empty state with helpful messaging
- **NEW:** My Projects JavaScript (`/scripts/my-projects.js`)
  - Auth verification (redirects non-clients)
  - Load projects from Supabase with related practitioners
  - Dynamic project card rendering with status indicators
  - Create project functionality with form validation
  - Project filtering by status
  - Statistics calculation and display
  - Modal management for project creation
  - Event listeners for all interactions
  - HTML escaping for XSS prevention
- **NEW:** My Projects stylesheet (`/styles/my-projects.css`)
  - Mobile-first responsive design (360px minimum)
  - Sidebar layout for tablet+, stacked on mobile
  - Project cards with hover effects and animations
  - Practitioner badge styling with avatars
  - Modal styling with overlay and animations
  - Form styling with focus states
  - Status color coding (green/active, gold/paused, red/completed)
  - 4 breakpoints: mobile, tablet (768px), desktop (1024px), large (1440px)
  - Glass-morphism effects and smooth transitions
  - Accessibility-focused with proper contrast and keyboard navigation
- Updated documentation:
  - `FILE_DIRECTORY.md` - Added My Projects references
  - `CHANGELOG.md` - This entry

### Technical Implementation
- Follows system_prompt.md Commandment #5: Styles.css + injections.js kept lightweight
- All page-specific styles isolated to `my-projects.css`
- Modular JavaScript with clear sections and comments
- Supabase integration with proper queries and indexes
- Auth checks before data loading
- Scalable design ready for 10,000+ users

## November 5, 2025 (v2.1)
### Added - Practitioner Dashboard
- **NEW:** Practitioner control center (`/dashboard/practitioner-dashboard.html`)
  - Welcome hero section with personalized greeting
  - Real-time progress bar showing profile completion percentage
  - Status grid with 6 section cards (Business Info, Credentials, Services, Bio, Background Check, Membership)
  - Color-coded status indicators (green/complete, amber/pending, grey/incomplete)
  - Dynamic card rendering from Supabase data
  - Activity log showing profile milestones and verification status
  - Links to edit specific wizard steps with localStorage navigation markers
  - Preview public profile button (for profiles 50%+ complete)
- **NEW:** Dashboard JavaScript logic (`/scripts/practitioner-dashboard.js`)
  - Auth check and redirect to signup if not logged in
  - Supabase data fetching (practitioners, credentials, background_checks, memberships tables)
  - Completion percentage calculation based on profile sections
  - Dynamic status card rendering with context-specific actions
  - Activity feed generation with timestamps
  - Edit handlers that store step number in localStorage
  - Error handling with user-friendly messages
- **NEW:** Dashboard stylesheet (`/styles/practitioner-dashboard.css`)
  - Glass-morphism hero section with gradient
  - Animated progress bar with cubic-bezier easing
  - Responsive status card grid (3 columns desktop, 1 mobile)
  - Activity log styling with type indicators (info, warning, success)
  - 4 mobile breakpoints (480px, 768px, 1024px+)
  - Accessibility-focused (prefers-reduced-motion support)
  - Print-friendly styling

## October 30, 2025 (v2.0)
### Added - Practitioner Signup System
- Comprehensive multi-step practitioner onboarding wizard (`/dashboard/practitioner-signup.html`)
- Full JavaScript implementation with Supabase integration (`/scripts/practitioner-signup.js`)
- **NEW:** Dedicated Supabase client module (`/scripts/supabaseClient.js`)
- **NEW:** Practitioner helper functions module (`/scripts/practitionerHelpers.js`) with:
  - Profile CRUD operations
  - Credential management
  - File upload/download helpers
  - Status management functions
- Complete responsive styling system (`/styles/practitioner-signup.css`)
- **NEW:** Comprehensive SQL setup guide (`/docs/SQL_SETUP.md`) with:
  - Practitioners table schema
  - Credentials table schema
  - Background checks table schema
  - Row-Level Security policies
  - Storage bucket configuration
  - Automatic updated_at triggers
- 6-step guided wizard: Account Verification, Business Identity, Credentials, Services, Presentation, Legal
- Auto-save functionality to localStorage and Supabase
- File upload handlers for images, documents, and videos
- Progress tracking with visual indicators
- Form validation with inline error messages
- Professional credential verification system
- Legal waiver and practitioner participation agreement
- Completion screen with dashboard redirect
- **"Become a Practitioner" CTA button** in client dashboard top-right corner

### Technical Features
- Supabase Storage integration for file uploads
- Debounced auto-save to prevent API spam
- Multi-file upload support (licenses, certifications, gallery)
- Real-time progress calculation
- Character counters for bio fields
- Phone number formatting
- Mobile-first responsive design (360px+)
- Accessibility-compliant form controls
- Glass-morphism UI effects

### Added - Client Signup System
- Client signup system (`/signup.html`, `/scripts/signupHandler.js`)
- Supabase database integration with `profiles` table
- Database trigger for auto-profile creation on user signup
- RLS policies for profile security

### Fixed
- Supabase URL typo in `config.js` (was `rxxcktbyr...`, now `racsktdyr...`)
- Profile creation flow (changed from `.insert()` to `.update()` with trigger)
- Enhanced error logging in signup handler

### Issues
- Email rate limit (3-4/hour on free tier) - need to disable confirmations or add custom SMTP

## Previous
- Universal header/footer working on all pages
- Auth modal functional
- Path detection for subdirectories

```
### Added - Practitioner Signup System
- Comprehensive multi-step practitioner onboarding wizard (`/dashboard/practitioner-signup.html`)
- Full JavaScript implementation with Supabase integration (`/scripts/practitioner-signup.js`)
- **NEW:** Dedicated Supabase client module (`/scripts/supabaseClient.js`)
- **NEW:** Practitioner helper functions module (`/scripts/practitionerHelpers.js`) with:
  - Profile CRUD operations
  - Credential management
  - File upload/download helpers
  - Status management functions
- Complete responsive styling system (`/styles/practitioner-signup.css`)
- **NEW:** Comprehensive SQL setup guide (`/docs/SQL_SETUP.md`) with:
  - Practitioners table schema
  - Credentials table schema
  - Background checks table schema
  - Row-Level Security policies
  - Storage bucket configuration
  - Automatic updated_at triggers
- 6-step guided wizard: Account Verification, Business Identity, Credentials, Services, Presentation, Legal
- Auto-save functionality to localStorage and Supabase
- File upload handlers for images, documents, and videos
- Progress tracking with visual indicators
- Form validation with inline error messages
- Professional credential verification system
- Legal waiver and practitioner participation agreement
- Completion screen with dashboard redirect
- **"Become a Practitioner" CTA button** in client dashboard top-right corner

### Technical Features
- Supabase Storage integration for file uploads
- Debounced auto-save to prevent API spam
- Multi-file upload support (licenses, certifications, gallery)
- Real-time progress calculation
- Character counters for bio fields
- Phone number formatting
- Mobile-first responsive design (360px+)
- Accessibility-compliant form controls
- Glass-morphism UI effects

### Added - Client Signup System
- Client signup system (`/signup.html`, `/scripts/signupHandler.js`)
- Supabase database integration with `profiles` table
- Database trigger for auto-profile creation on user signup
- RLS policies for profile security

### Fixed
- Supabase URL typo in `config.js` (was `rxxcktbyr...`, now `racsktdyr...`)
- Profile creation flow (changed from `.insert()` to `.update()` with trigger)
- Enhanced error logging in signup handler

### Issues
- Email rate limit (3-4/hour on free tier) - need to disable confirmations or add custom SMTP

## Previous
- Universal header/footer working on all pages
- Auth modal functional
- Path detection for subdirectories
