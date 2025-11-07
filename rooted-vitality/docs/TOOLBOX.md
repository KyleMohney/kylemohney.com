# Rooted Vitality Development & Operations Toolbox

Complete reference for technology decisions, infrastructure, tools, costs, and scaling strategy.

---

## Core Tech Stack

### Backend & Database
- **Database:** Supabase (PostgreSQL + Auth)
- **Authentication:** Supabase Auth (Email/Password)
- **File Storage:** Supabase Storage (user uploads, credentials)

### Frontend
- **Languages:** HTML, CSS, JavaScript (Vanilla)
- **Editor:** VS Code
- **Framework:** None (React upgrade planned)

### Hosting & Domain
- **Frontend Hosting:** Vercel
- **Domain Registrar:** Namecheap
- **Domain:** rootedvitality.com

### Communication
- **Email Service:** SendGrid (transactional emails)
- **Email Rate Limit:** 100/day (free tier)

### Development & AI
- **AI Assistant:** Claude (GitHub Copilot alternative)
- **Search Engine:** Google

---

## Development Tools (Monthly Cost)

| Tool | Cost | Purpose | Status |
|------|------|---------|--------|
| VS Code GitHub Copilot | $20/mo | Code completion & generation | Essential |
| Claude Pro / ChatGPT Plus | $40/mo | Architecture decisions & complexity | Recommended |
| Copilot Pro (optional) | $20/mo | Extended context | Optional |
| **Dev Tools Total** | **$60-80/mo** | | |

---

## Infrastructure & Hosting (Monthly Cost)

| Tool | Cost | Purpose | When to Upgrade |
|------|------|---------|-----------------|
| Supabase Free | $0 | Database, auth, storage | Scale to 1K+ users |
| Supabase Pro | $25/mo | Unlimited auth emails, larger DB | **Critical at 1K+ users** |
| Vercel Free | $0 | Frontend hosting | For MVP/testing |
| Vercel Pro | $20/mo | Auto-scaling, edge functions | Scale to 1K+ users |
| Cloudflare Free | $0 | DNS, CDN basics | Initial deployment |
| Cloudflare Enterprise | $200/mo | DDoS, WAF, full CDN | **At 10K+ users** |
| **Infrastructure Total** | **$0-245/mo** | | |

---

## Communication & Email (Monthly Cost)

| Tool | Cost | Purpose | Notes |
|------|------|---------|-------|
| SendGrid Free | $0 | 100 transactional emails/day | Backup; Supabase often sufficient |
| SendGrid Paid | $20/mo | Unlimited emails | Optional upgrade |
| Google Workspace (per user) | $14/user/mo | Staff email + Drive + support | Start with 5 users = $70/mo |
| Twilio SMS | $0-50/mo | SMS alerts, 2FA, notifications | Pay-as-you-go, optional |
| **Communications Total** | **$0-120/mo** | | |

---

## Domain & Security (Annual + Monthly)

| Item | Cost | Purpose | Notes |
|------|------|---------|-------|
| Domain Registration (.com) | $12-15/yr | rootedvitality.com | Namecheap: ~$1/mo avg |
| SSL/TLS Certificate | Free | HTTPS encryption | Via Vercel/Cloudflare |
| GDPR/Compliance Legal Review | $2,000-5,000 (one-time) | Legal setup before launch | **Must-have** |
| 1Password/LastPass Team | $10/mo | Credential management | For 5+ team members |
| **Security Total** | **$11-15/mo + legal** | | |

---

## Monitoring & Analytics (Monthly Cost)

| Tool | Cost | Purpose | Recommended |
|------|------|---------|-------------|
| Google Analytics 4 | Free | User behavior tracking | Essential, always included |
| Sentry Free | $0 | Basic error tracking | For MVP |
| Sentry Pro | $29/mo | Full error tracking + alerts | **Critical at production** |
| LogRocket | $99/mo | User session recording | For UX debugging, optional |
| Datadog APM | $15/mo | Application performance | Optional at scale |
| **Monitoring Total** | **$0-143/mo** | | Sentry $29 essential |

---

## Team & Project Management (Monthly Cost)

| Tool | Cost | Purpose | Notes |
|------|------|---------|-------|
| GitHub Free | $0 | Version control | Sufficient for MVP |
| GitHub Pro | $4/user/mo | Private repos + CI/CD | Recommended for teams |
| Slack Free | $0 | Team chat | Free tier sufficient initially |
| Slack Pro | $8/user/mo | Full history + integrations | Upgrade as team grows |
| Linear / GitHub Issues | $0-14/mo | Issue tracking | GitHub Issues free, Linear paid |
| Figma Free | $0 | Design basics (Figma Community) | Free tier for basics |
| Figma Team | $12/mo | Team collaboration | Optional |
| **Team Tools Total** | **$0-50/mo** | | |

---

## Marketing & Growth (Monthly Cost)

| Tool | Cost | Purpose | Notes |
|------|------|---------|-------|
| Mailchimp Free | $0 | Newsletter (up to 500 contacts) | Start free |
| Mailchimp Paid | $20-350/mo | Advanced campaigns | Scales with subscribers |
| Google Ads | $10-100+/mo | PPC advertising | Budget-dependent |
| Facebook/Instagram Ads | $10-100+/mo | Social advertising | Budget-dependent |
| Zapier Free | $0 | Basic workflow automation | Free tier: 2 Zaps |
| Zapier Paid | $19-99/mo | Advanced automation | Connect tools together |
| **Marketing Total** | **$0-550+/mo** | | Start lean, scale with revenue |

---

## Storage & Backup (Monthly Cost)

| Tool | Cost | Purpose | Notes |
|------|------|---------|-------|
| Supabase Storage | Included | User files, credentials, photos | Included in Supabase tier |
| AWS S3 (if separate) | $0.023/GB/mo | Large-scale file storage | Not needed initially |
| Backblaze B2 | $6/mo | Database backup/disaster recovery | Cheap insurance |
| **Storage Total** | **$6/mo** | | |

---

## One-Time Startup Costs

| Item | Cost | Purpose |
|------|------|---------|
| Legal Review (GDPR/ToS/Privacy) | $2,000-5,000 | **Must before launch** |
| Branding/Logo Refinement | $500-2,000 | Optional (have brand already) |
| Domain Registration (multi-year) | $12-50 | Initial setup |
| **Total Startup** | **$2,500-7,050** | Budget $5,000 safe |

---

## Budget Scenarios

### MVP Phase (< 100 users)
```
Development:          $20   (Copilot only)
Infrastructure:       $0    (All free tiers)
Communication:        $0    (Gmail free)
Domains:              $1
Monitoring:           $0
────────────────────────────
MONTHLY TOTAL:        $21/mo
ONE-TIME:             $2,500-5,000 (legal)
```

### Growth Phase (100-1K users)
```
Development:          $60   (Copilot + Claude)
Infrastructure:       $45   (Vercel Pro + Supabase Pro)
Communication:        $70   (Google Workspace 5 users)
Domains:              $5
Monitoring:           $29   (Sentry)
Team Tools:           $30   (GitHub + Slack)
Marketing:            $50
────────────────────────────
MONTHLY TOTAL:        $289/mo
```

### Production Phase (1K-10K users)
```
Development:          $80
Infrastructure:       $265  (Vercel Pro + Supabase Pro + Cloudflare)
Communication:        $140  (Google Workspace 10 users)
Domains:              $10
Monitoring:           $143  (Sentry + Datadog + LogRocket)
Team Tools:           $50
Marketing:            $200
Security/Legal:       $50
────────────────────────────
MONTHLY TOTAL:        $938/mo
```

### Enterprise Phase (10K+ users)
```
Development:          $100
Infrastructure:       $465  (With Cloudflare Enterprise)
Communication:        $250
Domains:              $20
Monitoring:           $200
Team Tools:           $100
Marketing:            $500+
Security/Legal:       $100
────────────────────────────
MONTHLY TOTAL:        $1,735+/mo + revenue share
```

---

## Scaling Checklist

### Must-Have at 1K+ Users
- ✅ Supabase Pro ($25) — Unlimited auth emails
- ✅ Vercel Pro ($20) — Handle traffic spikes
- ✅ Sentry ($29) — Catch production bugs
- ✅ Google Workspace ($70) — Professional email

### Should-Have at 5K+ Users
- ⚠️ Cloudflare ($200) — DDoS protection + performance
- ⚠️ Datadog/LogRocket — Performance monitoring
- ⚠️ Dedicated support tier

### Nice-to-Have (Revenue-Dependent)
- 🎯 Marketing tools (Mailchimp, ad budgets)
- 🎯 Premium LLM tier for AI features
- 🎯 Advanced analytics platforms

---

## Revenue Model (To Offset Costs)

### At 1K Active Practitioners
- **Membership Fee:** $29/mo per practitioner = $29,000/mo gross
- **Platform Fee:** 10% of bookings or $5/booking = Variable
- **Monthly Expenses:** ~$289/mo
- **Net Profit Potential:** ~$28,700/mo

### At 10K Practitioners
- **Gross Revenue:** $290,000/mo + booking fees
- **Monthly Expenses:** ~$1,735/mo
- **Net Profit Potential:** ~$288,265/mo

---

## Launch Recommendations

1. **Start MVP at $21/mo** — Validate product with free tier tools
2. **Supabase Pro at 1K users** — Non-negotiable for email verification at scale
3. **Don't skimp on email** — Failed signups = lost users; invest in reliability
4. **Monitor from day one** — Sentry $29/mo catches bugs before users report them
5. **Budget for legal early** — GDPR/compliance is not optional before launch
6. **Scale infrastructure first** — Vercel/Cloudflare before marketing spend
7. **Automate workflows** — Zapier + Mailchimp reduce manual effort
8. **Document all decisions** — Future team will inherit these choices

---

## Planned Additions (Future)

- **Payment Processing:** Stripe (practitioner payments, lead charges)
- **Video Consultations:** Zoom API or Whereby
- **Advanced Search:** Algolia or Elasticsearch
- **SMS Notifications:** Twilio
- **Advanced Analytics:** Mixpanel or Segment

---

**Last Updated:** November 6, 2025  
**Status:** MVP Ready ($21/mo) → Production Ready ($1,735+/mo)  
**Deployment:** Vercel (auto-deploy on push) + Manual Supabase migrations
