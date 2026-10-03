const NOTION_ID = /^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i
const LOCAL_ORIGIN = 'https://local.invalid'
const urlSuffix = url => url.search + (url.hash || (url.href.endsWith('#') ? '#' : ''))

const withLangPrefix = (pathname, langPrefix) =>
  langPrefix && pathname !== langPrefix && !pathname.startsWith(`${langPrefix}/`)
    ? langPrefix + pathname
    : pathname

/** Resolve published pages before rendering; other Notion pages stay at their source. */
export const resolveNotionPageUrl = (value, pages = [], langPrefix = '', options = {}) => {
  if (typeof value !== 'string' || !value || value.startsWith('#')) return value

  let url
  try {
    url = new URL(value, LOCAL_ORIGIN)
  } catch {
    return value
  }
  let siteOrigin
  try {
    siteOrigin = options.siteOrigin && new URL(options.siteOrigin).origin
  } catch {
    // An unset or malformed site URL must not prevent content from rendering.
  }
  const isLocal = url.origin === LOCAL_ORIGIN || url.origin === siteOrigin
  const isNotion = /(^|\.)notion\.(so|site)$/i.test(url.hostname)
  if ((!isLocal && !isNotion) || !['http:', 'https:'].includes(url.protocol)) {
    return value
  }

  const pathname = isLocal && langPrefix && url.pathname.startsWith(`${langPrefix}/`)
    ? url.pathname.slice(langPrefix.length)
    : url.pathname
  const path = pathname.replace(/^\/+|\/+$/g, '')
  // Local slugs must never be mistaken for IDs. Notion also uses title-ID URLs.
  const candidate = isLocal
    ? path
    : path.split('/').pop()?.match(/(?:^|-)([0-9a-f]{32}|[0-9a-f-]{36})$/i)?.[1]
  if (!candidate || !NOTION_ID.test(candidate)) return value

  const compact = candidate.replace(/-/g, '').toLowerCase()
  const shortId = `${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`
  const page = (Array.isArray(pages) ? pages : []).find(page =>
    typeof page?.href === 'string' && page.href && (
      (typeof page.id === 'string' && page.id.replace(/-/g, '').toLowerCase() === compact) ||
      (typeof page.short_id === 'string' && page.short_id.toLowerCase() === shortId)
    )
  )
  if (page) {
    try {
      const target = new URL(page.href, LOCAL_ORIGIN)
      // Preserve deep links, including an empty hash used to request a new tab.
      if (url.search && target.search) {
        // Keep destination options (for example a referral or view), while the
        // source wins for matching keys and retains repeated query parameters.
        for (const key of new Set(url.searchParams.keys())) target.searchParams.delete(key)
        for (const [key, value] of url.searchParams) target.searchParams.append(key, value)
      } else if (url.search) {
        target.search = url.search
      }
      if (url.hash || url.href.endsWith('#')) target.hash = url.hash || '#'
      if (target.origin === LOCAL_ORIGIN || target.origin === siteOrigin) {
        return withLangPrefix(target.pathname, langPrefix) + urlSuffix(target)
      }
      if (['http:', 'https:', 'mailto:', 'tel:'].includes(target.protocol)) return target.href
    } catch {
      // A malformed destination in Notion must not abort rendering the article.
    }
  }
  if (options.parentPath?.startsWith('/')) {
    const parent = options.parentPath.split(/[?#]/)[0].replace(/\/+$/, '')
    return withLangPrefix(`${parent}/${compact}`, langPrefix) + urlSuffix(url)
  }
  return isNotion ? value : `https://www.notion.so/${compact}${urlSuffix(url)}`
}
