const FETCH_TIMEOUT_MS = 5000

export function createFaviconFinder(fetchFn: typeof fetch) {
  async function tryFetch(url: string): Promise<{ data: ArrayBuffer; contentType: string } | null> {
    try {
      const response = await fetchFn(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
      if (!response.ok) return null

      const data = await response.arrayBuffer()
      if (data.byteLength === 0) return null

      const contentType = response.headers.get('content-type')?.split(';')[0].trim() ?? 'image/x-icon'
      return { data, contentType }
    } catch (err) {
      console.error(`[favicon] fetch failed for ${url}:`, err)
      return null
    }
  }

  return async function find(domain: string) {
    const urls = [
      `https://www.google.com/s2/favicons?sz=64&domain=https://${domain}`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    ]

    for (const url of urls) {
      const result = await tryFetch(url)
      if (result) return result
    }

    return null
  }
}
