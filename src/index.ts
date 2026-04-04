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
