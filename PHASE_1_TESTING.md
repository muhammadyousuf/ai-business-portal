# Phase 1 – Testing Guide

Everything below was executed by the implementer with automated API tests
(`backend/tests`, 28 tests) and scripted browser runs against the real
Supabase project and a local MongoDB. Use this document to repeat the checks
manually. Expected results are stated for every step.

## 1. Setup

```
brew services start mongodb-community          # MongoDB 8 on 127.0.0.1:27017
pnpm install                                    # once, at the repo root
pnpm --filter @assistflow/backend db:seed       # categories + admin account
pnpm dev:backend    # http://localhost:4000
pnpm dev:user       # http://localhost:3000   client portal
pnpm dev:admin      # http://localhost:3001   admin portal
pnpm dev:bot        # http://localhost:5173   widget playground
```

Env files already filled: `backend/.env` (Mongo, Supabase URL, JWKS, secret
key, publishable key), `user/.env.local`, `admin/.env.local`.
Do not run `pnpm build` in an app while its `pnpm dev` runs (shared `.next`).

### Test accounts
| Role | Email | Password | Notes |
|---|---|---|---|
| Platform admin | muhammadyousuf327@gmail.com | Hello123@ | Created by the seed; change via Settings → Security |
| Organization owner | create via Signup (any email, e.g. owner@example.com) | choose one (8+ chars, letter + number) | Signup auto-confirms the email |
| Organization member | invited by the owner | set on the invite page | |

Emails: signup and invitation signup do **not** need email delivery.
Only "forgot password" sends an email (via Supabase). Supabase's built-in
sender is rate-limited to a few emails per hour; use a real inbox you own.

### Automated API tests
```
pnpm --filter @assistflow/backend test
```
Expected: `5 passed (5)` files, `28 passed (28)` tests. They create temporary
Supabase users (`qa-…@example.com`) and delete them afterwards, and use the
`ai-business-portal-test` database (dropped at start).

---

## 2. Admin portal (http://localhost:3001)

| # | Steps | Expected |
|---|---|---|
| A1 | Open /login, sign in with a **client** owner account | Signed out again with "This account is not an admin account." |
| A2 | Sign in as the admin (table above) | Dashboard "Platform overview" with counts, categories chart, newest organizations, activity |
| A3 | /signup | 404 (no admin signup exists) |
| A4 | Forgot password → enter admin email → Send | "a reset link is on its way". Open the email → lands on /reset-password → set a new password → redirected to dashboard. (Rate-limited by Supabase; a wrong/expired link shows "invalid or has expired") |
| A5 | Settings → Profile: change name, upload a PNG/JPEG under 5 MB | Toast "Profile saved" / "Photo updated"; avatar visible in topbar. A `.txt` renamed to `.png` is rejected (400 "Unsupported file type") |
| A6 | Settings → Notifications: toggle switches | Each toggle persists after reload |
| A7 | Settings → Security: wrong current password | "Current password is incorrect". Correct one → "Password changed"; sign out and back in with the new password |
| A8 | Categories → New category: key `pharmacy`, name, modules `branches, catalog, qa, inbox, orders`, labels | Row appears with "0 orgs". Same key again → "A category with this key already exists". Client signup now lists Pharmacy |
| A9 | Categories → Edit → turn off "Visible at signup" | Category disappears from the client signup dropdown; existing organizations keep working |
| A10 | Organizations list: search, filter by category/status | Rows with member/conversation/order counts; click a row |
| A11 | Organization detail tabs: Overview, Members, Branches, Menus/Catalog, Staff, Chatbot Q&A, Conversations, Orders/Appointments/Inquiries, Activity | Read-only data from that organization; tabs shown match its category modules |
| A12 | Organization detail → Conversations → open one | Full thread: customer, bot (with tool tag), staff and system messages |
| A13 | Organization detail → Suspend | Status "Suspended"; the owner's portal shows "This organization is suspended" (403) and the widget returns 404 for config. Reactivate restores both |
| A14 | All conversations / All orders / All appointments / All inquiries | Cross-organization lists with organization name, status filter and pagination |
| A15 | Users | Every client user with organization count and last login |
| A16 | Activity log | Signups, invitations, Q&A changes, chatbot handovers, admin actions ("Admin … viewed …" entries are recorded but hidden from the org tab) |
| A17 | Notifications | "New organization: …" entries appear after each client signup; mark read / mark all read |
| A18 | Account menu → Sign out | Back at /login; visiting / redirects to /login |

## 3. Client portal (http://localhost:3000)

### 3.1 Signup, login, password
| # | Steps | Expected |
|---|---|---|
| C1 | /signup with weak password `abc` | Field error "Password must be at least 8 characters" |
| C2 | /signup: name, email, password, business "Kababjees", category Restaurant, city | Lands on the organization dashboard; "Getting started" checklist 0/4; widget key shown |
| C3 | Same email again | "An account with this email already exists" |
| C4 | Sign out → /login with wrong password | "Wrong email or password." |
| C5 | /login correct → /organizations | Organization chooser lists Kababjees with role owner |
| C6 | Forgot password (real inbox) | Same behaviour as A4 |
| C7 | /account | Profile, photo upload, notification preferences, change password (same checks as A5–A7) |
| C8 | Visit /org/<random uuid> | "Organization not found" / choose another organization |

### 3.2 Organization management (owner)
| # | Steps | Expected |
|---|---|---|
| O1 | Settings → Profile: description, phone, address, upload logo | Saved; logo shown in sidebar and on the admin's organization page |
| O2 | Branches: edit "Main branch" hours, add branch "DHA" with delivery areas and charge | Cards show hours per day; making DHA main unflags the other; deleting the only main branch is refused |
| O3 | Menus (restaurant): add menu "BBQ", add item "Chicken Tikka" Rs. 480, upload image, toggle Available | Item listed under BBQ with price and image; deleting a menu with items is refused ("Move or delete the … item(s) first") |
| O4 | Chatbot → Questions & answers: add "Do you deliver?" with keywords `deliver, delivery`; edit; search; delete | Entries appear with "0 uses"; uses increment after the widget matches them |
| O5 | Chatbot → Assistant settings: name, greeting, fallback, colour, position, quick replies, handover keywords, enabled | Widget reflects the changes on next load; invalid colour `red` is rejected |
| O6 | Chatbot → Install on website | Snippet with your widget key; "Try it on a test page" opens the playground with the widget |
| O7 | Chatbot → Unanswered | Questions the bot could not answer; "Add answer" prefills the Q&A form; dismiss removes |
| O8 | Settings → Website widget security: add `https://www.example.com`, rotate key | Saved; after rotating, the old `?business=` key returns "Unknown widget key" in the playground |
| O9 | Settings → Danger zone → Delete, type the exact name | Redirected to /organizations; the organization is gone from the list; admin still sees it as "Deleted" |

### 3.3 Members and invitations
| # | Steps | Expected |
|---|---|---|
| M1 | Members → Invite people: `ali@example.com, sara@example.com` | "Invitations sent"; each result shows delivery (`email`, `in_app` or `link`) and a Copy link button; pending list shows both |
| M2 | Open the copied link in a private window | "Join Kababjees" with the inviter's name; email is prefilled and locked |
| M3 | Enter name + password → Create account and join | Lands on the organization dashboard as a member; owner gets a "… joined" notification; Members page shows the new member |
| M4 | Open the same link again | "Invitation no longer valid … accepted" |
| M5 | Invite an email that already has an account | Delivery `in_app`; that user sees "You are invited…" in Notifications and can accept from the link |
| M6 | Open an invite link while signed in as a different user | "Wrong account" with a sign-out button |
| M7 | As **member**: Settings | No "Danger zone", allowed-origins fields disabled |
| M8 | As **member**: Members | Can invite; no "Remove" or "Make owner" buttons; "Leave" available. API check: `DELETE /v1/orgs/:id/members/:userId` with a member token → 403 |
| M9 | As **owner**: Make owner → confirm | Roles swap; former owner is now a member |
| M10 | As **owner**: Remove a member | Member disappears; that user gets a notification and receives 403 on the organization |
| M11 | Members → New link (resend) | New link copied; the old link reports "revoked"/invalid |

### 3.4 Category-specific modules
| # | Steps | Expected |
|---|---|---|
| K1 | Sign up a **Hospital** organization | Sidebar shows Appointments, Inquiries, Doctors, Departments; no Orders. Visiting /org/<id>/orders shows "orders module is not enabled" |
| K2 | Doctors: add "Dr. Ahmed Khan", Cardiologist, fee 3000, availability Mon 09:00–13:00, photo | Card with availability; photo shown |
| K3 | Sign up a **Salon**, **Gym**, **School** | Labels change (Services/Staff, Membership plans/Trainers, Courses/Teachers); School has Inquiries but no Appointments |
| K4 | Admin creates category "Pharmacy" (A8) → sign up a Pharmacy organization | Sidebar follows the modules chosen by the admin |

## 4. Chatbot widget (http://localhost:5173/?business=<widget key>&open=true)

| # | Steps | Expected |
|---|---|---|
| W1 | Open the playground with your key | Launcher in the brand colour; panel opens with the greeting and quick replies |
| W2 | "do you deliver to my area?" | The Q&A answer, tagged "from the FAQ"; Q&A "uses" count +1 in the portal |
| W3 | "how much is chicken tikka" | "Chicken Tikka: Rs. 480" tagged "looked up prices" |
| W4 | "where are you located" / "timings" | Branch address/phone and today's hours |
| W5 | "I want 2 chicken tikka" | Total shown; a contact form appears (name, phone, address) |
| W6 | Submit the form | "Your order request #1 … has been received"; system line "Order #1 created · team notified"; owner gets a notification; Orders page shows #1 pending |
| W7 | Nonsense question twice | First: fallback message + quick replies (and it appears under Chatbot → Unanswered). Second: handed over to the team; header reads "Waiting for the team" |
| W8 | "I want to talk to a person" | Handover immediately |
| W9 | Close the browser tab, reopen the same URL | Conversation resumes with history (session kept 24h in localStorage) |
| W10 | Hospital key: "which doctors are available", then "book an appointment with Dr Ahmed on Monday 10am" + contact | Doctor list, then "appointment request #1 is received"; Appointments page shows it with Dr. Ahmed Khan |
| W11 | School key: "I want admission for my son in grade 5" + contact | "admission inquiry #1 is logged"; Inquiries page shows type admission |
| W12 | Portal: Assistant settings → disable chatbot | Widget does not render on reload |
| W13 | Playground without `?business=` | Instruction banner, no widget |
| W14 | Wrong key | Widget shows "Chat is unavailable right now." |
| W15 | Embed on any HTML page: paste the snippet from Install before `</body>` | Same widget on that page (the page's own CSS does not affect it) |

## 5. Inbox and manual replies
| # | Steps | Expected |
|---|---|---|
| I1 | Inbox after W7/W8 | Conversation listed with "Needs a human" and a yellow banner in the thread; sidebar badge count |
| I2 | Take over | Status "With team"; system line "<you> joined the conversation" visible in the widget too |
| I3 | Type a reply, Enter | Appears in the thread and in the open widget within ~3 s, labelled with your name |
| I4 | Customer replies in the widget while status is "With team" | Bot stays silent; message appears in the inbox within ~5 s; staff get a "New message" notification |
| I5 | Hand back to assistant | Status "Assistant"; the bot answers the next customer message |
| I6 | Close | Status "Closed"; widget input disabled with "Start a new chat"; Reopen restores |
| I7 | Search and status filters in the list | Lists filter correctly; counts in the header |

## 6. Orders, appointments, inquiries
| # | Steps | Expected |
|---|---|---|
| R1 | Orders list → #1 | Items, totals, customer, conversation excerpt, status history |
| R2 | Status buttons follow the flow: pending → Confirmed → Preparing/Ready → Completed, or Cancelled | Only valid next statuses are offered; each change adds history and a system message visible in the customer's widget ("Your order #1 is confirmed…") and a notification |
| R3 | Appointment detail: assign a doctor, note "Confirmed for Monday 10:30", Confirmed | Staff name updates; note delivered to the customer chat |
| R4 | Inquiry detail: In progress → Resolved → Closed | Same behaviour |
| R5 | API: `PATCH …/orders/:id/status {status:"completed"}` on a pending order | 400 "Cannot move order from pending to completed" |

## 7. Notifications
| # | Steps | Expected |
|---|---|---|
| N1 | Bell in topbar | Unread count; dropdown with latest 8; "View all" |
| N2 | /org/<id>/notifications | List; click marks read; "Mark all read" |
| N3 | Account → Notifications: turn off "New orders" | New orders no longer notify that user (others still do) |
| N4 | Events covered | invitation (existing user), member joined/left/removed, ownership transfer, needs-human, new message while with team, new order / appointment / inquiry and every status change, organization suspended/reactivated/deleted; admin: new organization, organization deleted |

## 8. Security and isolation (API, use any HTTP client with a Bearer token)
Get a token: sign in on the portal and copy `access_token` from the Supabase cookie, or use the test helpers. Base `http://localhost:4000`.

| # | Request | Expected |
|---|---|---|
| S1 | `GET /v1/me` without token | 401 |
| S2 | `GET /v1/me` with garbage token | 401 "Invalid or expired token" |
| S3 | `GET /v1/admin/me` with a client token | 403 "This account is not an admin account" |
| S4 | `GET /v1/orgs/<other org uuid>` as a member of a different organization | 403 "You are not a member of this organization" |
| S5 | `GET /v1/orgs/<unknown uuid>` | 404 |
| S6 | `DELETE /v1/orgs/<id>` as member | 403 "Only the organization owner can do that" |
| S7 | `POST /v1/orgs/<id>/rotate-widget-key` as member | 403 |
| S8 | `GET /v1/orgs/<restaurant id>/staff` | 403 "The staff module is not enabled…" |
| S9 | `POST /v1/bot/<key>/messages` without session token | 401 |
| S10 | Use a session token from organization A on `GET /v1/bot/<key of B>/messages` | 401 "Invalid session" |
| S11 | `POST /v1/auth/signup` 11 times in a minute from one IP | 429 "Too many requests" |
| S12 | Upload a 6 MB image to `/v1/me/avatar` | 413 "File too large"; a non-image → 400 |
| S13 | `POST /v1/invitations/<token>/accept` with a user whose email differs | 403 |
| S14 | Accept the same invitation twice | 400 "This invitation is accepted" |
| S15 | Widget `GET /v1/bot/<key>/config` with `Origin: https://evil.example` after the owner set allowed origins | Response has no `Access-Control-Allow-Origin` header (browser blocks it) |
| S16 | Any org-scoped list while the organization is suspended | 403 "This organization is suspended" |

## 9. Database checks (mongosh ai-business-portal)
```
db.organizations.find({}, {uuid:1,name:1,categoryKey:1,status:1,widgetKey:1})
db.memberships.find({orgId: "<uuid>"})            // every member row carries orgId
db.invitations.find({orgId: "<uuid>"})            // tokenHash only, never the raw token
db.conversations.find({orgId: "<uuid>"}).count()
db.orders.find({orgId: "<uuid>"}, {number:1,status:1,statusHistory:1})
db.activity_logs.find({orgId: "<uuid>"}).sort({createdAt:-1}).limit(5)
db.notifications.find({recipientId: "<user id>"})
db.files.find({orgId: "<uuid>"})                   // uploads with provider/local path
```
Expected: every organization-related document has `orgId` equal to the organization UUID; `bot_sessions` rows disappear 24 h after `lastSeenAt`.

## 10. Known limitations (Phase 1)
- Email delivery is only used for password reset (and Supabase's optional invite email). In-app notifications are complete; email notifications are a Phase 2 item.
- The chatbot is rule-based (Q&A matching + catalog/branch/staff lookups + order/appointment/inquiry intents). An AI provider plugs in behind the same responder interface.
- File storage is local disk (`backend/uploads`) until `CLOUDINARY_URL` is set.
- Widget updates arrive by polling (3–8 s), not push.
- No mobile navigation drawer in the portals yet (desktop first); the widget itself is mobile-ready.
