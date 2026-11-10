# backend

Express + TypeScript API for AssistFlow. One deployable service used by the
admin portal, the business portal, the embeddable bot and channel webhooks.

```
pnpm dev        # tsx watch, http://localhost:4000
pnpm build      # tsc -> dist/
pnpm start
```

Copy `.env.example` to `.env`. With `MONGODB_URI` empty the service runs on
in-memory fixtures (enough for the bot demo).

## Layout

```
src/
  server.ts, app.ts         bootstrap and route mounting
  config/env.ts             typed env
  db/mongo.ts               Atlas connection (tenant rule documented there)
  middleware/               auth (session/JWT), tenant (businessId pin), cors (portal vs per-business bot), rate-limit, error
  ai/                       provider boundary + allowed tools (the responder will call this)
  modules/<name>/router.ts  one module per domain; unimplemented ones answer 501 with their planned routes
  modules/bot/              the only live module today: config, sessions, messages (rule-based responder)
  modules/notifications/    owner alerts (email + WhatsApp), stubbed
```

See `docs/architecture.md` for the full API map and the bot protocol.
