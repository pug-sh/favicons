# favicon

A favicon API running on Cloudflare Workers. Returns the favicon for any domain, served via Cloudflare's edge cache.

## Usage

```
GET https://favicons.garib.dev/:domain
```

Examples:
```
https://favicons.garib.dev/github.com
https://favicons.garib.dev/google.com
https://favicons.garib.dev/linear.app
```

Returns the favicon image directly. CORS is open to all origins.

## How it works

1. Check Cloudflare edge cache (30 day TTL)
2. Check R2 (permanent storage)
3. Fetch from Google Favicon API → DuckDuckGo fallback
4. Store in R2 + edge cache

## Development

```bash
bun install
bun run dev
```

## Deploy

Create the R2 bucket (first time only):
```bash
bunx wrangler r2 bucket create favicons
```

Deploy:
```bash
bun run deploy
```

Regenerate Cloudflare bindings types after changing `wrangler.jsonc`:
```bash
bun run cf-typegen
```
