# Client portal end-to-end test report

Date: 2026-11-15. Scope: the client (business) portal, the chatbot widget and the public playground page, driven through the UI with Playwright against the local stack (portal :3000, API :4000, widget :5173). Test organization: **KFC** (restaurant). Nothing was inserted into the database directly; the only direct write was a one-off migration described in §6.

## 1. What was tested and the outcome

| Area | Flows exercised | Outcome |
|---|---|---|
| Sign-in and chooser | Login, organization chooser, dashboard KPIs, getting-started checklist | Pass |
| Branches | 6 real Karachi outlets added (addresses and hours from kfcpakistan.com, UAN as phone, delivery areas and charge); edit; delete; main-branch rule | Pass |
| Menu | 8 groups, 40 items with current kfcpakistan.com prices; edit; image upload (Cloudinary); mark unavailable; delete item; delete group with items is blocked with a message | Pass |
| Chatbot | 12 Q&As added, one edited, one deleted, search filter; assistant settings saved and persisted; install snippet copied; playground link | Pass |
| Widget as customer | FAQ answers, price lookup, branch list, order with contact form, fallback, hand-over, quick replies, logo | Pass after fixes (§3) |
| Inbox | Needs-human filter, take over, reply, customer sees reply, customer reply arrives, hand back, close, reopen, status filters, search | Pass |
| Orders | List, detail, pending → confirmed → preparing → ready → completed with notes; customer sees each status in the chat; history | Pass |
| Unanswered questions | Fallback logs the question; "Add answer" prefilled; chatbot answers it afterwards | Pass after fixes |
| Notifications | Page, mark read, mark all read, bell dropdown, click opens the target page, preference toggles persist, email opt-in toggle | Pass after fixes |
| Organization settings | Profile fields, logo upload, allowed origins, key rotation (old key 404, new key 200, widget and playground follow), delete organization with type-to-confirm | Pass after fixes |
| Account | Name and phone, avatar upload, notification preferences, change password, wrong current password rejected | Pass after fixes |
| Members and invitations | Invite three addresses at once; per-address delivery status; copy link / new link; revoke; new account joins through the link; existing account signs in and accepts; in-app invitation notifications; member sees only member controls; transfer ownership and back; remove; leave; removed/left users lose access | Pass after fixes |
| Authentication | Weak password error, duplicate email 409, signup creates org, verification code banner, wrong code, resend cooldown, verify; sign out; wrong password; forgot password; reset link; link reuse rejected; login with new password; password restored | Pass |
| API suite | `backend` → `npx vitest run` | 30 of 30 pass |
| Admin portal | Smoke check after the shared top bar and middleware changes | See §7 |

## 2. Bugs found and fixed

1. **Relative times were wrong everywhere.** The shared helper labelled units off by one (3 hours showed as "3m ago") and defaulted "now" to a hardcoded date from the design phase. Fixed in `shared/src/lib/utils.ts`.
2. **Order messages were hijacked by the FAQ.** "I want 2 Zinger Burgers and 1 Fries" matched the delivery FAQ because FAQ matching ran before intent detection. The responder now checks catalog items and order intent first.
3. **Catalog matching over-matched.** Asking for a Zinger Burger returned four items because any shared word ("burger") matched. Full-name matches now win; word fallback ignores words shared by several items; quantities parse against the full name; plurals accepted.
4. **Keyword intents fired inside words.** "hi" matched "Karachi" so a drive-thru question got the greeting. Intent keywords now match whole words (with a prefix rule for words of five letters or more).
5. **Changing the password silently logged the user out** on the next navigation (Supabase ends all sessions). The account page now signs in again with the new password.
6. **Invite results were never shown.** The invite dialog closed on success, hiding per-address delivery status and copy-link buttons. It now stays open with "Done" / "Send more".
7. **Deleted organization still listed** until a reload. The settings page refreshes the cached list before navigating.
8. **Adding an answer from the Unanswered tab did not clear the entry** (normalisation mismatch). The create endpoint now resolves the originating entry and identical wording.
9. **Bell badge did not update** after "Mark all read". The page now notifies the shell, which also refreshes every 30 s.
10. **Signup created an empty "Main branch"** that showed up in bot answers and on the playground. Removed; the first real branch becomes the main branch automatically. Tests updated.
11. **Random sign-outs.** Portal middleware called the Supabase auth server on every navigation and redirected to login whenever that call failed; one such bounce was observed during testing. Middleware now reads the session from the cookie (refreshing when expired); the API still verifies every token.

## 3. Fake, static or hardcoded data found and replaced

| Where | What | Replacement |
|---|---|---|
| Top bar search box | Non-functional placeholder with a ⌘K hint | Working command palette: jumps to sidebar pages and searches conversations, orders, appointments and inquiries live |
| Top bar "Help" button | Did nothing | Removed |
| Bell dropdown | Items not clickable, no link to the full list | Items mark read and open their target; "View all notifications" link |
| Account → Notifications | "Also send me emails (coming in Phase 2)" switch did nothing | Real opt-in: every notification is also emailed through Resend when on |
| `shared/src/mock/*` and `ActivityFeed` | 500 lines of mock fixtures and an unused component | Deleted; package export removed |
| `shared/src/lib/utils.ts` | Hardcoded "now" of 2026-10-31 | Real clock |
| Playground `bot/index.html` | Fictional "Karachi Biryani House" with a fake menu, shown from "Try it on a test page" | Renders the business's real profile, branches, menu and staff from a new public `GET /v1/bot/:widgetKey/site` endpoint |
| Signup | Placeholder "Main branch" record | Not created any more |

## 4. Features added because the brief required them

- **Email verification.** Signup (and invite signup for new accounts) sends a welcome email with a 6-digit code and a verify link. A banner stays above the portal until the code is entered; wrong code, 8-attempt limit, 30-minute expiry, one resend per minute. Verification does not block sign-in. Endpoints: `POST /v1/me/verify-email`, `POST /v1/me/verify-email/resend`; page `/verify-email?code=…`. Covered by a new API test.
- **Notification emails** (opt-in per user, also for admins) with a branded template.

## 5. Email and notification results

- Templates verified: welcome + verification code, password reset, invitation, notification copy. All share the AssistFlow layout with a button and a plain-text fallback.
- Triggering verified at the API level for each flow (send attempted, result logged and surfaced in the UI: invitations show "email sent" / "share the link", forgot-password shows a development link, the banner reports "Code sent" / "Code issued").
- **Delivery could not be verified to the test inboxes.** Resend's `onboarding@resend.dev` sender only delivers to the Resend account owner's address and rejects every other recipient with "You can only send testing emails to your own email address". All `+1`, `+2`, `+3`, `+4` test addresses were rejected for that reason. To receive real mail, verify a domain in Resend and set `MAIL_FROM` in `backend/.env`.
- In-app notifications verified for: new order, order status changes (customer side), needs-human, new customer message while with the team, invitation to an existing user, member joined, member left, member removed, ownership transferred.

## 6. Data migration

Accounts that existed before email verification shipped were marked verified (6 users) so the banner only appears for new signups.

## 7. Open items

- Resend domain verification (above) is the one thing blocking real email delivery to customers and team members.
- The chatbot is rule-based; complex orders ("one of each", "without cheese") still need a human. Hand-over works.
- Search in the inbox matches the stored customer name, so "Anonymous" finds nothing; anonymous chats are found by message text.
- Test accounts left in place for you to inspect: the KFC owner (unchanged password), one member "Bilal Ahmed", and two accounts without organizations (`+2` left KFC, `+3` deleted its test organization). The admin account was invited, accepted and then removed from KFC during the test.
- The user's own concurrent activity in the same organization was visible during the run (an extra Q&A and conversations), so counts on the dashboard include it.
