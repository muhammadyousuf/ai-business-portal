# AI Customer Engagement & Order Automation Platform

> Working name **AssistFlow** (placeholder, decide before launch). Repo folder
> is still `ai-business-portal`.

A multi-tenant SaaS that gives any small business an AI assistant on its
website, WhatsApp, Messenger and Instagram. The assistant answers customer
questions from the business's own data (menu, prices, delivery areas, FAQs,
documents), collects orders, bookings and inquiries, and notifies the owner by
WhatsApp and email. The owner confirms. You, the platform owner, run it all
from a separate admin portal: businesses, plans, payments, invoices, every
conversation and order, AI usage and audit logs.

> **Status (2026-11-13): Phase 1 implemented and tested.** Admin portal,
> client portal, backend API, embeddable chatbot, MongoDB data layer and
> Supabase authentication are working end to end. Design: `PHASE_1_DESIGN.md`.
> Manual test guide with expected results: `PHASE_1_TESTING.md`.
> Architecture of the four projects: `docs/architecture.md`.
>
> Quick start (four terminals after one `pnpm install` at the root):
> `brew services start mongodb-community` · `pnpm --filter @assistflow/backend db:seed`
> · `pnpm dev:backend` (:4000) · `pnpm dev:user` (:3000) · `pnpm dev:admin` (:3001) · `pnpm dev:bot` (:5173).
> Admin login: muhammadyousuf327@gmail.com (seeded). Do not run `pnpm build` in an app while its
> `pnpm dev` is running (shared `.next` folder).

---

## 1. Main goal

Build a **part-time business** (2–3 hours per day, under Rs. 10,000 initial
spend) that reaches **8–10 lakh PKR per month** gross via monthly
subscriptions from businesses in Pakistan and English-speaking markets.

| Customers | Average plan | Monthly gross (Rs. 280/USD, illustrative) |
|---:|---:|---:|
| 10 | $49 | Rs. 137,200 |
| 25 | $49 | Rs. 343,000 |
| 50 | $49 | Rs. 686,000 |
| **60–72** | **$49** | **Rs. 8.2–9.9 lakh** |

Gross, before AI API usage, WhatsApp fees, hosting, payment fees, support and
tax. Targets, not guarantees.

### Milestones

| Stage | When | Deliverable |
|---|---|---|
| Build & validate | Months 1–2 | Website widget, business portal, knowledge base, orders, email alerts, **3 pilot businesses** |
| Monetise & expand | Months 3–4 | WhatsApp, subscription billing, usage limits, industry templates, **5–10 paying** |
| Scale | Months 5–6+ | Messenger + Instagram, agency partnerships, analytics, churn work |

---

## 2. What we are building

### 2.1 Core promise

**Never miss a customer inquiry, order or booking.** A business connects its
channels, adds its products, services, FAQs and policies, and gets an AI
assistant that answers around the clock and hands the actual decision
(confirm the order, accept the booking) to a human.

### 2.2 Three portals

| Portal | Who | URL (planned) | What they do |
|---|---|---|---|
| **Platform Super Admin** | You | `admin.<domain>` | Register/approve/suspend businesses, plans and prices, subscriptions, payments, invoices, credit notes, all conversations and orders (role-gated, audited), AI usage and cost per business, reports, support tickets, announcements, staff roles, audit logs |
| **Business Owner** | Restaurant, bakery, school, clinic, shop | `app.<domain>/<business>` | Dashboard, orders (confirm/reject/status), unified inbox with AI ↔ human takeover, customers (CRM), menu/products, knowledge base (FAQs, delivery zones, hours, documents), assistant settings and handover rules, channels, staff and permissions, reports and "ask your business" analyst, billing |
| **Customer experience** | The business's customers | Widget on their site; WhatsApp, Messenger, Instagram | Ask questions, get prices and availability, submit an order/booking/inquiry, receive confirmation updates. No login |

Order values belong to the business. Platform revenue (subscriptions,
invoices) is kept in separate collections and workflows.

### 2.3 Modules

1. **AI assistant**: FAQs and natural-language questions, customer's language,
   business-specific data, escalation to staff.
2. **Unified inbox**: website, WhatsApp, Messenger, Instagram; assignment,
   takeover, resolve.
3. **Orders & bookings**: capture details, validate items/prices/zones,
   notify, track pending → confirmed → completed.
4. **Knowledge base**: FAQs, products/services and prices, hours, policies,
   delivery zones, PDF/DOCX uploads. Owner edits without a developer.
5. **CRM**: customer profiles built from conversations and orders, tags,
   notes, history.
6. **Analytics**: conversations, AI resolution rate, handovers, orders,
   top questions, unanswered questions; AI business analyst over recorded data.
7. **Subscription & usage**: plans, AI-reply and channel limits, status,
   invoices, upgrade/downgrade, usage alerts.

### 2.4 Industry templates (same core, different knowledge and actions)

| Industry | Assistant answers about | Business action |
|---|---|---|
| Restaurant (**first demo**) | Menu, prices, delivery areas | Order request |
| Bakery | Cakes, sizes, customisation | Cake booking |
| School | Admission, fees, courses, documents | Admission inquiry |
| Clinic | Doctors, timings, fees | Appointment request |
| Ecommerce | Products, stock, shipping | Order request |
| Electrical / wholesale | Specs, brands, prices, stock | Quotation |
| Real estate | Property details, location | Viewing request |

Go-to-market: Phase 1 restaurants, bakeries, ecommerce. Phase 2 schools,
clinics, services. Phase 3 electrical, hardware, wholesale.

### 2.5 Pricing (hypothesis, adjust after pilots)

| Plan | Monthly | AI replies | Channels | Seats |
|---|---:|---:|---:|---:|
| Starter | $19 | 300 | 1 (website) | 1 |
| Growth | $49 | 1,000 | 2 (+WhatsApp) | 3 |
| Pro | $99 | 3,000 | 4 | 10 |
| Business | $199 | 10,000 | 4 | 25 |

Rules: monthly subscription only, 14-day trial, **never unlimited AI replies
or messages**, PKR plans priced for the local market rather than converted,
14-day grace period then auto-suspend, invoices immutable (credit notes for
corrections). "AI reply" = one AI-generated response to one customer message.

---

## 3. How the AI works (and is kept honest)

- **Retrieval (RAG)** over the business's FAQs and documents for open
  questions, with handover when confidence is low.
- **Tools, not guesses**, for anything factual: `searchProducts`,
  `getProductPrice`, `checkDeliveryAvailability`, `calculateDeliveryCharges`,
  `createOrderRequest`, `requestAppointment`, `handoverToHuman`. Prices,
  stock, zones and slots always come from the database.
- **Workflow**: customer inquiry → AI response → order/booking request →
  owner notification (WhatsApp + email) → human confirmation → customer
  update. Request and acceptance are separate states.
- **Handover rules** (per business): confidence < 60%, policy exception,
  complaint, large order, "I want a human", repeated unknown question.
- **Tenant isolation**: every query is scoped by `businessId` server-side.
  Admin access to customer data is role-gated, masked for support staff, and
  written to the audit log.

---

## 4. Technical design (budget-first)

### 4.1 Stack

| Layer | Choice | Cost at start | Notes |
|---|---|---|---|
| Frontends | **Next.js 15 (App Router) + TypeScript**, two apps (`user/`, `admin/`) | Free | Share `@assistflow/shared` design system |
| Backend | **Express + TypeScript** (`backend/`), modular monolith | Free tier host | REST API, webhooks, AI service, jobs |
| UI | Tailwind v4 + shadcn-style components | Free | Done, see `docs/design.md` |
| Database | **MongoDB Atlas M0** + Mongoose + Zod | Free | `businessId` on every tenant collection |
| Knowledge search | **Atlas Vector Search** | Free on M0 | Embeddings stored with chunks |
| Auth | **Supabase Auth** (auth only; data stays in Mongo) | Free to 50k MAU | Magic link + Google. Backend verifies the Supabase JWT and maps it to roles: super_admin, support, finance, owner, manager, agent. Decided 2026-11-11 over Clerk and Auth.js on cost |
| AI | Anthropic or OpenAI API, cheapest capable model per task | Usage | Small model for FAQ/price/order flows, mid model for complaints and analyst questions |
| Website widget | `bot/`: Vite + React, Shadow DOM, one `<script>` tag → `widget.js` on a CDN | Free | Talks to `/v1/bot/*`; works today against the rule-based responder |
| WhatsApp | WhatsApp Business Cloud API | Per message | Phase 2. Template approval takes days; say so in onboarding |
| Messenger / Instagram | Meta Messenger + Instagram Messaging APIs | Free API | Phase 3, needs app review |
| Email | Resend | 3,000/mo free | Order alerts, invoices, magic links |
| Files | Cloudflare R2 | 10 GB free | Knowledge documents |
| Jobs | Netlify scheduled functions + Mongo job collection; BullMQ + Redis only when needed | Free | Renewals, invoice generation, retries, daily summaries |
| Payments | Stripe (international) + bank transfer (Pakistan) | Per transaction | Add at first paying customer |
| Hosting | Netlify free (demo) → paid when customers pay | Free | Vercel Hobby forbids commercial use |
| Monitoring | Sentry developer tier | Free | |
| Domain | Porkbun / Namecheap | ~Rs. 3,000/yr | Only paid item at start |

### 4.2 Initial budget

| Item | Cost |
|---|---:|
| Domain | Rs. 2,000–3,000 |
| AI API testing | Rs. 2,000–3,000 |
| Contingency | Rs. 2,000–4,000 |
| Everything else (Atlas, Netlify, R2, Resend, GitHub, Sentry) | Rs. 0 |
| **Total** | **≈ Rs. 6,000–10,000** |

No paid ads, logo design, VPS, n8n Cloud, Redis hosting or Meta messaging
costs until a customer is paying.

### 4.3 Architecture

```text
Customer channels: website widget · WhatsApp · Messenger · Instagram
        │
        ▼
Channel integration layer (widget API · Meta webhooks · WhatsApp Cloud API)
        │
        ▼
Next.js app (route handlers / server actions)
  ├── Auth.js session + role guard + tenant guard (businessId on every query)
  ├── Conversations · Orders · Knowledge · CRM · Billing · Admin
  ├── AI service: retrieval (Atlas Vector Search) + tool calls (DB lookups)
  └── Notifications: Resend email · WhatsApp templates (retry + delivery log)
        │
        ▼
MongoDB Atlas (M0)                Cloudflare R2 (documents)
```

### 4.4 Collections (first cut)

Platform: `users`, `roles`, `subscription_plans`, `subscriptions`, `payments`,
`invoices`, `credit_notes`, `coupons`, `support_tickets`, `announcements`,
`audit_logs`, `usage_records`.

Per business (all carry `businessId`): `businesses`, `memberships`,
`channel_integrations`, `products`, `services`, `categories`,
`delivery_zones`, `faqs`, `knowledge_documents`, `knowledge_chunks`
(vector index), `customers`, `conversations`, `messages`, `orders`,
`appointments`, `notifications`.

### 4.5 Repository layout

pnpm workspace. Each app is independently runnable and deployable; `shared/`
is linked, not published.

```text
ai-business-portal/
├── admin/                   Next.js · Platform Super Admin portal · port 3001
│   └── app/                 /, businesses/[id], plans, revenue, invoices/[id], conversations, orders, ai-usage, reports, support, audit, settings
├── user/                    Next.js · Business portal + landing + sign-in · port 3000
│   ├── app/                 /, sign-in, [business]/{orders,inbox,customers,catalog,knowledge,assistant,channels,staff,reports,billing,settings}
│   └── components/business/ conversation thread, order card
├── backend/                 Express + TypeScript API · port 4000
│   └── src/{config,db,middleware,ai,modules/*}   (modules/bot is live; others list planned routes)
├── bot/                     Vite · embeddable widget → dist/widget.js · playground on 5173
│   └── src/{embed.ts,config.ts,api/client.ts,widget/*}
├── shared/                  @assistflow/shared · ui, components, layout, dashboard, lib, mock, styles
├── docs/                    architecture.md, design.md, chatgpt-planning-conversation.md
└── package.json, pnpm-workspace.yaml
```

---

## 5. What has been implemented

### Phase 1 (2026-11-13), see `PHASE_1_DESIGN.md` and `PHASE_1_TESTING.md`

- **Backend** (`backend/`): Express + TypeScript on MongoDB; Supabase JWT verification (ES256 via JWKS, HS256 via legacy secret or cached auth-server check); 23 Mongoose collections; organization isolation by UUID on every tenant query; roles owner/member with owner-only guards; dynamic categories with a module vocabulary; branches, catalog, staff, chatbot config and Q&A; public bot API (config, sessions, messages, polling, contact); rule-based responder (Q&A matching, catalog/branch/staff lookups, order, appointment and inquiry intents, handover, unanswered log); inbox (takeover, reply, hand back, close); order/appointment/inquiry status flows with system messages; invitations (hashed single-use tokens, email via Supabase, in-app for existing users, server-side signup for new users); notifications with preferences; activity log; uploads with magic-byte validation to local disk or Cloudinary; rate limits; admin monitoring API. 28 API tests.
- **Admin portal** (`admin/`): login, forgot/reset password, dashboard, organizations with full read-only drill-down, category management, users, cross-organization conversations/orders/appointments/inquiries, activity log, notifications, account settings with photo upload and preferences.
- **Client portal** (`user/`): signup that creates the organization, login, forgot/reset password, organization chooser, dashboard with getting-started checklist, branches with hours, catalog with images, staff with availability, chatbot Q&A + settings + install snippet + unanswered questions, inbox with polling and manual replies, orders/appointments/inquiries with status flows, members and invitations, organization settings (logo, allowed origins, key rotation, delete), notifications, account settings.
- **Widget** (`bot/`): Shadow DOM embed, session resume, contact form, staff-reply polling, closed state, disabled state, playground page.

### Earlier milestones

- [x] Business research and model selection (ChatGPT planning chat, Oct 2026,
      full transcript in `docs/chatgpt-planning-conversation.md`).
- [x] Product decision: multi-tenant AI customer engagement platform with
      three portals; market Pakistan + international; monthly subscription;
      website first, then WhatsApp, then Meta channels.
- [x] Next.js 15 + TypeScript + Tailwind v4 scaffold, ESLint, pnpm.
- [x] Design system: OKLCH tokens, per-business accent, shadcn-style primitives.
- [x] **Super Admin portal** (13 screens): dashboard, businesses + detail,
      plans/subscriptions/coupons, payments & revenue, invoices + printable
      invoice, all conversations, all orders, AI usage & monitoring, reports,
      support & announcements, audit log, settings & roles.
- [x] **Business portal** (16 screens): dashboard, orders + detail with
      status stepper and notification log, inbox with AI/human takeover,
      customers + detail, menu/products, knowledge base (FAQs, zones, hours,
      documents), assistant settings and handover rules, channels and widget
      snippet, staff and permissions, reports and business analyst, billing,
      settings.
- [x] **Customer experience**: demo restaurant website with an interactive
      scripted chat widget (delivery check → price → order → confirmation).
- [x] Landing page and sign-in.
- [x] **Step 1 restructure (2026-11-10):** code split into `admin/`, `user/`,
      `backend/`, `bot/` and `shared/`; backend scaffolded with middleware,
      module route maps and a live bot API; widget rebuilt as a standalone
      Shadow DOM embed with a playground; `docs/architecture.md` written.

Not started (Phase 2+): AI-generated answers behind the responder interface,
email delivery of notifications, WhatsApp/Meta channels, billing and
subscriptions, email verification on signup, SSE streaming, widget CDN
publishing, mobile navigation drawer in the portals.

---

## 6. Roadmap (16 weeks at 15–18 h/week)

| Weeks | Focus | Deliverable |
|---|---|---|
| 1–2 | Auth, roles, business registration, tenant isolation, profile | Multi-tenant foundation |
| 3–4 | FAQs, products, pricing, hours, zones, document upload, retrieval | Business knowledge base |
| 5–6 | Chat API, business context, RAG, price/zone tools, unknown handling | Working AI assistant |
| 7–8 | Embeddable widget, config, storage, mobile, handover | First usable product |
| 9–10 | Customer details, order creation, statuses, email alerts, dashboard | Complete order workflow |
| 11–12 | WhatsApp Cloud API, webhooks, templates, delivery logs | Website + WhatsApp |
| 13–14 | Plans, limits, billing, trial/expiry, analytics, admin dashboard | Subscription-ready SaaS |
| 15–16 | Security + isolation tests, AI accuracy, onboarding, 3 pilots | Paid-pilot-ready MVP |

Messenger and Instagram follow in the next phase. Feature priority from the
plan: MVP = three portals + auth, registration + isolation, profile +
products + FAQs, chatbot + widget, orders + conversations, email
notifications, plans + invoices. Phase 2 = WhatsApp, CRM + staff, Meta
channels. Phase 3 = reports + AI analyst, campaigns + loyalty. Phase 4 =
workflow builder, voice, white label, API.

### Sales plan (first 30 days after MVP)

| Activity | Target |
|---|---:|
| Businesses researched (Google Maps, directories, sites without live chat) | 100 |
| Personalised outreach, with a demo built from *their* menu or catalog | 60 |
| Demo conversations | 10 |
| Pilot businesses | 3 |
| Paying customers | 1–3 |

Channels: direct outreach, personalised demos, Upwork/Fiverr/LinkedIn,
web and marketing agency partnerships.

---

## 7. KPIs, risks, principles

**KPIs:** AI resolution rate, human handover rate, order conversion, response
time, unanswered rate, monthly active businesses, churn, gross margin.

| Risk | Mitigation |
|---|---|
| AI quotes a wrong price | Database-backed lookups only |
| AI invents an answer | Confidence threshold + handover |
| WhatsApp integration fails | Webhook logs, retries, delivery status |
| Business data leaks across tenants | Server-side `businessId` scoping, isolation tests |
| AI cost eats margin | Per-plan limits, caching, small models, usage dashboard |
| Missed notifications | Queue, retries, failed-delivery alerts |
| Staff never confirms | Pending-order reminders at 10 minutes |
| Industries differ | Templates + configurable workflows |

**Principles:** AI proposes, a human confirms. Costs follow the customer
(limits in every plan). Website first, channels later. Synthetic data only in
demos. Schools and clinics bring personal data, so minimise collection and
build retention/deletion controls from the start.

---

## 8. References

- Planning conversation: "AI Automation Revenue Strategy" (ChatGPT, Oct 2026),
  `docs/chatgpt-planning-conversation.md`. Turns 6–9 define this product.
- MongoDB Atlas + Vector Search: https://www.mongodb.com/docs/atlas/
- WhatsApp Business Platform: https://developers.facebook.com/docs/whatsapp/
- Meta Messenger / Instagram messaging: https://developers.facebook.com/docs/messenger-platform/
- Netlify Next.js: https://docs.netlify.com/frameworks/next-js/
- Resend: https://resend.com/pricing · Cloudflare R2: https://developers.cloudflare.com/r2/pricing/
