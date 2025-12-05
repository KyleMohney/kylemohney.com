# SEO Map & Guide - Rooted Vitality

## Global SEO Principles
- Unique `<title>` and `<meta name="description">` for every page
- 5-10 relevant `<meta name="keywords">` per page
- Open Graph tags for social sharing
- Schema.org markup for rich results
- Image alt text for all images
- Internal linking for crawlability
- Sitemap.xml and robots.txt configured

---

## SEO Map: Page-by-Page Recommendations

| Page                        | Title Example                        | Description Example                                 | Keywords Example                        | Open Graph Tags | Schema.org Markup |
|-----------------------------|--------------------------------------|----------------------------------------------------|-----------------------------------------|-----------------|-------------------|
| index.html                  | Rooted Vitality - Holistic Wellness  | Discover holistic health, connect with practitioners| holistic, wellness, practitioner, health| Yes            | WebSite           |
| dashboard/client-dashboard  | My Wellness Dashboard                | Track your goals, connect with trusted practitioners| dashboard, wellness, goals, client      | Yes            | WebPage           |
| dashboard/pro/index.html    | Practitioner Dashboard               | Manage your practice, leads, and profile            | practitioner, leads, profile, health    | Yes            | WebPage           |
| dashboard/pro/profile.html  | My Practitioner Profile              | Showcase your credentials, specialties, and reviews | profile, practitioner, credentials      | Yes            | Person            |
| dashboard/pro/match-settings| Match Settings - Rooted Vitality     | Set your service categories and matching preferences| match, settings, service, category      | Yes            | WebPage           |
| articles.html               | Articles - Holistic Health Insights  | Read expert articles on wellness and health         | articles, wellness, insights, health    | Yes            | Blog              |
| help-center/index.html      | Help Center - Rooted Vitality        | Get support, FAQs, and guides for your journey      | help, support, FAQ, guide               | Yes            | FAQPage           |
| client-signup.html          | Sign Up - Rooted Vitality            | Create your account and start your wellness journey | signup, account, wellness, practitioner | Yes            | WebPage           |
| contact.html                | Contact Us - Rooted Vitality         | Reach out for support or partnership inquiries      | contact, support, partnership, wellness | Yes            | ContactPage       |
| policies/*                  | Privacy Policy / Terms of Service    | Review our privacy and terms policies               | privacy, terms, policy, legal           | Yes            | WebPage           |

---

## Meta Tag Templates

### Basic Meta Tags
```html
<title>Rooted Vitality - Holistic Wellness</title>
<meta name="description" content="Discover holistic health, connect with practitioners, and start your wellness journey.">
<meta name="keywords" content="holistic, wellness, practitioner, health, client, support">
```

### Open Graph Tags
```html
<meta property="og:title" content="Rooted Vitality - Holistic Wellness">
<meta property="og:description" content="Discover holistic health, connect with practitioners, and start your wellness journey.">
<meta property="og:image" content="https://rootedvitality.com/assets/logo.png">
<meta property="og:url" content="https://rootedvitality.com/">
<meta property="og:type" content="website">
```

### Schema.org Markup (JSON-LD)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Rooted Vitality",
  "url": "https://rootedvitality.com/"
}
</script>
```

---

## Image SEO
- All images must have descriptive `alt` attributes
- Example: `<img src="/assets/logo.png" alt="Rooted Vitality logo">`

---

## Internal Linking
- Use clear anchor text for links between pages
- Example: `<a href="/help-center/">Help Center</a>`
- Link to related articles, guides, and dashboards

---

## Implementation Checklist
- [x] All main pages have unique titles and meta descriptions
- [ ] Articles and policy pages need meta tags added
- [x] Sitemap.xml created
- [x] Robots.txt configured
- [ ] Schema.org markup added to all pages
- [x] Image alt text present on main pages
- [x] Internal linking structure in place

---

## Next Steps
- Audit all articles and policy pages for missing meta tags
- Add Schema.org markup to all major pages
- Review image alt text and internal links site-wide
- Submit sitemap.xml to Google Search Console

---

## Resources
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Schema.org Markup Reference](https://schema.org/docs/schemas.html)
- [Open Graph Protocol](https://ogp.me/)
