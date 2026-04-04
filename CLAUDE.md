# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install        # install dependencies
bun run dev        # start local dev server
bun run build      # build for production
bun run deploy     # build then deploy to Cloudflare Workers
bun run cf-typegen # regenerate Cloudflare bindings types (run after changing wrangler.jsonc)
```

First-time deploy only:
```bash
bunx wrangler r2 bucket create favicons
```

## Architecture

Favicon API running on **Cloudflare Workers** using **Hono**, with **R2** as persistent storage and **Cloudflare edge cache** (`caches.default`) as CDN layer.

- `src/index.ts` — Hono app; single `GET /:domain{.+}` route with request normalization, domain parsing, and 3-layer cache logic
- `src/favicon.ts` — `createFaviconFinder(fetchFn)` factory; tries Google Favicon API then DuckDuckGo with timeout + null-on-failure semantics
- `src/fallback.svg` — raw SVG returned when no provider yields a favicon
- `wrangler.jsonc` — Workers config; R2 binding (`FAVICONS`) and custom domain (`favicons.garib.dev`)

### Request flow

1. **Edge cache** (`caches.default`) — 30 day TTL, shared across all users at the same PoP (cache key ignores query string)
2. **R2** (`env.FAVICONS`) — permanent storage, keyed by domain string
3. **Google → DuckDuckGo** — fetched on first-ever request, then stored in R2 + edge cache via `waitUntil`

### Route behavior notes

- Route accepts plain domains or full URLs in `:domain` path segment.
- Invalid domains return `400 Invalid domain` instead of throwing.
- Successful responses set `cache-control: public, max-age=2592000` and content type from source metadata when available.

After adding/changing bindings in `wrangler.jsonc`, run `bun run cf-typegen` to update `worker-configuration.d.ts`.
