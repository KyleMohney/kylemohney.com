<!--
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  SEO & Metadata Implementation Guide                               ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
-->

# SEO & Metadata Implementation Guide

## Overview

All pages (index.html and all 7 patient-focused articles) include comprehensive SEO and Open Graph metadata for search engine optimization and social media sharing.

## Meta Tags Implemented

### Universal Meta Tags (All Pages)

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

- **UTF-8 Encoding**: Ensures proper character display across browsers
- **Viewport**: Enables responsive design on mobile devices

### Description Meta Tag

**Purpose**: Displayed in search engine results (SERP snippet)

**Format**: 150-160 characters, compelling and descriptive

**Examples**:
- Index: "Comprehensive wellness guides for patients and practitioners. Learn about holistic medicine, wellness practices, and finding practitioners."
- Article: "Discover what makes holistic medicine different. Learn how holistic practitioners view health, wellness, and the connection between mind, body, and spirit."

### Keywords Meta Tag

**Purpose**: Helps search engines understand page content

**Format**: Comma-separated list of relevant terms (7-10 keywords)

**Examples**:
- Article keywords: "holistic medicine, alternative medicine, wellness, integrative health, holistic health, mind-body connection"
- Patient-focused terms only (not practitioner-specific)

### Author Meta Tag

```html
<meta name="author" content="Rooted Vitality">
```

- Identifies content creator
- Builds brand recognition
- Used by search engines for credibility

### Canonical Link

```html
<link rel="canonical" href="https://rootedvitality.com/articles/article-name.html">
```

**Purpose**: Prevents duplicate content issues
- Specifies the "official" version of a page
- Prevents SEO penalties for similar content
- Points to full domain URLs for authority

### Open Graph Tags (Social Media)

**Purpose**: Controls how content appears when shared on social platforms (Facebook, LinkedIn, Twitter, etc.)

**Tags**:
```html
<meta name="og:title" content="Article Title | Rooted Vitality">
<meta name="og:description" content="[Description text]">
<meta name="og:type" content="article">
```

- **og:title**: Overrides default page title in social shares
- **og:description**: Custom preview text for sharing
- **og:type**: Defines content type (website, article, etc.)

### Article-Specific Meta Tags

For article pages only:

```html
<meta name="article:published_time" content="2025-10-28">
<meta name="article:author" content="Rooted Vitality">
<meta name="article:section" content="[Topic Category]">
```

- **published_time**: Publication date (ISO 8601 format)
- **author**: Article author/creator
- **section**: Content category (Holistic Wellness, Plant Wellness, etc.)

## Pages & Their Metadata

### 1. Index.html (Help Center)
- **Title**: Rooted Vitality Help Center
- **Description**: Help center overview with patient/practitioner content
- **Type**: website
- **Canonical**: https://rootedvitality.com/

### 2. holistic-medicine-explained.html
- **Title**: What Makes Holistic Medicine Different | Rooted Vitality
- **Keywords**: holistic medicine, alternative medicine, wellness, integrative health
- **Section**: Holistic Wellness

### 3. healing-plants-home.html
- **Title**: Healing Plants for Your Home | Rooted Vitality
- **Keywords**: healing plants, medicinal plants, home plants, wellness plants
- **Section**: Plant Wellness

### 4. finding-right-practitioner.html
- **Title**: Finding the Right Practitioner | Rooted Vitality
- **Keywords**: find practitioner, holistic practitioner, wellness coach
- **Section**: Finding Help

### 5. nutrition-holistic-wellness.html
- **Title**: Nutrition and Holistic Wellness | Rooted Vitality
- **Keywords**: nutrition, holistic nutrition, wellness diet, food as medicine
- **Section**: Nutrition

### 6. mindfulness-stress-relief.html
- **Title**: Mindfulness and Stress Relief | Rooted Vitality
- **Keywords**: mindfulness, stress relief, meditation, stress management
- **Section**: Mental Wellness

### 7. seasonal-wellness.html
- **Title**: Seasonal Wellness | Rooted Vitality
- **Keywords**: seasonal wellness, seasonal health, natural rhythms
- **Section**: Seasonal Wellness

### 8. how-to-book-consultation.html
- **Title**: How to Book a Consultation | Rooted Vitality
- **Keywords**: book consultation, schedule appointment, wellness consultation
- **Section**: Getting Started

## SEO Best Practices Implemented

### ✅ Title Tags
- Includes page topic + brand name
- Under 60 characters
- Keyword-focused but natural
- Example: "Holistic Medicine Explained | Rooted Vitality"

### ✅ Meta Descriptions
- 150-160 characters
- Clear, compelling summary
- Includes primary keyword naturally
- Call to action implied
- Unique for each page

### ✅ URL Structure
- Descriptive, keyword-relevant slugs
- Hyphens separate words (not underscores)
- Lowercase
- Examples: `/articles/holistic-medicine-explained.html`

### ✅ Semantic HTML
- Proper heading hierarchy (H1 > H2 > H3)
- One H1 per page
- Descriptive link text
- Alt text ready for images

### ✅ Mobile Optimization
- Viewport meta tag configured
- Responsive design in styles.css
- Fast loading with centralized CSS
- Touch-friendly elements

### ✅ Content Structure
- Clear article format
- Logical heading hierarchy
- Related links between articles
- Proper metadata for each piece

## How to Update Metadata for New Articles

When adding a new article, include in `<head>`:

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[Article Title] | Rooted Vitality</title>

<!-- SEO & Meta Tags -->
<meta name="description" content="[150-160 character description]">
<meta name="keywords" content="[keyword1, keyword2, keyword3...]">
<meta name="author" content="Rooted Vitality">
<meta name="og:title" content="[Article Title] | Rooted Vitality">
<meta name="og:description" content="[Description text]">
<meta name="og:type" content="article">
<meta name="article:published_time" content="[YYYY-MM-DD]">
<meta name="article:author" content="Rooted Vitality">
<meta name="article:section" content="[Category]">
<link rel="canonical" href="https://rootedvitality.com/articles/[article-slug].html">

<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
[...]
```

## SEO Performance Monitoring

### Recommended Tools
1. **Google Search Console** - Monitor search performance, indexing, errors
2. **Google Analytics** - Track traffic, user behavior, conversions
3. **Bing Webmaster Tools** - Optimize for Bing search
4. **SEMrush/Ahrefs** - Keyword research, backlink analysis, competitor tracking
5. **Yoast SEO** - Content optimization guidance

### Key Metrics to Track
- Search impressions and click-through rate (CTR)
- Keyword rankings
- Page load speed
- Mobile usability
- Click-through rate from descriptions
- Social media engagement

## Structured Data (Schema.org)

Currently: Basic Open Graph implementation

**Future Enhancement**: Add JSON-LD structured data for:
- Article schema
- Organization schema
- BreadcrumbList schema
- FAQ schema (for Q&A articles)

This enables rich snippets in search results.

## Important Notes

1. **Canonical URLs**: Currently set to full domain (https://rootedvitality.com/). Update with actual domain when deployed.

2. **Date Format**: Uses ISO 8601 (2025-10-28) for consistency and machine-readability.

3. **Open Graph Images**: Consider adding `og:image` meta tags for better social sharing with preview images.

4. **Twitter Cards**: Add `twitter:` meta tags for optimized Twitter sharing.

5. **Robots Meta Tag**: Consider adding `<meta name="robots" content="index, follow">` to explicitly allow indexing.

## Related Documentation

- See `/docs/MOBILE_SCALING_GUIDE.md` for responsive design details
- See `/docs/BRAND_STANDARDS.md` for brand consistency
- See `/docs/MIGRATION_GUIDE.md` for file structure

---

**Last Updated**: October 28, 2025  
**Maintained by**: Rooted Vitality Development Team
