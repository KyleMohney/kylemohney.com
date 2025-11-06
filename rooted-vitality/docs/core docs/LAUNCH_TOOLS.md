<!-- ======================================================
     LAUNCH TOOLS & EXPENSES
     Rooted Vitality, Inc.
     Platform Scaling Budget (1K → 10K users)
     ====================================================== -->

# 💰 Launch Tools & Operating Expenses

## Development & AI Tools

| Tool | Cost | Purpose | Notes |
|------|------|---------|-------|
| VS Code GitHub Copilot | $20/mo | Code completion & generation | Essential for velocity |
| Copilot Pro (additional prompts) | $20/mo | Extended context & capabilities | Optional but recommended |
| Claude Pro / ChatGPT Plus | $40/mo | Complex architecture decisions | Can consolidate: use one or both |
| **Subtotal Dev** | **$80/mo** | | |

---

## Infrastructure & Database

| Tool | Cost | Purpose | Notes |
|------|------|---------|-------|
| Supabase Pro Tier | $25/mo | PostgreSQL + Auth + Storage | Scale to 10K+ users, unlimited emails |
| Vercel Pro | $20/mo | Frontend hosting + edge functions | Auto-scales, CDN included, SSL free |
| Cloudflare Enterprise | $200/mo | DDoS protection + WAF + caching | For 10K+ users, highly recommended |
| **Subtotal Infrastructure** | **$245/mo** | | Supabase Pro is critical |

---

## Communication & Email

| Tool | Cost | Purpose | Notes |
|------|------|---------|-------|
| Google Workspace (Business Standard) | $14/user/mo | Staff email + support bots + drive | Start 5 users = $70/mo |
| SendGrid (Email Service) | $0-20/mo | Transactional email (optional backup) | Supabase auth emails often sufficient |
| Twilio (SMS notifications) | $0-50/mo | SMS alerts, 2FA, notifications | Optional, pay-as-you-go |
| **Subtotal Communications** | **$70-140/mo** | | |

---

## Domain & DNS

| Tool | Cost | Purpose | Notes |
|------|------|---------|-------|
| Primary Domain (.com) | $12-15/yr | rootedvitality.com | Godaddy/Namecheap average |
| Premium Domain (if needed) | $20-500/yr | Backup or premium .co/.io | Variable |
| DNS Management (Cloudflare) | Free | DNS + CDN + security | Free tier sufficient initially |
| SSL Certificate | Free | HTTPS encryption | Vercel/Cloudflare provide free |
| **Subtotal Domains** | **$1-40/mo avg** | | |

---

## Payment Processing

| Tool | Cost | Purpose | Notes |
|------|------|---------|-------|
| Stripe | 2.9% + $0.30/transaction | Payment processing | Industry standard, free to set up |
| Square (alternative) | 2.6% + $0.10/transaction | Payment processing | Lower fees, similar functionality |
| **Subtotal Payments** | **Variable** | | Only charge when revenue flows |

---

## Monitoring & Analytics

| Tool | Cost | Purpose | Notes |
|------|------|---------|-------|
| Google Analytics 4 | Free | User behavior tracking | Essential, free tier sufficient |
| Sentry (Error Tracking) | $29/mo | Bug detection & monitoring | Catches production errors |
| LogRocket (Session Replay) | $99/mo | User session recording | For UX debugging, optional |
| Datadog (APM) | $15/mo | Application performance monitoring | Optional but recommended at scale |
| **Subtotal Monitoring** | **$29-143/mo** | | Sentry is essential |

---

## Security & Compliance

| Tool | Cost | Purpose | Notes |
|------|------|---------|-------|
| SSL/TLS Certificate | Free | HTTPS encryption | Via Vercel/Cloudflare |
| GDPR/Compliance Lawyer | $2,000-5,000 one-time | Legal review | Must-have before launch |
| Password Manager (1Password/LastPass) | $10/mo | Team credential management | Essential for 5+ team members |
| **Subtotal Security** | **$10-20/mo + legal** | | |

---

## Marketing & Growth

| Tool | Cost | Purpose | Notes |
|------|------|---------|-------|
| Mailchimp (Email Marketing) | Free-$350/mo | Newsletter & user campaigns | Free tier: up to 500 contacts |
| Google Ads | $10-100+/mo | PPC advertising | Budget-dependent, optional |
| Facebook/Instagram Ads | $10-100+/mo | Social advertising | Budget-dependent, optional |
| Zapier (Automation) | $19-99/mo | Automate workflows | Connect tools together |
| **Subtotal Marketing** | **$19-550+/mo** | | Start lean, scale with revenue |

---

## Storage & Backup

| Tool | Cost | Purpose | Notes |
|------|------|---------|-------|
| AWS S3 (file storage) | $0.023/GB/mo | User-uploaded files | Included in Supabase Storage initially |
| Backblaze B2 (backup) | $6/mo | Database backups | Disaster recovery |
| **Subtotal Storage** | **$6/mo** | | Supabase handles most initially |

---

## Team & Project Management

| Tool | Cost | Purpose | Notes |
|------|------|---------|-------|
| Slack (team chat) | Free-$8/user/mo | Team communication | Free tier sufficient, upgrade as team grows |
| GitHub Pro | $4/user/mo | Private repos + advanced features | Essential for multi-developer teams |
| Figma (Design) | $12/mo (team) | UI/UX design collaboration | Optional, Figma Community free for basics |
| Linear/Jira (Issue tracking) | $7-14/mo | Project management | Alternative: GitHub Issues (free) |
| **Subtotal Team** | **$20-50/mo** | | |

---

## LAUNCH BUDGET SUMMARY (Monthly)

### Minimal (MVP)
```
Development:        $20  (Copilot only)
Infrastructure:     $45  (Vercel + basic Supabase)
Communication:      $0   (Gmail free tier)
Domains:            $2   (avg)
Monitoring:         $0   (free tier)
────────────────────────
TOTAL:              $67/mo
```

### Standard (1K users)
```
Development:        $80  (Copilot + Claude)
Infrastructure:     $245 (Vercel + Supabase Pro)
Communication:      $70  (Google Workspace 5 users)
Domains:            $5
Monitoring:         $29  (Sentry)
Team Tools:         $30  (GitHub + Slack)
────────────────────────
TOTAL:              $459/mo
```

### Production (10K+ users)
```
Development:        $80
Infrastructure:     $245 + Cloudflare $200
Communication:      $140 (Google Workspace 10 users)
Domains:            $10
Monitoring:         $143 (Sentry + Datadog + LogRocket)
Team Tools:         $50
Marketing:          $200 (growth campaigns)
Security/Legal:     $50 (ongoing)
────────────────────────
TOTAL:              $1,118/mo + Revenue Share
```

---

## ONE-TIME STARTUP COSTS

| Item | Cost | Notes |
|------|------|-------|
| Legal Review (GDPR/ToS/Privacy) | $2,000-5,000 | Must before launch |
| Branding/Logo refinement | $500-2,000 | Optional, have brand already |
| Figma Design System | $0 | Free or team plan |
| Initial Domain Registration | $12-50 | Multi-year discount available |
| **Total Startup** | **$2,500-7,050** | Budget $5,000 safe bet |

---

## CRITICAL ADDITIONS FOR SCALE

### Must-Have at 1K+ Users
- ✅ Supabase Pro ($25) - unlimited auth emails
- ✅ Vercel Pro ($20) - handles traffic spikes
- ✅ Sentry ($29) - catch production bugs
- ✅ Google Workspace ($70) - professional email

### Should-Have at 5K+ Users
- ⚠️ Cloudflare ($200) - DDoS + performance
- ⚠️ Datadog/LogRocket - performance monitoring
- ⚠️ Dedicated support tier

### Nice-to-Have (Revenue-Dependent)
- 🎯 Marketing tools (Mailchimp, ads budget)
- 🎯 Premium LLM tier for AI features
- 🎯 Advanced analytics

---

## PAYMENT STRATEGY

**Phase 1 (MVP → 100 users):** $67/mo
- Free tier tools where possible
- Validate product before spending

**Phase 2 (100 → 1K users):** $459/mo
- Upgrade to paid tiers
- Professional infrastructure
- Team expansion

**Phase 3 (1K → 10K+ users):** $1,118+/mo
- Enterprise tools
- Revenue should offset costs
- Goal: 3-5x ROI on platform

---

## REVENUE MODEL (To Offset Costs)

At 1K active practitioners:
- **Membership fee:** $29/mo per practitioner = $29,000/mo gross
- **Platform fee:** 10% of bookings or $5/booking = Variable
- **After expenses ($459):** ~$28,500/mo profit potential

At 10K practitioners:
- **Gross:** $290,000/mo + booking fees
- **After expenses ($1,118+):** ~$288,000/mo profit potential

---

## RECOMMENDATIONS

1. **Start lean** - Use free/minimal tier until validation
2. **Supabase Pro at $25** - Non-negotiable for email verification
3. **Don't cheap out on email** - Failed signups = lost users
4. **Monitor early** - Sentry catches bugs before users report
5. **Budget for legal** - GDPR/compliance is not optional
6. **Scale infrastructure first** - Vercel/Cloudflare before other tools
7. **Automate marketing** - Zapier + Mailchimp for growth

---

**Last Updated:** October 30, 2025  
**Status:** Ready to launch at $67/mo (MVP) or $459/mo (Standard)
