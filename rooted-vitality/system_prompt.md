🧩 SYSTEM PROMPT — ROOTED VITALITY, INC. (BUILD STANDARD v2.0)

╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

Project Name: Rooted Vitality, Inc.
Project Type: Holistic wellness marketplace platform (membership-based)
Core Philosophy: "Medicine Meets Modern SaaS" — a calm, ethical, data-driven bridge between holistic practitioners and clients
Scale Target: 1,000+ practitioners, 10,000+ patients
Build Method: AI Coordination Officer methodology with Claude Sonnet 4.5

═══════════════════════════════════════════════════════════════════
🎯 THE 11 COMMANDMENTS (NEVER BREAK THESE)
═══════════════════════════════════════════════════════════════════

1. Always follow industry best practices and standards
2. All files must have branding, table of contents, clear and numbered sections
3. No code can be out of place, everything in its appropriate file/section
4. All functions/code blocks must be notated adequately
5. Styles.css & injections.js must be kept lightweight (universals only)
6. Universals from styles and injections must always be properly used on each page (no inline universals)
7. Don't bury me in documentation. Create changelog, file directory, bug tracker, readme and update them accordingly
8. Scalability first - choose auto-scaling solutions, index queries, paginate lists, structure for specialist handoff
9. Mobile-first responsive - design for 360px minimum, test mobile before desktop
10. Maintainability over cleverness - write code others can understand, explain complex logic, consistent naming
11. No verbose code - less lines, more function per line (concise, efficient, readable)

═══════════════════════════════════════════════════════════════════
⚙️ STRUCTURE & ORGANIZATION
═══════════════════════════════════════════════════════════════════

FILE HEADER STANDARD (EVERY FILE):

╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: [filename]                                                  ║
║  Purpose: [one-line description]                                   ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. [Section Name]
  2. [Section Name]
  3. [Section Name]

FOLDER STRUCTURE:

/                   Core HTML pages (index, about, join, providers, contact)
/articles/          Help center articles
/assets/            Images, icons, media
/scripts/           Modular JavaScript (header, footer, chatbot, injections)
/styles/            Global stylesheets (styles.css, animations.css, theme.css)
/data/              JSON configs (chatbot data, service tiers)
/components/        React components (if using React)
/services/          API integration logic
/utils/             Helper functions
/admin/             Future internal tools

SECTION DIVIDERS:

HTML:
<!-- ========================================== -->
<!-- 1. SECTION NAME -->
<!-- ========================================== -->

JavaScript:
// ======================================================
// 1. SECTION NAME
// ======================================================

CSS:
/* ========================================== */
/* 1. SECTION NAME */
/* ========================================== */

NAMING CONVENTIONS:

- HTML files: lowercase-hyphen.html (about.html, join-network.html)
- JS files: camelCase.js (headerInject.js, userService.js)
- CSS files: kebab-case.css (styles.css, theme-earth.css)
- Classes: BEM naming (.hero__title, .card__description)
- IDs: descriptive-minimal (#chatbot-container, #provider-form)
- Variables: rootedPrimary, rootedAccent, userRole
- React components: PascalCase.jsx (PractitionerCard.jsx)

═══════════════════════════════════════════════════════════════════
🎨 BRAND & DESIGN SYSTEM
═══════════════════════════════════════════════════════════════════

COLOR PALETTE:

--rooted-primary: #5c9a72;   /* Botanical green */
--rooted-accent:  #d4c47c;   /* Herbal gold */
--rooted-green:   #ebf6e8;   /* Light sage */
--rooted-cream:   #fbf7ec;   /* Warm cream */
--rooted-peach:   #fae2ca;   /* Soft peach */
--rooted-dark:    #2e2b28;   /* Earth brown */
--rooted-light:   #ffffff;   /* Clean white */

TYPOGRAPHY:

font-family: 'Inter', 'Lora', sans-serif;

- Headings: Inter (modern, tech)
- Body: Lora (organic, warm)
- Minimum font size: 16px
- Line height: 1.6 for body text

DESIGN LANGUAGE:

- Mood: Grounded, breathable, approachable
- Shapes: Rounded corners (8px), minimal borders, subtle shadows
- Imagery: Nature + modern tech harmony
- Motion: Gentle opacity fades, no abrupt transitions
- Spacing: Generous white space, never cramped

COPY TONE:

- Empathetic and empowering
- Short, action-based CTAs ("Find Care", "Join Network")
- Balance warmth with professionalism
- No clinical jargon

═══════════════════════════════════════════════════════════════════
💻 TECHNICAL STANDARDS
═══════════════════════════════════════════════════════════════════

STACK REQUIREMENTS (for scalability):

Frontend:
- React 18+ (or vanilla HTML/JS if simpler)
- Tailwind CSS (performance + utility-first)
- React Query (automatic caching if using React)

Backend & Database:
- Supabase (PostgreSQL + Auth + Storage)
  - Auto-scales to 10K+ users
  - Row-level security built-in
  - Free tier: 500MB database, 50K MAU

Hosting:
- Vercel (serverless, auto-scaling)
  - Free tier with unlimited bandwidth
  - Automatic SSL and edge network
  - Zero-config deployment

Payment Processing:
- TBD - but must integrate via webhooks
- Never store payment details directly

CDN:
- Cloudflare (automatic via Vercel)

HTML STANDARDS:

- Semantic HTML5 (header, section, article, footer)
- Fully responsive (min width: 360px)
- Accessibility: aria-labels, 4.5:1 contrast, alt text
- All buttons keyboard navigable
- Lazy load images below fold

JAVASCRIPT STANDARDS:

- ES6+ syntax
- Modular structure (IIFE or ES modules)
- No inline JS except page-specific at bottom
- Clear section numbers and comments
- DRY principle (don't repeat yourself)

CSS STANDARDS:

- Mobile-first media queries
- Use CSS variables for colors/spacing
- BEM naming for classes
- Group related styles
- Comment complex selectors

═══════════════════════════════════════════════════════════════════
🚀 SCALABILITY RULES
═══════════════════════════════════════════════════════════════════

DATABASE:

✓ Index ALL foreign keys
✓ Index fields in WHERE clauses (specialty, location, rating)
✓ Use UUID for primary keys
✓ Implement soft deletes (deleted_at column)
✓ Track created_at and updated_at on all tables
✓ Enable row-level security (RLS) on all tables

PERFORMANCE:

✓ Pagination: Default 20 items, max 100, never load all records
✓ Server-side filtering: Filter in database, not in JavaScript
✓ Caching: Use React Query or similar for API calls
✓ Images: WebP format, lazy load, compress to <200KB
✓ API responses: <500ms for queries, <2s for complex operations

CODE STRUCTURE:

✓ Separate business logic from UI
✓ Service layer for all API calls
✓ Utility functions in /utils/
✓ Keep components small (<300 lines)
✓ Document architectural decisions in comments

SCALING PHASES:

0-100 users:     Free tier, works perfectly, build and launch
100-1K users:    Still free tier, monitor metrics
1K-10K users:    ~$50/month, may need basic optimization
10K+ users:      Bring in specialist for advanced optimization

═══════════════════════════════════════════════════════════════════
📋 DOCUMENTATION REQUIREMENTS
═══════════════════════════════════════════════════════════════════

MAINTAIN THESE 4 FILES (no more):

1. CHANGELOG.md
   - Track all major changes
   - Format: Date, version, changes made
   - Update after completing each feature

2. FILE_DIRECTORY.md
   - List all files with one-line purpose
   - Update when adding new files
   - Organize by folder

3. README.md
   - Project overview
   - Setup instructions
   - How to run locally
   - Deployment process

INLINE DOCUMENTATION:

✓ Comment complex logic (WHY, not just WHAT)
✓ Document function parameters and return values
✓ Explain architectural decisions
✓ Note TODOs for future work

═══════════════════════════════════════════════════════════════════
🔒 SECURITY & VALIDATION
═══════════════════════════════════════════════════════════════════

AUTHENTICATION:

✓ Use Supabase Auth (handles tokens, sessions)
✓ Role-based access (patient, practitioner, admin)
✓ Session timeout: 24 hours
✓ httpOnly cookies (not localStorage for tokens)

DATA VALIDATION:

✓ Validate ALL user input client-side AND server-side
✓ Sanitize HTML to prevent XSS
✓ Use parameterized queries (Supabase handles this)
✓ Never trust client-side validation alone

PAYMENT SECURITY:

✓ NEVER store credit card numbers
✓ Use tokenization system from payment provider
✓ Verify webhook signatures
✓ Log all payment transactions

ERROR HANDLING:

✓ Log errors with context (user ID, action, timestamp)
✓ Never expose sensitive data in error messages
✓ Provide user-friendly error messages
✓ Implement React Error Boundaries

═══════════════════════════════════════════════════════════════════
✅ CODE REVIEW CHECKLIST
═══════════════════════════════════════════════════════════════════

Before completing ANY feature, verify:

□ File has proper header with branding and table of contents
□ Code is in correct file/section (no orphaned code)
□ All functions have adequate comments
□ Styles.css and injections.js remain lightweight
□ No universal styles are inline on pages
□ Code is concise (less lines, more function per line)
□ Mobile responsive (tested at 360px width)
□ Accessible (keyboard nav, aria labels, contrast)
□ Scalable (uses indexes, pagination, caching where needed)
□ Documentation updated (changelog, file directory, etc.)
□ Follows industry best practices

═══════════════════════════════════════════════════════════════════
🎯 BUILD PHILOSOPHY
═══════════════════════════════════════════════════════════════════

"Works today, scales tomorrow, specialist improves later."

Build with:
- Clean, maintainable code that any developer can understand
- Modern tools that auto-scale (Supabase, Vercel)
- Proper structure for future optimization
- Documentation that enables handoff

Avoid:
- Premature optimization (don't over-engineer)
- Vendor lock-in (use standard technologies)
- Technical debt (fix issues as you go)
- Clever code that sacrifices readability

═══════════════════════════════════════════════════════════════════

END OF SYSTEM PROMPT — ROOTED VITALITY BUILD STANDARD v2.0
Built by Kyle J. Mohney with Claude Sonnet 4.5 | 2025
