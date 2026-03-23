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

- `src/index.ts` — Hono app; single `GET /:domain` route with 3-layer cache logic
- `src/lib/favicon-finder.ts` — `FaviconFinder` class; `fetch` is injected via constructor. Tries Google Favicon API then DuckDuckGo.
- `src/lib/types.ts` — shared types
- `wrangler.jsonc` — Workers config; R2 binding (`FAVICONS`) and custom domain (`favicons.garib.dev`)

### Request flow

1. **Edge cache** (`caches.default`) — 30 day TTL, shared across all users at the same PoP
2. **R2** (`env.FAVICONS`) — permanent storage, keyed by domain string
3. **Google → DuckDuckGo** — fetched on first-ever request, then stored in R2 + edge cache via `waitUntil`

After adding/changing bindings in `wrangler.jsonc`, run `bun run cf-typegen` to update `worker-configuration.d.ts`.
