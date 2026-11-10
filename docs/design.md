# UI design

How the three portals look and fit together. Next.js 15 App Router, Tailwind
v4, hand-rolled shadcn-style primitives in `shared/`. Everything renders from
`shared/src/mock/`; the portals do not call the backend yet. For the split
into projects see `architecture.md`.

## 1. Principles

1. **One shell, three audiences.** Admin, business owner and the customer
   widget share tokens and primitives. The admin and business portals share
   `AppShell`; the widget is a standalone client component themed by the
   business's accent.
2. **AI acts, humans confirm.** AI-generated messages are brand-tinted and
   tagged with the tool they used (price lookup, zone check, order created).
   Orders arrive as "Pending confirmation" with Confirm / Call / Reject.
3. **Platform money ≠ business money.** Admin screens show USD subscriptions
   and invoices; business screens show PKR order values. They are never on the
   same card.
4. **Per-business accent.** `--brand` is set once in the business layout
   from `businesses[].branding.brand`. Buttons, active nav, AI bubbles, usage
   meters and the widget all follow it. The admin portal uses the platform
   indigo.

## 2. Tokens (`shared/src/styles/globals.css`)

Neutral OKLCH scale, status colours (`success`, `warning`, `info`,
`destructive` with `-soft` tints), `--brand` family, sidebar surface, 10px
radius. Dark-mode tokens exist under `.dark` (no toggle yet). Geist Sans/Mono.

## 3. Layout

```
┌──────────────┬──────────────────────────────────────────────┐
│ Brand + name │ Topbar: search (⌘K) · help · notifications ·  │
│ subtitle     │         user menu                              │
│ Sidebar nav  ├──────────────────────────────────────────────┤
│  grouped,    │ Page header: title, description, actions      │
│  count       │ Content, max-width 80rem                       │
│  badges      │                                               │
│ Footer: env  │                                               │
│ or usage     │                                               │
└──────────────┴──────────────────────────────────────────────┘
```

Sidebar 240px, hidden below `md` (mobile drawer not built).

## 4. Screens

### Platform admin (`admin/`, served at `/`)
| Route | Screen |
|---|---|
| `/admin` | KPIs (MRR, active, outstanding, conversations, orders, AI cost), attention list, MRR bars, businesses, tickets, activity |
| `/admin/businesses`, `/[id]` | Table with plan/status/channels/usage/MRR; detail with suspend banner, usage meters, tabs for billing, conversations, orders, audit |
| `/admin/plans` | Plan cards with limits, subscription table, coupons |
| `/admin/revenue` | Invoiced vs collected vs outstanding, MRR trend, payments ledger |
| `/admin/invoices`, `/[id]` | Invoice list; printable invoice with immutable-record actions (credit note, void) |
| `/admin/conversations` | Cross-business list with AI confidence, privacy banner |
| `/admin/orders` | All requests by type, industry bars, conversion |
| `/admin/ai-usage` | Replies, cost, margin, daily bars, model mix, per-business limits, failed answers |
| `/admin/reports` | Plan KPIs, MRR by month/country, businesses by industry |
| `/admin/support`, `/audit`, `/settings` | Tickets + announcements; append-only audit; identity, staff roles, AI keys, channel apps |

### Business portal (`user/`, served at `/[business]`)
| Route | Screen |
|---|---|
| `/` | KPIs, pending order cards, inbox preview, weekly bars, activity, top questions |
| `/orders`, `/[id]` | Pending cards + filterable table; detail with stepper, items, collection conversation, customer, notification log |
| `/inbox/[id]` | Three-pane inbox: list, thread with tool tags and takeover controls, customer + linked order + AI notes |
| `/customers`, `/[id]` | CRM table; detail with orders, conversations, AI insight, notes |
| `/catalog` | Categories with inline price inputs and availability toggles |
| `/knowledge` | FAQs (incl. AI-suggested), zones, hours, documents |
| `/assistant` | Persona, allowed tools, handover rules, live preview, quality |
| `/channels` | Four channel cards, widget snippet, notification delivery log |
| `/staff`, `/reports`, `/billing`, `/settings` | Team + permissions; reports + "ask your business"; plan usage and invoices; profile, notifications, widget, data |

### Customer (`bot/`, playground at `index.html`)
Plain-HTML restaurant site with the real embed snippet. The widget renders
in a Shadow DOM with its own CSS (`bot/src/widget/styles.css`, same look as
the portals: brand launcher, 380×560 panel, bubbles, quick replies, tool
tags, full-screen on phones) and talks to `backend` `/v1/bot/*`.

## 5. Component conventions

- `shared/src/ui/*` primitives; `shared/src/components/*` cross-cutting
  (`Pill`, `StatusBadge` + maps in `shared/src/lib/status.ts`, `ChannelBadge`,
  `MiniBars`, `UsageMeter`, `PageHeader`, `BrandMark`, `UserAvatar`);
  `shared/src/layout/*` shell; `shared/src/dashboard/*` KPI card, activity feed.
  Import as `@assistflow/shared/ui/button` etc.
- `user/components/business/*`: `ConversationThread` (customer left, AI/staff
  right, system lines centred, tool tags), `OrderCard`.
- Server components by default; `"use client"` only for Radix wrappers,
  topbar/sidebar and the widget.
- Status → tone mapping lives in `lib/status.ts` so new statuses need no CSS.

## 6. Known gaps (design)

Mobile drawer, dark-mode toggle, command palette, create/edit forms and
validation, loading/empty/error states beyond `EmptyState`, real charts
(bars are CSS), widget as an embeddable bundle.
