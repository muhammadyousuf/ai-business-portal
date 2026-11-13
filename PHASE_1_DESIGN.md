# Phase 1 – Design Document

Platform: **AssistFlow** (working name). Repository: `ai-business-portal`.
Date: 2026-11-13. Status: approved design, implementation in progress.

Phase 1 delivers a working, end-to-end multi-tenant platform: an Admin
Portal, a Client Portal for organizations (restaurants, hospitals, salons,
gyms, schools and any category added later), an embeddable chatbot that
answers from each organization's configured knowledge, an inbox with manual
replies, order and appointment management, notifications, and full admin
visibility. Billing, subscriptions and payments are explicitly out of scope.

---

## 1. Requirements (as specified, plus additions)

### 1.1 Admin Portal
- Login, forgot/reset password. No signup; admin accounts created manually.
- JWT-secured. First admin: `muhammadyousuf327@gmail.com` (created by seed script).
- Account settings: profile, profile picture upload, notification preferences,
  password change.
- Organization monitoring: all organizations, profiles, categories, members
  and member counts, activity, branches, menus/prices and other
  category-specific data, chatbot Q&A, conversations and every message,
  orders and appointments with statuses.
- Dynamic category management: add/edit/disable categories and their modules
  without code changes.

### 1.2 Client Portal
- Signup (creates the organization + owner), login, forgot/reset password,
  JWT-secured.
- Organization: profile, unique UUID, members, business information, branches.
- Members: owner invites by email (one or many); invitee follows a link,
  completes signup, becomes a member automatically.
- Roles: `owner`, `member`. Permission matrix in §6.
- Category-specific modules (restaurant, hospital, salon, gym, school).
- Chatbot configuration: Q&A CRUD, greeting, fallback, appearance, embed
  snippet.
- Inbox: conversations, full history, branch, bot/customer/staff messages,
  manual reply, take over, hand back, close, statuses, activity.
- Orders (restaurant): view, confirm, update status, complete, cancel; linked
  to the conversation. Appointments (hospital, salon, gym) and inquiries
  (school admissions, gym membership, general): request, confirm, complete,
  cancel.
- Notifications: in-app, with preferences.

### 1.3 Chatbot
- One `<script>` tag works on any website.
- Identifies the organization by widget key, loads config and Q&A, answers
  from configured data with a fallback, stores the conversation, supports
  human takeover, keeps working without any AI provider.

### 1.4 Security
- JWT middleware; protected admin and client APIs; organization-level
  isolation; role-based authorization; owner-only actions; hashed, expiring,
  single-use invitation tokens; secure password reset; input validation;
  consistent error handling; rate limiting; upload validation; activity logs.

### 1.5 Additional requirements identified (included in Phase 1)
| # | Gap | Why it matters |
|---|---|---|
| A1 | **Public widget key and allowed origins per organization**, rotatable | Without it any site can impersonate an organization's bot |
| A2 | **Conversation session resume** (visitor token in localStorage, 24h TTL) | Customers leave and come back; staff replies must land in the same thread |
| A3 | **Staff replies delivered to the widget** (polling now, SSE later) | "Members reply manually" is useless if the customer never sees it |
| A4 | **Customer identity capture** (name, phone) inside the chat before an order/appointment | Orders and appointments are unusable without contact details |
| A5 | **System messages in conversations** on order/appointment status change | Customer sees "Your order was confirmed" in the same chat |
| A6 | **Activity log** per organization and platform-wide | Spec asks admin to "monitor activity"; also needed for audit |
| A7 | **Invitation link always visible to the owner** (copy/share), plus in-app invite for existing users | Email delivery can fail or be rate-limited; owners in Pakistan share links on WhatsApp |
| A8 | **Leave organization / transfer ownership** | Owner is the only one who can delete; someone must be able to take over |
| A9 | **Soft delete of organizations** with 30-day retention | "Delete organization" that hard-deletes everything is a support nightmare |
| A10 | **File metadata table** with uploader, size, MIME, purpose; server-side validation | Spec asks for "file and media metadata" and "secure upload validation" |
| A11 | **Unanswered-question log** | The chatbot's fallback should feed the Q&A editor ("customers asked this 12 times") |
| A12 | **Admin impersonation is NOT included**; admin reads are read-only and logged | Prevents admin accidentally mutating tenant data; logged for accountability |
| A13 | **Health endpoint, structured logs, request IDs** | Operability on any host |
| A14 | **Seed script and test fixtures** | Reproducible local setup and automated tests |

Deferred (documented, not built): email delivery of notifications (needs an
email provider key; in-app only now), AI-generated answers (rule-based
matcher now, same interface), WhatsApp/Messenger/Instagram channels, billing,
email verification on signup (signup is server-side with auto-confirm; see
§5.2), SSE streaming.

---

## 2. System architecture

```
                    ┌──────────────┐       ┌──────────────┐
                    │  admin/      │       │  user/       │
                    │  Next.js 15  │       │  Next.js 15  │
                    │  :3001       │       │  :3000       │
                    └──────┬───────┘       └──────┬───────┘
      Supabase session     │  Bearer <access_token> │
      (cookies, @supabase/ssr)                     │
                           ▼                       ▼
┌──────────┐   ┌────────────────────────────────────────────┐   ┌─────────────┐
│ customer │   │  backend/  Express + TypeScript  :4000      │   │ Supabase    │
│ website  │──►│  /v1/auth  /v1/admin/*  /v1/orgs/:orgId/*   │◄─►│ Auth (JWT)  │
│ + widget │   │  /v1/bot/:widgetKey/*  /v1/me/*             │   │ Storage     │
└──────────┘   │  middleware: jwt → user → org → role        │   └─────────────┘
               └───────────────────┬────────────────────────┘
                                   ▼
                          ┌─────────────────┐
                          │ MongoDB         │
                          │ ai-business-    │
                          │ portal          │
                          └─────────────────┘
```

- **Supabase** issues and signs JWTs (ES256) and stores files. Nothing else.
- **Backend** verifies every JWT against the project JWKS, loads the Mongo
  user, resolves the organization from the URL, checks the membership and
  role, and only then runs the handler. The frontends never talk to Mongo.
- **Frontends** keep the Supabase session in cookies (`@supabase/ssr`),
  protect routes in Next.js middleware, and call the backend with the access
  token. Role checks in the UI are cosmetic; the backend is authoritative.
- **Widget** has no user login. It presents the organization's public widget
  key and a per-visitor session token.

### 2.1 Repository layout (unchanged from Step 1)
`admin/`, `user/`, `backend/`, `bot/`, `shared/` in a pnpm workspace. Phase 1
adds `backend/src/models`, `backend/src/services`, `backend/tests`,
`shared/src/api` (typed client + hooks), new pages in both portals, and the
rewritten widget.

---

## 3. Database design (MongoDB, database `ai-business-portal`)

Conventions: `_id` ObjectId; `orgId` is the organization's **UUID string**,
present on every organization-related document and first in every compound
index; timestamps `createdAt`/`updatedAt`; soft delete via `deletedAt`
where noted. "FK" below means a referenced id validated in the service layer
(Mongo has no foreign keys; the backend enforces existence and ownership).

| Collection | Key fields | Indexes |
|---|---|---|
| `admin_users` | supabaseId, email, name, avatarUrl, notificationPrefs, isSuperAdmin, lastLoginAt | supabaseId u, email u |
| `users` | supabaseId, email, name, phone, avatarUrl, notificationPrefs, lastLoginAt | supabaseId u, email u |
| `organizations` | uuid, name, slug, categoryKey (FK categories.key), description, logoUrl, website, phone, email, address{line1,city,country}, timezone, currency, ownerUserId, status(active/suspended/deleted), deletedAt, widgetKey, allowedOrigins[] | uuid u, slug u, widgetKey u, ownerUserId, categoryKey |
| `memberships` | orgId, userId, role(owner/member), status(active/removed), invitedBy, joinedAt | {orgId,userId} u, userId |
| `invitations` | orgId, email, role, tokenHash, status(pending/accepted/expired/revoked), invitedBy, expiresAt, acceptedBy, acceptedAt | {orgId,email,status}, tokenHash u, expiresAt |
| `categories` | key, name, description, icon, modules[], labels{catalogGroup,catalogItem,staff,appointment,inquiry}, intake{orderType}, isActive, sortOrder | key u |
| `branches` | orgId, name, address{...}, phone, email, hours[{day,open,close,closed}], lat, lng, isMain, isActive | {orgId,isActive} |
| `catalog_groups` | orgId, branchId?, name, description, sortOrder, isActive | {orgId,sortOrder} |
| `catalog_items` | orgId, groupId (FK), branchId?, name, description, price, currency, imageUrl, images[], tags[], options[{name,choices[{label,delta}]}], isAvailable, sortOrder | {orgId,groupId}, {orgId,name text} |
| `staff_profiles` | orgId, branchId?, name, title, specialty, bio, photoUrl, fee, email, phone, availability[{day,start,end}], slotMinutes, isActive | {orgId,isActive} |
| `chatbot_configs` | orgId, name, greeting, fallbackMessage, collectContact(bool), brandColor, position, buttonLabel, quickReplies[], handoverKeywords[], isEnabled | orgId u |
| `chatbot_qas` | orgId, branchId?, question, answer, keywords[], isActive, hits | {orgId,isActive}, {orgId,question text,keywords text} |
| `conversations` | orgId, branchId?, channel(website), visitorId, sessionToken(hash), customer{name,phone,email}, status(bot/needs_human/human/closed), assignedTo (userId), lastMessageAt, lastMessagePreview, unreadForStaff, pageUrl, closedAt, closedBy | {orgId,lastMessageAt -1}, {orgId,status}, sessionTokenHash u, visitorId |
| `messages` | orgId, conversationId, from(customer/bot/staff/system), text, authorUserId?, meta{matchedQaId?, tool?, confidence?}, createdAt | {orgId,conversationId,createdAt} |
| `orders` | orgId, branchId?, conversationId, number (per org sequence), customer{name,phone,address}, items[{itemId,name,qty,unitPrice,options}], subtotal, deliveryCharge, total, currency, notes, status(pending/confirmed/preparing/ready/completed/cancelled), statusHistory[{status,by,at}] | {orgId,createdAt -1}, {orgId,status}, {orgId,number} u |
| `appointments` | orgId, branchId?, conversationId, number, staffId?, customer{name,phone}, service, requestedAt(date), notes, status(requested/confirmed/completed/cancelled/no_show), statusHistory[] | {orgId,requestedAt}, {orgId,status} |
| `inquiries` | orgId, branchId?, conversationId, number, type(admission/membership/general), customer{...}, subject, details, status(new/in_progress/resolved/closed), statusHistory[] | {orgId,createdAt -1}, {orgId,status} |
| `unanswered_questions` | orgId, question, count, lastAskedAt, resolvedQaId? | {orgId,count -1} |
| `notifications` | recipientType(admin/user), recipientId, orgId?, type, title, body, link, readAt, createdAt | {recipientType,recipientId,createdAt -1}, {recipientId,readAt} |
| `activity_logs` | orgId?, actorType(admin/user/bot/system), actorId, action, targetType, targetId, summary, meta, createdAt | {orgId,createdAt -1}, {createdAt -1} |
| `files` | orgId?, uploaderType, uploaderId, bucket, path, url, mime, size, purpose(avatar/logo/catalog/branch/staff/qa), createdAt | {orgId,createdAt -1} |
| `counters` | key (`${orgId}:order`), seq | key u |
| `bot_sessions` | orgId, conversationId, tokenHash, lastSeenAt (TTL 24h) | tokenHash u, lastSeenAt TTL |

Order items are embedded in `orders.items` (the Mongo equivalent of an
order-items table; they are immutable once placed).

---

## 4. Category model (dynamic)

A category is data, not code. It declares which **modules** the organization
gets and the **labels** those modules use:

```json
{ "key": "restaurant", "name": "Restaurant", "icon": "utensils",
  "modules": ["branches","catalog","qa","inbox","orders"],
  "labels": { "catalogGroup": "Menu", "catalogItem": "Menu item", "staff": "Staff" },
  "intake": { "orderType": "order" } }
```

Modules implemented in code (the fixed vocabulary): `branches`, `catalog`
(groups + items with prices and images), `staff` (profiles, availability,
fees), `qa`, `inbox`, `orders`, `appointments`, `inquiries`. Seeded
categories:

| Category | Modules | Labels |
|---|---|---|
| Restaurant | branches, catalog, qa, inbox, orders | Menu / Menu item |
| Hospital | branches, staff, catalog, qa, inbox, appointments, inquiries | Department / Service, Doctor |
| Salon | branches, staff, catalog, qa, inbox, appointments | Service category / Service, Staff |
| Gym | branches, staff, catalog, qa, inbox, inquiries, appointments | Plan category / Membership plan, Trainer |
| School | branches, staff, catalog, qa, inbox, inquiries | Program / Course, Teacher |

The admin creates new categories by choosing modules and labels; the client
portal navigation, forms and the chatbot's intents follow the category.

---

## 5. Authentication and authorization

### 5.1 Tokens
Supabase Auth, email + password. The access token is an ES256 JWT; the
backend verifies it with `jose` against
`https://<project>.supabase.co/auth/v1/.well-known/jwks.json` (cached). The
`sub` claim is the Supabase user id. No session state on the backend.

### 5.2 Flows
- **Admin login**: Supabase sign-in on the admin app; backend `/v1/admin/me`
  succeeds only if `admin_users` has the `sub`. Non-admins are signed out
  with "not an admin account". Forgot password: Supabase
  `resetPasswordForEmail` with redirect to `/reset-password`; the page calls
  `updateUser({password})`.
- **Client signup**: `POST /v1/auth/signup` (server-side, rate-limited):
  creates the Supabase user with the admin API (email auto-confirmed, so no
  dependency on email delivery during Phase 1), creates `users`,
  `organizations` (UUID, widget key), `memberships` (owner), default
  `chatbot_configs` and a main `branches` record. The app then signs in with
  the password. Email verification is deferred to Phase 2.
- **Client login / forgot password**: same as admin, against `users`.
- **Invitations**: owner or member posts emails → for each, an `invitations`
  row with a 32-byte random token (SHA-256 hash stored), 7-day expiry. The
  backend asks Supabase to email an invite (`inviteUserByEmail`, redirect to
  `/invite/<token>`); if the address already has an account, it creates an
  in-app notification instead. The response always returns the link so the
  owner can share it. `/invite/<token>` shows the organization; a signed-in
  user accepts; a new user sets name + password (Supabase invite session) and
  accepts. Acceptance is single-use, checks the email matches, and creates
  the membership.
- **Widget**: `widgetKey` in the URL identifies the organization;
  `POST /sessions` returns a random session token bound to one conversation;
  messages require it. CORS on `/v1/bot/*` allows only the organization's
  `allowedOrigins` (plus dev origins).

### 5.3 Middleware chain (backend)
`requestId → rateLimit → jwt (optional/required) → loadPrincipal (admin or
user) → loadOrg(:orgId) → requireMember → requireRole(owner) → handler`.
Every org handler receives `req.org` and `req.membership`; repositories take
`orgId` explicitly and never query without it.

---

## 6. Role and permission matrix

| Capability | Admin | Owner | Member |
|---|---|---|---|
| View / edit organization profile | view | yes | yes |
| Branches, catalog, staff, Q&A, chatbot config | view | yes | yes |
| Inbox: view, reply, take over, close | view | yes | yes |
| Orders / appointments / inquiries: view, update status | view | yes | yes |
| Invite members | – | yes | yes |
| Remove members, change roles | – | yes | no |
| Transfer ownership | – | yes | no |
| Rotate widget key, edit allowed origins | – | yes | no |
| Delete organization (soft) | – | yes | no |
| Manage categories | yes | – | – |
| View every organization, conversation, message, order | yes (read-only, logged) | – | – |
| Billing | out of scope | out of scope | out of scope |

---

## 7. API structure

Base `http://localhost:4000`. JSON. Errors: `{ error, code?, details? }`.
Pagination: `?page=1&limit=25` → `{ items, page, limit, total }`.

**Auth & account**
- `POST /v1/auth/signup` {email,password,name,orgName,categoryKey}
- `GET /v1/me` · `PATCH /v1/me` · `POST /v1/me/avatar` (multipart) · `PATCH /v1/me/notification-preferences` · `POST /v1/me/change-password`
- `GET /v1/me/organizations` · `GET /v1/me/notifications` · `PATCH /v1/me/notifications/:id/read` · `POST /v1/me/notifications/read-all`
- `GET /v1/invitations/:token` (public: org name, email, state) · `POST /v1/invitations/:token/accept` (auth)

**Organization (prefix `/v1/orgs/:orgId`, member required)**
- `GET /` · `PATCH /` (profile) · `POST /logo` · `DELETE /` (owner) · `POST /transfer-ownership` (owner)
- `GET /members` · `DELETE /members/:userId` (owner) · `POST /leave`
- `GET|POST /invitations` · `DELETE /invitations/:id` (revoke) · `POST /invitations/:id/resend`
- `GET|POST /branches` · `GET|PATCH|DELETE /branches/:id`
- `GET|POST /catalog/groups` · `PATCH|DELETE /catalog/groups/:id` · `GET|POST /catalog/items` · `GET|PATCH|DELETE /catalog/items/:id` · `POST /catalog/items/:id/image`
- `GET|POST /staff` · `GET|PATCH|DELETE /staff/:id` · `POST /staff/:id/photo`
- `GET|PATCH /chatbot` (config) · `POST /chatbot/rotate-key` (owner) · `GET|POST /chatbot/qas` · `PATCH|DELETE /chatbot/qas/:id` · `GET /chatbot/unanswered` · `GET /chatbot/embed`
- `GET /conversations` · `GET /conversations/:id` · `POST /conversations/:id/messages` · `POST /conversations/:id/takeover` · `POST /conversations/:id/handback` · `POST /conversations/:id/close` · `POST /conversations/:id/reopen`
- `GET /orders` · `GET /orders/:id` · `PATCH /orders/:id/status`
- `GET /appointments` · `GET /appointments/:id` · `PATCH /appointments/:id/status` · `PATCH /appointments/:id` (assign staff / time)
- `GET /inquiries` · `GET /inquiries/:id` · `PATCH /inquiries/:id/status`
- `GET /activity` · `GET /dashboard` (counts)
- `POST /files` (multipart, purpose) · `GET /files`

**Bot (public, prefix `/v1/bot/:widgetKey`)**
- `GET /config` · `POST /sessions` · `POST /messages` · `GET /messages?after=` · `POST /contact`

**Admin (prefix `/v1/admin`, admin required)**
- `GET /me` · `PATCH /me` · `POST /me/avatar` · `PATCH /me/notification-preferences`
- `GET /dashboard` · `GET /organizations` · `GET /organizations/:orgId` (+ `/members`, `/branches`, `/catalog`, `/staff`, `/qas`, `/conversations`, `/conversations/:id`, `/orders`, `/appointments`, `/inquiries`, `/activity`)
- `PATCH /organizations/:orgId/status` (suspend/reactivate)
- `GET|POST /categories` · `PATCH /categories/:key`
- `GET /conversations` · `GET /orders` · `GET /appointments` (cross-org)
- `GET /activity` · `GET /notifications` · `PATCH /notifications/:id/read`

**Ops**: `GET /health`.

---

## 8. Chatbot architecture

```
widget.js ──► GET  /config          (name, greeting, colour, quick replies = top Q&A)
          ──► POST /sessions        (visitorId → conversation, session token)
          ──► POST /messages {text} ──► responder
          ◄── {reply, quickReplies, needsContact?, order?/appointment?}
          ──► GET  /messages?after  (every 3 s while open: staff replies, system messages)
          ──► POST /contact {name, phone}
```

**Responder** (`backend/src/services/bot/responder.ts`), rule-based, same
interface an AI provider will implement later:

1. **Takeover guard**: if the conversation is `human`, the bot stays silent
   (message stored; staff will answer).
2. **Handover intents**: "talk to a person", complaint words, configured
   handover keywords → status `needs_human`, notification to members.
3. **Q&A match**: normalise text; score each active Q&A by keyword hits and
   token overlap with the question; best score above threshold wins; `hits`
   incremented; reply = answer.
4. **Category intents** (data-driven):
   - catalog: "price of X", "menu", "services", "plans" → look up
     `catalog_items`;
   - branches: "where are you", "address", "timings", "hours" → branches;
   - staff: "doctors", "trainers", "teachers", "availability of Dr X" → staff;
   - **order** (if `orders` module): quantities + item names → cart → ask
     contact → `orders` row, system message, notification;
   - **appointment** (if `appointments` module): "appointment with Dr X on
     Monday 10am" → `appointments` row;
   - **inquiry** (if `inquiries` module): "admission", "membership" →
     `inquiries` row.
5. **Fallback**: configured fallback message + quick replies; the question is
   recorded in `unanswered_questions`; after two consecutive fallbacks the
   conversation becomes `needs_human`.

**Embedding**: Channels page shows
`<script src=".../widget.js" data-business="<widgetKey>" data-api="<api>" async></script>`.
The widget renders in a Shadow DOM (already built in Step 1) and is
re-pointed at the new endpoints; it gains a contact form step, polling for
staff messages, and a "closed" state.

---

## 9. Organization workflows

- **Signup** → organization + owner + main branch + default chatbot config →
  dashboard "Getting started" checklist (add branch details, add Q&A, add
  menu/services, install widget).
- **Invite** → link shared / emailed → accept → member → notification to
  inviter.
- **Customer chat** → Q&A / catalog answers → order or appointment → members
  notified → confirm from Orders/Appointments → system message to customer.
- **Needs human** → inbox badge → member takes over → replies → closes.
- **Delete org** (owner) → soft delete, widget disabled, members notified,
  admin still sees it as deleted for 30 days.

---

## 10. Files and uploads

Supabase Storage, two buckets: `avatars` (public) and `org-media` (public
read, path `orgs/<orgId>/<purpose>/<id>.<ext>`). Backend-only writes with the
service key after validation: MIME allow-list (jpeg, png, webp, gif, pdf for
menus), max 5 MB images / 10 MB PDFs, extension derived from MIME not from
the filename, random file names. Every upload writes a `files` row. Chosen
over Cloudinary because the credentials and platform already exist; the
adapter is one file (`services/storage.ts`) if that changes.

---

## 11. Notifications

Created by services on: invitation received (existing users), member joined,
member removed, new conversation needing a human, new customer message while
`human`, new order, order status change, new appointment/inquiry and status
changes, organization suspended/deleted. Recipients: all active members of
the organization (or the specific user). Preferences per user:
`{ newOrders, newMessages, needsHuman, appointments, members, email }` with
`email` reserved for Phase 2. Admin notifications: new organization, org
deleted. UI: bell with unread count, list, mark read / read all.

---

## 12. Security checklist (implemented)

JWT verification via JWKS with issuer/audience checks · principal loaded from
Mongo (no trust in claims for roles) · org resolved from URL and membership
checked on every org route · owner-only guards · zod validation on every body,
query and params · central error handler (no stack traces to clients) · rate
limits (auth 10/min/IP, bot 60/min/IP+key, API 300/min/user) · upload
validation · invitation tokens hashed, expiring, single-use, email-bound ·
password reset via Supabase recovery flow · CORS allow-lists (portal origins;
per-org widget origins) · request ids and structured logs · admin reads logged
to `activity_logs` · soft deletes · no secrets in frontends.

---

## 13. Implementation sub-phases

| # | Sub-phase | Deliverable | Verified by |
|---|---|---|---|
| 1 | Design | this document | review |
| 2 | Backend foundation | models, middleware, errors, validation, storage, notifications/activity services, seed (categories, admin), test harness | `tsc`, unit tests |
| 3 | Admin auth + settings API | `/v1/admin/me*`, admin seed account | API tests |
| 4 | Client auth + org creation | signup, `/v1/me*`, `/v1/orgs/:id` profile | API tests |
| 5 | Members + invitations | invite, accept, remove, leave, transfer | API tests incl. role denials |
| 6 | Categories | seed + admin CRUD, module vocabulary | API tests |
| 7 | Branches + business info | branches CRUD, hours | API tests |
| 8 | Category modules | catalog groups/items, staff, uploads | API tests |
| 9 | Chatbot config + Q&A + bot API + widget | config, Q&A, responder, sessions, polling, embed | API tests + browser |
| 10 | Inbox | conversations, reply, takeover, close | API tests + browser |
| 11 | Orders / appointments / inquiries | lists, status flows, system messages | API tests |
| 12 | Notifications | events, list, read, preferences | API tests |
| 13 | Admin monitoring | dashboard, org drill-down, cross-org lists, categories UI | API tests + browser |
| 14 | Frontends | admin portal pages, client portal pages, auth pages | browser flows |
| 15 | Hardening + docs | isolation tests, rate limits, `PHASE_1_TESTING.md`, README | full test run |

Order of work: backend sub-phases 2–13 first (each with tests), then the two
frontends against the finished API, then the widget, then end-to-end
browser verification.

---

## 14. Local setup summary

```
brew services start mongodb-community
pnpm install
pnpm --filter @assistflow/backend db:seed      # categories, admin account
pnpm dev:backend  # :4000    pnpm dev:user  # :3000
pnpm dev:admin    # :3001    pnpm dev:bot   # :5173
pnpm --filter @assistflow/backend test          # API tests (real Supabase auth, test DB)
```
