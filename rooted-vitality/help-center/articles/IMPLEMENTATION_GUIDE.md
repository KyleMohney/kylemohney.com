╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY ARTICLE SYSTEM                                    ║
║  Universal Template & Shared Resources                             ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

OVERVIEW
========
The Rooted Vitality article system uses a single universal template with shared
CSS and JavaScript resources. This ensures consistency, reduces duplication, and
makes maintenance simple.

Structure:
  articles/
    ├── ARTICLE_TEMPLATE.html          (Master blueprint - DO NOT EDIT for content)
    ├── styles/
    │   └── articles.css               (Universal CSS for all articles)
    ├── scripts/
    │   └── articles.js                (Universal JavaScript for all articles)
    ├── client-article-pages/
    │   ├── article-1.html             (Client articles use template)
    │   ├── article-2.html
    │   └── ...
    └── practitioner-article-pages/
        ├── article-1.html             (Practitioner articles use template)
        ├── article-2.html
        └── ...


UNIVERSAL CSS RULES (articles.css)
===================================

Color Palette (Set in :root)
  --rooted-primary: #77883e          (Sage green - primary color)
  --rooted-accent: #d4c47c           (Gold - accent/highlights)
  --rooted-cream: #f8f5e2            (Cream - backgrounds)
  --rooted-dark: #6b5b47             (Dark brown - text)
  --rooted-light: #e8e4d6            (Light beige - borders)

Typography
  --font-heading: 'Inter'             (Tech-forward headings)
  --font-body: 'Lora'                 (Warm body text)
  Line Heights: tight (1.4), normal (1.6), loose (1.8)

Spacing System
  --spacing-xs: 0.5rem    --spacing-md: 1.5rem    --spacing-xl: 3rem
  --spacing-sm: 1rem      --spacing-lg: 2rem      --spacing-2xl: 4rem

Structure Classes
  .hero                   (Full-width gradient hero with title/subtitle)
  .hero__title            (h1 equivalent)
  .hero__subtitle         (Subtitle under title)
  .container              (Constrained content wrapper, max-width: 900px)
  .article-section        (Main content section with padding)
  .cta-section            (Call-to-action section with background)

Button Classes
  .btn                    (Base button styles)
  .btn--primary           (Primary action button - green)
  .btn--secondary         (Secondary action button - outline)

Special Elements
  h1, h2, h3, h4, h5, h6  (Automatic colors & sizes)
  h2                      (Bottom gold border, 2rem size)
  h3                      (Sage color, 1.3rem size)
  blockquote              (Cream background, left border, italic)
  ul, ol                  (Automatic indentation, colored markers)
  a                       (Gold underline on hover)

Responsive Breakpoints
  Tablet (≤768px)         Reduces font sizes 10-15%
  Mobile (≤480px)         Reduces font sizes 20%, adjusts padding

IMPORTANT: Do NOT override these rules in individual articles.
          All styling comes from articles.css.


UNIVERSAL JAVASCRIPT FUNCTIONALITY (articles.js)
==================================================

1. Smooth Scroll to Sections
   Feature: Click anchor links (#section-id) for smooth scroll
   No setup needed - automatic on all hash links

2. Analytics Tracking
   Events tracked:
     - article_view: When article loads
     - article_engagement: Time spent on page (>5 seconds)
     - article_cta_click: When CTA buttons clicked
     - article_section_view: When section scrolls into view
   
   Data captured:
     - article_title: From <h1>
     - article_type: From data-article-type attribute
     - time_on_page: Duration in seconds

3. Responsive Tables
   Feature: Tables automatically get scroll wrapper on mobile
   No setup needed - automatic on all <table> elements

4. Table of Contents (Optional)
   Setup: Add <div id="toc"></div> anywhere in article
   Effect: Auto-generates TOC from all h2 and h3 headings
   Auto-adds IDs to headings for linking

5. Print Optimization
   Feature: Article optimizes for printing
     - Hides unnecessary elements (class="no-print")
     - Shows full URLs in parentheses
     - Prevents bad page breaks
     - Optimizes images

6. Section Tracking
   Feature: Detects which article sections user views
   Sends analytics event when section scrolls 30% into view


HOW TO CREATE A NEW ARTICLE
============================

STEP 1: Determine Article Type
  Choose one:
    - Client article → client-article-pages/
    - Practitioner article → practitioner-article-pages/

STEP 2: Create File from Template
  Copy ARTICLE_TEMPLATE.html to your target folder
  Name file: descriptive-slug.html
  
  Example:
    cp articles/ARTICLE_TEMPLATE.html \
       articles/client-article-pages/getting-started.html

STEP 3: Update Meta Information
  Replace these placeholders in <head>:
    ARTICLE_TITLE          → Your article title (appears in <title> tag)
    ARTICLE_DESCRIPTION    → Brief meta description (50-160 chars)
    ARTICLE_KEYWORDS       → Comma-separated keywords
    ARTICLE_TYPE           → "client" or "practitioner" (data attribute)

STEP 4: Update Hero Section
  Replace in <section class="hero">:
    ARTICLE_TITLE          → Title displayed in hero (same as meta)
    ARTICLE_SUBTITLE       → Subheading for hero section

STEP 5: Write Content
  Between <!-- BEGIN ARTICLE CONTENT --> markers:
    - Keep all <section class="article-section"> structure
    - Use <h2> for main section headings
    - Use <h3> for subsection headings
    - Use <p> for paragraphs
    - Use <ul>/<ol> for lists
    - Use <blockquote> for quotes/emphasis
    - Keep <main id="mainContent"> wrapper

STEP 6: Update CTA Section
  In the final <section class="cta-section">:
    <h2>                   → CTA heading
    <p>                    → CTA description
    LINK_DESTINATION       → Where button links to
    CTA Button Text        → What button says

STEP 7: DO NOT MODIFY
  Never change:
    - Script tags at bottom
    - Style links in <head>
    - meta charset, viewport
    - Any class names
    - HTML element structure
    - data-article-type attribute

STEP 8: Save and Test
  Test in browser:
    - Check hero displays correctly
    - Verify all links work
    - Check responsive design (mobile view)
    - Test print preview (Ctrl+P)
    - Verify scripts load (check console)


CONTENT GUIDELINES
==================

Headings
  Use semantic heading hierarchy:
    h1 - Article title (in hero only)
    h2 - Main section headings (get gold bottom border)
    h3 - Subsection headings
  Do not skip heading levels (h1 → h3)

Paragraphs
  Keep paragraphs 2-4 sentences
  Use short, scannable language
  One idea per paragraph

Lists
  Use <ul> for unordered (bullets)
  Use <ol> for ordered (numbers)
  Keep list items concise (1-2 lines)
  Don't nest lists more than 2 levels
  Use for F-scannable content (readers scan down left side)

Emphasis
  Use <strong> for emphasis (appears in sage)
  Use <em> for italics (appears italic)
  Don't use ALL CAPS
  Don't use multiple emphases in one sentence
  Put emphasis at beginning of sentences/list items for F-scanability

Links
  INTERNAL LINKS REQUIRED - Link to Rooted Vitality articles only
  Never link to external 3rd-party sites
  Use anchor tags: <a href="/rooted-vitality/help-center/articles/slug.html">link text</a>
  Keep link text descriptive (not "click here")
  Internal links: href="/rooted-vitality/..."
  Links get gold underline on hover automatically

F-SCANABILITY (REQUIRED)
========================

Web users scan in an F-shape:
  1. Horizontal scan across top (headline, hero)
  2. Vertical scan down left side (h2 headings, list bullets)
  3. Limited horizontal scan across middle paragraphs

Design for scanning:
  - Front-load important info in first sentence
  - Use h2 headings frequently (every 150-200 words)
  - Use bullet lists for multiple items
  - Bold key phrases at start of sentences
  - Keep paragraphs short (2-4 sentences max)
  - Use white space generously
  - Don't hide info deep in paragraphs

Example F-Scannable Paragraph:
  ✓ <strong>Medication management</strong> is crucial after surgery.
    Traditional approaches require three daily check-ins. Our system
    reduces this to one unified dashboard view.
  
  ✗ When managing medications, there are many approaches. The traditional
    way requires multiple check-ins daily. However, if you use a unified
    system like ours, you can reduce this to just one dashboard view.

Special Elements
  Blockquotes: <blockquote>Quote text</blockquote>
    - Use for highlighting important info
    - Automatically styled with cream background

Buttons
  Primary:   <a href="URL" class="btn btn--primary">Text</a>
  Secondary: <a href="URL" class="btn btn--secondary">Text</a>

Line Breaks
  Use paragraphs, don't use <br>
  Use <section class="article-section"> to separate major sections
  Sections automatically get bottom borders

Code/Examples
  For short code: <code>inline code</code>
  For longer examples: <pre><code>code block</code></pre>
  (Note: No special styling yet, consider using <blockquote> as alternative)


COLOR USAGE IN CONTENT
======================

Default (inherited from articles.css):
  Text: Dark brown (#6b5b47)
  Headings: Sage green (#77883e)
  Links: Sage green with gold underline on hover
  Emphasis: Sage green

Don't use:
  - Inline style attributes
  - Inline color changes
  - Background colors in content
  - Color classes

If you need special styling:
  - Use semantic HTML (strong, em, blockquote)
  - Let articles.css handle presentation


RESPONSIVE DESIGN
=================

Automatic across all breakpoints:
  Desktop (>768px)    - Full width up to 900px container
  Tablet (768px)      - Adjusted font sizes, padding
  Mobile (<480px)     - Optimized for small screens

Do NOT:
  - Use fixed widths
  - Use viewport-specific styling
  - Add media queries
  - Use viewport units (vw, vh)

All responsive design is handled by articles.css


ANALYTICS TRACKING
==================

Automatic Events (no setup needed):
  1. article_view - Fires when page loads
     Data: article_title, article_type, timestamp
  
  2. article_section_view - Fires when section scrolls into view
     Data: section_name (from h2 text)
  
  3. article_cta_click - Fires when CTA button clicked
     Data: cta_text, article_title, cta_url
  
  4. article_engagement - Fires on page exit (if >5 seconds)
     Data: article_title, time_on_page, article_type

Optional Element Hiding for Analytics:
  Add class="no-print" to elements you don't want printed
  Example: <div class="no-print">This won't print</div>


TEMPLATE MAINTENANCE
====================

The ARTICLE_TEMPLATE.html is the source of truth.
Changes to template do NOT affect existing articles.
To update existing articles:
  1. Edit the template
  2. Manually update individual article files
  OR
  3. Use find/replace across all articles

Critical: Template should never contain article-specific content.
          Only structure, placeholders, and instructions.


COMMON PATTERNS
===============

Table of Contents (Optional)
  <div id="toc"></div>
  Place anywhere, auto-generates from h2/h3 headings

Blockquote Pattern
  <blockquote>
    Important information or key takeaway
  </blockquote>

List with Strong First Item
  <ul>
    <li><strong>Item Name:</strong> Description</li>
    <li><strong>Item Name:</strong> Description</li>
  </ul>

Internal Link Pattern (REQUIRED - Use for related articles)
  <a href="/rooted-vitality/help-center/articles/article-slug.html">Article Title</a>

FAQ Section Pattern (REQUIRED - Minimum 4 questions)
  <section class="article-section">
    <div class="container">
      <h2>Frequently Asked Questions</h2>
      
      <h3>Question 1?</h3>
      <p>Answer here.</p>
      
      <h3>Question 2?</h3>
      <p>Answer here.</p>
    </div>
  </section>

Internal Related Articles Pattern (OPTIONAL but encouraged)
  <section class="article-section">
    <div class="container">
      <h2>Related Articles</h2>
      <p>Explore more articles to deepen your knowledge:</p>
      <ul>
        <li><a href="/rooted-vitality/help-center/articles/RELATED.html">Related Article Title</a></li>
      </ul>
    </div>
  </section>

CTA Section Pattern
  <section class="cta-section">
    <div class="container">
      <h2>Next Steps</h2>
      <p>Description of what comes next.</p>
      <a href="/rooted-vitality/" class="btn btn--primary">Go to Dashboard</a>
    </div>
  </section>


ARTICLE CREATION CHECKLIST (REQUIRED)
=====================================

Before publishing ANY article, verify ALL of the following:

Structure & Formatting:
  ☐ File has proper header with branding box and TOC
  ☐ Hero section with title and subtitle
  ☐ Main sections use h2 (get gold bottom border)
  ☐ Subsections use h3
  ☐ All section dividers are consistent (========)
  ☐ <main id="mainContent"> wrapper present
  ☐ CTA section at bottom with button

Content Requirements:
  ☐ FAQ section with minimum 4 questions
  ☐ Related articles section with internal links
  ☐ All links are INTERNAL (no 3rd party)
  ☐ Body text is wrapped neatly (2-4 sentence paragraphs)
  ☐ F-scannable layout (headings, bullets, emphasis on left)
  ☐ Front-loaded important info
  ☐ Proper emphasis on key terms

Technical & SEO:
  ☐ Proper meta description (50-160 characters)
  ☐ Relevant keywords in meta tags
  ☐ data-article-type set to "client" or "practitioner"
  ☐ All relative paths correct (../styles/, ../scripts/)
  ☐ No inline styles (use CSS classes only)
  ☐ No inline scripts

Responsive & Accessibility:
  ☐ Tested at 360px width (mobile)
  ☐ Tested at 768px width (tablet)
  ☐ Tested at desktop
  ☐ All links keyboard navigable
  ☐ Images have alt text (if present)
  ☐ Color contrast meets 4.5:1 ratio

Brand & Consistency:
  ☐ Uses only approved Rooted Vitality colors
  ☐ Typography: Inter (headings), Lora (body)
  ☐ Tone is empathetic and empowering
  ☐ No clinical jargon (use plain language)
  ☐ CTAs are action-based ("Find Care", "Join Network")
  ☐ Related articles follow same standards

Analytics & Performance:
  ☐ CTA buttons tracked (class="btn")
  ☐ No console errors (check F12)
  ☐ Scripts load correctly (injections.js, articles.js)
  ☐ Analytics events ready (article_view, article_engagement)

Publishing:
  ☐ File saved with descriptive slug name (lowercase-hyphen.html)
  ☐ Placed in correct folder (client-article-pages/ or practitioner-article-pages/)
  ☐ README/documentation updated with new article
  ☐ Change log entry created
  ☐ Internal links updated if needed


TROUBLESHOOTING
===============

Issue: Styles not applying
  Check:
    - articles.css link path is correct (../styles/articles.css)
    - No inline styles overriding classes
    - Browser cache cleared (Ctrl+Shift+Del)

Issue: Layout broken on mobile
  Check:
    - No fixed widths in content
    - No inline width attributes
    - Container class is present
    - Meta viewport tag is in <head>

Issue: Links not working
  Check:
    - Internal links use /rooted-vitality/ prefix
    - External links use https://
    - href attribute is present
    - Path is correct

Issue: Scripts not running
  Check:
    - articles.js script tag present at bottom
    - injections.js script tag present
    - chatbot.js script tag present
    - No console errors (F12 Developer Tools)

Issue: CTA buttons don't look right
  Check:
    - Button has both "btn" and "btn--primary" or "btn--secondary" classes
    - Button is an <a> tag with href attribute
    - Container has class="container"
    - Section has class="cta-section"


VERSIONING & UPDATES
====================

When updating articles.css or articles.js:
  1. Update both client and practitioner articles
  2. Test in both article types
  3. Check mobile and desktop views
  4. Verify analytics still tracking
  5. Update this documentation

Current versions:
  articles.css - v1.0 (Initial release)
  articles.js - v1.0 (Initial release)
  ARTICLE_TEMPLATE.html - v1.1 (Added FAQ, internal links, F-scanability)
