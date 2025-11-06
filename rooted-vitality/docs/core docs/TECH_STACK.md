# Rooted Vitality - Tech Stack

## Core Infrastructure
- **Backend Database:** Supabase (PostgreSQL + Auth)
- **Hosting:** Vercel (Frontend)
- **Domain Registrar:** Namecheap

## Frontend
- **Editor:** VS Code
- **Languages:** HTML, CSS, JavaScript (Vanilla)
- **Framework:** None (planned React upgrade)

## Authentication & Email
- **Auth Provider:** Supabase Auth (Email/Password)
- **Email Service:** SendGrid (Transactional emails)
- **Email Rate Limit:** 100 emails/day (free tier)

## Development & AI
- **AI Assistant:** Claude (GitHub Copilot alternative)
- **Search Engine:** Google

## Planned Additions (Future Scaling)
- **Payment Processing:** Stripe (practitioner payments, lead charges)
- **Analytics:** Mixpanel or Segment
- **Monitoring:** Sentry (error tracking)
- **CDN:** Cloudflare
- **Email (Pro):** SendGrid upgraded plan or AWS SES
- **Messaging:** Twilio (SMS verification, notifications)
- **Storage:** AWS S3 (profile images, documents)
- **Search:** Algolia or Elasticsearch
- **Video:** Zoom API or Whereby (consultations)

## Current Costs (Monthly)
- Supabase: Free tier
- Vercel: Free tier
- Namecheap: ~$10 (domain)
- SendGrid: Free tier
- **Total: ~$10/month**

## Deployment Pipeline
1. VS Code → Local testing
2. GitHub (planned) → Version control
3. Vercel → Auto-deploy on push
4. Supabase → Database migrations manual

---
**Last Updated:** October 30, 2025
**Status:** MVP Phase - 1 service type (Client signup)
