# bot

The customer-facing chat widget. Built to a single file, `dist/widget.js`,
that a business adds to its website with one `<script>` tag (see
`demo/snippet.html`). It renders inside a Shadow DOM, so it looks the same on
every site and never breaks the host page's CSS.

```
pnpm dev      # playground on http://localhost:5173 (needs the backend on :4000)
pnpm build    # dist/widget.js + source map
```

Layout:

```
src/embed.ts          entry: reads data-* options from the script tag, mounts into Shadow DOM, exposes window.AssistFlow
src/config.ts         option parsing (data-business, data-api, data-position, data-open, data-brand)
src/api/client.ts     backend calls: config, sessions, messages; session token in localStorage
src/widget/App.tsx    launcher + panel + messages + quick replies + composer
src/widget/styles.css scoped CSS injected into the shadow root (host CSS cannot affect it)
index.html            playground: a plain HTML restaurant site with the snippet
```

The protocol with the backend is in `docs/architecture.md` §5.
