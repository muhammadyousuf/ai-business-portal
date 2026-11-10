# Architecture

How the four components of AssistFlow fit together, how the bot gets onto a
customer's website, and how everything is deployed. This is the Step 1
deliverable: structure first, design changes later.

## 1. Components

| # | Folder | What it is | Who uses it | Runs on |
|---|---|---|---|---|
| 1 | `admin/` | Platform Super Admin portal (Next.js) | You and platform staff | `admin.<domain>` · port 3001 |
| 2 | `user/` | Business portal + landing + sign-in (Next.js) | Restaurants, hotels, schools, shops | `app.<domain>` · port 3000 |
| 3 | `backend/` | REST API, channel webhooks, AI service, notifications, billing jobs (Express + TypeScript) | All of the above | `api.<domain>` · port 4000 |
| 4 | `bot/` | Embeddable chat widget, one `<script>` tag, Shadow DOM (Vite + React) | The business's own customers | `cdn.<domain>/widget.js` · playground on port 5173 |
| – | `shared/` | Design system, utils, types, temporary mock fixtures (workspace package) | admin + user | not deployed |

Each of the three apps and the bot has its own `package.json`, dev server,
build and deployment. The root is a pnpm workspace only so one `pnpm install`
covers everything and `shared/` can be linked without publishing it.

```
ai-business-portal/
├── admin/      Next.js app   (routes: /, /businesses, /plans, /revenue, /invoices, /conversations, /orders, /ai-usage, /reports, /support, /audit, /settings)
├── user/       Next.js app   (routes: /, /sign-in, /<business>/… orders, inbox, customers, catalog, knowledge, assistant, channels, staff, reports, billing, settings)
├── backend/    Express API   (/health, /v1/bot/*, /v1/admin/*, /v1/<module>/*, /webhooks/*)
├── bot/        Vite widget   (src/embed.ts → dist/widget.js, index.html playground)
├── shared/     @assistflow/shared (src/ui, components, layout, dashboard, lib, mock, styles)
├── docs/       this file, design.md, chatgpt-planning-conversation.md
├── package.json, pnpm-workspace.yaml
```

## 2. How they talk

```
                 ┌──────────────┐        ┌──────────────┐
                 │  admin app   │        │   user app   │
                 │  (Next.js)   │        │  (Next.js)   │
                 └──────┬───────┘        └──────┬───────┘
                        │ HTTPS JSON, session cookie / JWT
                        ▼                       ▼
┌────────────┐   ┌──────────────────────────────────────────┐   ┌───────────────┐
│  Customer  │   │               backend (API)              │   │ MongoDB Atlas │
│  website   │   │  /v1/admin/*   platform roles            │◄─►│ + Vector      │
│ + widget.js│──►│  /v1/<module>  business roles, businessId│   │   Search      │
│            │   │  /v1/bot/*     public key + visitor token│   └───────────────┘
└────────────┘   │  /webhooks/*   WhatsApp, Meta            │   ┌───────────────┐
      ▲          │  ai/           retrieval + tools         │◄─►│ LLM API, R2,  │
      │          │  notifications email + WhatsApp          │   │ Resend, Meta  │
      └──────────┴──────────────────────────────────────────┘   └───────────────┘
                 WhatsApp / Messenger / Instagram ──► /webhooks/*
```

- The two portals never read the database directly. They call the backend
  with the signed-in user's token. (Today they render `shared/mock`; replacing
  those imports with API calls is the next step.)
- Every tenant query is pinned to a `businessId` on the server
  (`backend/src/middleware/tenant.ts`). Platform admins get access to a
  business only through an explicit header, and that access is audited.
- The bot never gets a user login. It gets a **public widget key** (identifies
  the business) and a **visitor session token** (identifies the conversation).
- Messaging channels (WhatsApp, Messenger, Instagram) arrive as webhooks into
  the same conversation and responder pipeline the widget uses. The channel is
  just a different transport.

## 3. Backend layout and API map

```
backend/src/
  server.ts, app.ts              bootstrap, route mounting (see app.ts for middleware order)
  config/env.ts                  typed environment
  db/mongo.ts                    Atlas connection; fixtures when no URI
  middleware/
    auth.ts                      session / JWT → req.user {id, role, businessId?}
    tenant.ts                    pins req.businessId; audits admin cross-tenant access
    cors.ts                      portal allowlist; per-business allowed origins for the bot
    rate-limit.ts                public bot endpoints
    error.ts                     zod + HttpError → JSON
  ai/
    provider.ts                  complete({system, messages, tools}) boundary
    tools.ts                     the only functions the model may call
  modules/
    bot/                         LIVE: config, sessions, messages (rule-based responder, swap for ai/)
    auth, businesses, catalog, knowledge, conversations, orders, customers, billing, admin, channels
                                 each router.ts lists its planned routes and answers 501 until built
    notifications/service.ts     owner alerts (email + WhatsApp) with delivery log and retries
```

| Prefix | Auth | Used by |
|---|---|---|
| `/health` | none | uptime checks |
| `/v1/bot/:businessKey/config` · `POST …/sessions` · `POST …/messages` · `GET …/sessions/:id/messages` | widget key in URL + `Authorization: Bearer <visitor token>` | bot |
| `/webhooks/whatsapp`, `/webhooks/meta` | provider signature | WhatsApp Cloud API, Meta |
| `/v1/auth/*` | none / magic link | user + admin apps |
| `/v1/admin/*` | platform roles (`super_admin`, `support`, `finance`) | admin app |
| `/v1/businesses`, `/v1/catalog`, `/v1/knowledge`, `/v1/conversations`, `/v1/orders`, `/v1/customers`, `/v1/billing`, `/v1/channels` | business roles (`owner`, `manager`, `agent`), tenant-scoped | user app |

The full planned route list per module is in each `router.ts` (and returned by
the 501 response), so the API surface is visible before it is implemented.

## 4. The bot in the real world

### 4.1 How a business owner installs it (no technical knowledge)

1. In the business portal, **Channels → Website widget**, they see a
   two-line snippet with their key already filled in and a **Copy** button:
   ```html
   <script src="https://cdn.assistflow.app/widget.js" data-business="pk_live_…" data-api="https://api.assistflow.app" async></script>
   ```
2. They paste it into their site. We give platform-specific one-click
   instructions next to the snippet:
   - **WordPress**: Appearance → Theme File Editor → `footer.php`, or the
     "Insert Headers and Footers" plugin (paste in Footer).
   - **Shopify**: Online Store → Themes → Edit code → `theme.liquid`, paste
     before `</body>`.
   - **Wix / Squarespace / Webflow / Wix**: Settings → Custom Code → Footer.
   - **Google Sites / no access**: we offer a **hosted chat page**
     (`chat.<domain>/<business>`) and a **QR code**; they link to it from
     their site, Instagram bio or print it on the menu.
   - **"Do it for me"**: on Growth and above we install it on a support
     ticket (the site owner gives temporary access, logged in the audit trail).
3. The portal verifies installation: the widget pings `/v1/bot/:key/config`
   from the site's origin; Channels shows "Installed, last seen 2 min ago".
   Until the origin is registered the widget still loads (so they can test),
   but orders are flagged "unverified site" in the inbox.

No build step, no npm, no iframe code to size, nothing per page: the loader
adds itself to the page body and stays out of the way.

### 4.2 What the visitor sees

- A **launcher pill** bottom-right (or bottom-left), in the business's brand
  colour with their name: "Chat with us". It never auto-opens except on a
  page the owner marks (e.g. the Order page), and never covers the host
  site's own buttons more than a 56px pill would.
- Clicking opens a **380×560 panel**: header with the business name and
  "Replies in seconds · 24/7", the greeting, **quick-reply chips** for the top
  questions, message bubbles, a composer. On phones it becomes a
  **full-screen sheet** with a minimise button.
- Each assistant answer carries a small **tool tag** ("looked up menu
  price", "checked delivery zones", "created order request") so the visitor
  and the owner both see that facts came from data, not guesses.
- The order flow is a conversation, not a form: items → delivery check →
  total → "share your name, phone, address" → "request #1048 received, the
  restaurant will call you". The footer always says a human confirms.
- Closing and reopening resumes the same conversation (session token in
  `localStorage`); returning tomorrow starts fresh after the backend's
  session TTL (24h).
- Unknown or sensitive questions end in "I'll get a person from the team",
  and the owner is notified. The widget keeps polling so the staff reply
  appears in the same thread.

### 4.3 Why Shadow DOM, not an iframe

The widget renders inside `<div id="assistflow-widget">` with an open Shadow
DOM. Host CSS cannot restyle it and our CSS cannot leak out, which is the
whole problem with "paste this chat box" scripts on WordPress themes. It also
means the widget can read the page URL (for "which page did they order
from") and the host can call `window.AssistFlow.open()` from its own
"Order now" button. If a site's Content Security Policy blocks inline
styles we fall back to an iframe build later; the API contract does not
change.

### 4.4 Bot ↔ backend protocol

```
GET  /v1/bot/{key}/config                 → { business:{name,logoText,brand,locale}, widget:{greeting,quickReplies,position,buttonLabel,poweredBy,humanConfirms} }
POST /v1/bot/{key}/sessions               { sessionId?, pageUrl, referrer }  → { sessionId, token, messages[] }     (resume if sessionId valid)
POST /v1/bot/{key}/messages   Bearer tok  { sessionId, text }                 → { reply:{text,tool?,quickReplies?,handover?,order?}, messages[] }
GET  /v1/bot/{key}/sessions/{id}/messages Bearer tok                          → { messages[] }                      (poll for staff replies)
```

- **Identity**: `key` is the business's public widget key (rotatable from
  the portal). The visitor token is random, per session, stored only in the
  browser. Nothing in the widget can reach another business's data.
- **Origin check**: `/v1/bot/*` CORS allows only the business's registered
  website origins plus dev origins, so a leaked key is useless elsewhere.
- **Rate limit**: per IP + key on the public endpoints.
- **Streaming**: v1 is request/response; a `GET …/stream` SSE endpoint is
  reserved for token streaming once the AI service is wired.
- **Payload rule**: the assistant quotes nothing it did not get from a tool
  call over the business's data. The rule-based responder in
  `backend/src/modules/bot/responder.ts` already follows this; the AI
  provider replaces it behind the same function.

### 4.5 Bot folder structure

```
bot/
  src/embed.ts          loader: read data-* options, create host + shadow root, mount, expose window.AssistFlow
  src/config.ts         option parsing and defaults
  src/api/client.ts     config / start / send / reset, localStorage session
  src/widget/App.tsx    the UI (launcher, panel, messages, quick replies, composer, powered-by)
  src/widget/styles.css scoped styles, mobile sheet at ≤480px
  src/widget/icons.tsx  inline SVGs (no icon library in the bundle)
  index.html            playground: plain-HTML restaurant site with the snippet
  demo/snippet.html     the exact snippet owners copy
  dist/widget.js        build output (IIFE, self-contained, versioned on the CDN)
```

Bundle budget: under 120 KB gzipped including React. If it grows, switch
`react` to `preact/compat` via a Vite alias; the source does not change.

## 5. Deployment

| Component | Where | Notes |
|---|---|---|
| `user/`, `admin/` | Netlify (free for the demo, Pro when paying) | Two sites from one repo, base directory per site. Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_*_URL` for cross-links. |
| `backend/` | Railway / Render / Fly free tier at first; Node 20 | Single service. Jobs (renewals, invoices, retries, daily summary) as a cron hitting `/internal/jobs/*` or the host's scheduler. Redis + BullMQ only when queue depth needs it. |
| `bot/dist/widget.js` | Cloudflare R2 + CDN (or Netlify) under `cdn.<domain>/widget.js` | Immutable versioned copies (`/v/0.1.0/widget.js`) plus a `latest` alias; businesses load `latest`, rollbacks are a pointer flip. Long cache, `stale-while-revalidate`. |
| Data | MongoDB Atlas M0 → M10 when paying | Vector Search index on `knowledge_chunks`. Backups on M10. |
| Files | Cloudflare R2 | Knowledge documents, invoice PDFs. |
| Email / WhatsApp / Meta | Resend, WhatsApp Cloud API, Meta app | Webhooks point at `api.<domain>/webhooks/*`. |
| Monitoring | Sentry (all four), backend structured logs | Widget errors are reported with the business key, never the visitor's text. |

Local development: `pnpm install` once at the root, then in four terminals
`pnpm dev:backend` (4000), `pnpm dev:user` (3000), `pnpm dev:admin` (3001),
`pnpm dev:bot` (5173). The playground at 5173 talks to the backend at 4000
and completes an order with no database.

## 6. What replaces what, in order

1. `shared/mock/*` → backend API calls from the portals (keep the types).
2. `backend/src/modules/bot/responder.ts` → `ai/provider.ts` with retrieval
   and tools; the API and the widget do not change.
3. In-memory sessions and fixtures → MongoDB collections (README §4.4).
4. Dev auth header → Auth.js sessions / JWT.
5. Widget polling → SSE stream for assistant replies and staff messages.

## 7. Decisions worth recording

- **Separate backend instead of Next.js route handlers.** Three frontends
  and webhooks share one API; keeping it out of either Next app avoids a
  portal deploy breaking the bot.
- **Workspace with a `shared/` package.** Admin and user share the design
  system. Duplicating it would drift within weeks; a published package is
  overhead a solo developer does not need.
- **Shadow DOM widget, one script tag.** The installation story is the
  product for non-technical owners. Anything that needs a developer loses
  the restaurant.
- **Public key + visitor token, not cookies.** Works across any host domain
  without third-party cookie problems.
- **Rule-based responder first.** The contract (tools, handover, order
  states) is exercised end to end before any model is involved.
