import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createFaviconFinder } from './favicon'
import FALLBACK_SVG from './fallback.svg?raw'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.use('*', cors())

app.get('/:domain{.+}', async (c) => {
  const raw = c.req.param('domain').trim()
  const domain = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname
  const cacheKey = new Request(c.req.url)
  const cache = caches.default

  // 1. Edge cache
  const edgeCached = await cache.match(cacheKey)
  if (edgeCached) return edgeCached

  const headers = {
    'content-type': 'image/x-icon',
    'cache-control': 'public, max-age=2592000', // 30 days
  }

  // 2. R2
  const r2Object = await c.env.FAVICONS.get(domain)
  if (r2Object) {
    const response = new Response(r2Object.body, {
      headers: { ...headers, 'content-type': r2Object.httpMetadata?.contentType ?? 'image/x-icon' },
    })
    c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()))
    return response
  }

  // 3. Fetch from Google → DuckDuckGo
  const favicon = await createFaviconFinder(fetch.bind(globalThis))(domain)

  if (!favicon) {
    const response = new Response(FALLBACK_SVG, {
      headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=2592000' },
    })
    c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()))
    return response
  }

  const response = new Response(favicon.data, {
    headers: { ...headers, 'content-type': favicon.contentType },
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
