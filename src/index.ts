import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createFaviconFinder } from './favicon'
import FALLBACK_SVG from './fallback.svg?raw'

const app = new Hono<{ Bindings: CloudflareBindings }>()
const EDGE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days
const DEFAULT_ICON_CONTENT_TYPE = 'image/x-icon'
const FALLBACK_CONTENT_TYPE = 'image/svg+xml'
const cache = caches.default

app.use('*', cors())

function landingPageHtml(origin: string, canonicalOrigin: string): string {
  const baseOrigin = origin.includes('localhost') ? origin : canonicalOrigin
  const sampleDomain = 'github.com'
  const sampleUrl = `${baseOrigin}/${sampleDomain}`

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>favicon API</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <style>
      :root {
        --bg: #faf5ff;
        --card: #ffffff;
        --text: #1e1b4b;
        --muted: #6b7280;
        --border: #e5e7eb;
        --purple: #7c3aed;
        --purple-light: #a78bfa;
        --purple-bg: #f3e8ff;
        --pink: #db2777;
        --pink-bg: #fce7f3;
        --green: #059669;
        --green-bg: #d1fae5;
        --amber: #d97706;
        --amber-bg: #fef3c7;
        --sky: #0284c7;
        --sky-bg: #e0f2fe;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
        background:
          radial-gradient(ellipse at 0% 0%, #ede9fe 0%, transparent 50%),
          radial-gradient(ellipse at 100% 100%, #fce7f3 0%, transparent 50%),
          #faf5ff;
        color: var(--text);
        min-height: 100vh;
        padding: 56px 16px;
        line-height: 1.6;
      }
      main {
        max-width: 800px;
        margin: 0 auto;
      }
      .card {
        background: var(--card);
        border: 1.5px solid var(--border);
        border-radius: 20px;
        padding: 36px;
        margin-bottom: 16px;
      }
      h1 {
        font-size: 2.5rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1.1;
        margin-bottom: 10px;
        color: var(--purple);
      }
      h2 {
        font-size: 1.2rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        margin-bottom: 14px;
        color: var(--text);
      }
      p {
        margin-bottom: 10px;
      }
      code,
      pre {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
      code {
        background: var(--purple-bg);
        padding: 2px 7px;
        border-radius: 6px;
        font-size: 0.86em;
        color: var(--purple);
      }
      pre {
        margin: 14px 0 0;
        background: #1e1b4b;
        border-radius: 12px;
        padding: 16px;
        overflow-x: auto;
      }
      pre code {
        background: none;
        padding: 0;
        color: #e9d5ff;
        font-size: 0.84rem;
      }
      ol, ul {
        margin: 12px 0;
        padding-left: 20px;
      }
      li {
        margin-bottom: 6px;
      }
      a {
        color: var(--purple);
        text-decoration: none;
        font-weight: 600;
      }
      a:hover {
        text-decoration: underline;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: var(--purple-bg);
        color: var(--purple);
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 5px 12px;
        border-radius: 999px;
        margin-bottom: 12px;
      }
      .subtitle {
        color: var(--muted);
        font-size: 1.05rem;
        margin-bottom: 22px;
      }
      .example {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        margin-top: 14px;
        border: 1.5px solid var(--border);
        border-radius: 14px;
        background: #fff;
        padding: 10px 18px 10px 12px;
      }
      .example img {
        width: 28px;
        height: 28px;
        border-radius: 8px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 18px;
      }
      .chip {
        border-radius: 999px;
        padding: 6px 14px;
        font-size: 0.8rem;
        font-weight: 600;
      }
      .chip.green { background: var(--green-bg); color: var(--green); }
      .chip.pink { background: var(--pink-bg); color: var(--pink); }
      .chip.amber { background: var(--amber-bg); color: var(--amber); }
      .chip.sky { background: var(--sky-bg); color: var(--sky); }
      .callout {
        background: linear-gradient(135deg, var(--green-bg), var(--sky-bg));
        border: 1.5px solid #bbf7d0;
        border-radius: 14px;
        padding: 20px 22px;
        margin-top: 18px;
      }
      .callout h3 {
        font-size: 1rem;
        font-weight: 700;
        color: var(--green);
        margin-bottom: 10px;
      }
      .callout p {
        font-size: 0.88rem;
        color: #374151;
        margin-bottom: 8px;
      }
      .callout p:last-child { margin-bottom: 0; }
      .callout strong { color: var(--text); }
      .steps {
        list-style: none;
        padding: 0;
        counter-reset: step;
      }
      .steps li {
        counter-increment: step;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 0;
        border-bottom: 1.5px solid var(--border);
      }
      .steps li:last-child { border-bottom: none; }
      .steps li::before {
        content: counter(step);
        flex-shrink: 0;
        width: 30px;
        height: 30px;
        background: var(--purple);
        color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 700;
      }
      .flow {
        list-style: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .flow li {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 0.9rem;
      }
      .flow li:nth-child(1) { background: var(--purple-bg); }
      .flow li:nth-child(2) { background: var(--pink-bg); }
      .flow li:nth-child(3) { background: var(--amber-bg); }
      .flow li:nth-child(4) { background: var(--green-bg); }
      .flow .num {
        font-weight: 700;
        font-size: 0.75rem;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .flow li:nth-child(1) .num { background: var(--purple); color: #fff; }
      .flow li:nth-child(2) .num { background: var(--pink); color: #fff; }
      .flow li:nth-child(3) .num { background: var(--amber); color: #fff; }
      .flow li:nth-child(4) .num { background: var(--green); color: #fff; }
      @media (max-width: 640px) {
        h1 { font-size: 1.9rem; }
        .card { padding: 24px; border-radius: 16px; }
        body { padding: 32px 12px; }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="card">
        <span class="badge">${new URL(canonicalOrigin).host}</span>
        <h1>favicon API</h1>
        <p class="subtitle">Get any website's favicon with one URL. Fast, simple, and free on Cloudflare.</p>
        <p class="example">
          <img src="${sampleUrl}" alt="${sampleDomain} favicon" />
          <a href="${sampleUrl}">${sampleUrl}</a>
        </p>
        <div class="chips">
          <span class="chip green">⚡ Edge cache</span>
          <span class="chip sky">🗄️ 30-day TTL</span>
          <span class="chip pink">🔓 CORS open</span>
          <span class="chip amber">💸 Free tier</span>
        </div>
      </section>

      <section class="card">
        <h2>How to use</h2>
        <p>Hit the endpoint with any domain:</p>
        <pre><code>GET ${canonicalOrigin}/:domain</code></pre>
        <pre><code>${canonicalOrigin}/google.com
${canonicalOrigin}/linear.app
${canonicalOrigin}/github.com</code></pre>
      </section>

      <section class="card">
        <h2>How it works</h2>
        <ol class="flow">
          <li><span class="num">1</span> Edge cache lookup</li>
          <li><span class="num">2</span> R2 storage lookup</li>
          <li><span class="num">3</span> Fetch from Google → DuckDuckGo</li>
          <li><span class="num">4</span> Store & cache for next time</li>
        </ol>
      </section>

      <section class="card">
        <h2>Deploy it yourself</h2>
        <ol class="steps">
          <li>Install dependencies — <code>bun install</code></li>
          <li>Create R2 bucket — <code>bunx wrangler r2 bucket create favicons</code></li>
          <li>Deploy — <code>bun run deploy</code></li>
        </ol>
        <div class="callout">
          <h3>✨ Basically free</h3>
          <p><strong>Self-host it</strong> for zero software cost — everything here is open source: Hono, Wrangler, Vite.</p>
          <p><strong>Cloudflare's free tier</strong> gives you 100,000 requests per day and 10 GB of R2 storage with 1 million reads per month. A personal favicon API sits well within those limits — you'll never pay a cent.</p>
        </div>
      </section>
    </main>
  </body>
</html>`
}

function parseDomain(rawInput: string): string | null {
  const raw = rawInput.trim()
  if (!raw) return null

  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`)
    return url.hostname || null
  } catch {
    return null
  }
}

function cacheHeaders(contentType: string): HeadersInit {
  return {
    'content-type': contentType,
    'cache-control': `public, max-age=${EDGE_CACHE_TTL_SECONDS}`,
  }
}

function createCacheKey(request: Request): Request {
  const url = new URL(request.url)
  url.search = ''
  return new Request(url.toString(), request)
}

function withEdgeCache(
  executionCtx: ExecutionContext,
  cacheKey: Request,
  response: Response
): Response {
  executionCtx.waitUntil(cache.put(cacheKey, response.clone()))
  return response
}

app.get('/', (c) => {
  const origin = new URL(c.req.url).origin
  const canonicalOrigin = c.env.CANONICAL_ORIGIN ?? origin
  const response = c.html(landingPageHtml(origin, canonicalOrigin))
  response.headers.set('cache-control', `public, max-age=${EDGE_CACHE_TTL_SECONDS}`)
  return response
})

app.get('/:domain{.+}', async (c) => {
  const domain = parseDomain(c.req.param('domain'))
  if (!domain) return c.text('Invalid domain', 400)

  const cacheKey = createCacheKey(c.req.raw)

  // 1. Edge cache
  const edgeCached = await cache.match(cacheKey)
  if (edgeCached) return edgeCached

  // 2. R2
  const r2Object = await c.env.FAVICONS.get(domain)
  if (r2Object) {
    const response = new Response(r2Object.body, {
      headers: cacheHeaders(r2Object.httpMetadata?.contentType ?? DEFAULT_ICON_CONTENT_TYPE),
    })
    return withEdgeCache(c.executionCtx, cacheKey, response)
  }

  // 3. Fetch from Google → DuckDuckGo
  const favicon = await createFaviconFinder(fetch.bind(globalThis))(domain)

  if (!favicon) {
    const response = new Response(FALLBACK_SVG, {
      headers: cacheHeaders(FALLBACK_CONTENT_TYPE),
    })
    return withEdgeCache(c.executionCtx, cacheKey, response)
  }

  const response = new Response(favicon.data, {
    headers: cacheHeaders(favicon.contentType),
  })

  c.executionCtx.waitUntil(
    Promise.all([
      c.env.FAVICONS.put(domain, favicon.data.slice(0), {
        httpMetadata: { contentType: favicon.contentType },
      }),
      cache.put(cacheKey, response.clone()),
    ])
  )

  return response
})

export default app
