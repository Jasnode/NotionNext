const NOTION_ID = /^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i
const LOCAL_ORIGIN = 'https://local.invalid'

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
  const page = (pages || []).find(page =>
    page?.href && (
      page.id?.replace(/-/g, '').toLowerCase() === compact ||
      page.short_id?.toLowerCase() === shortId
    )
  )
  if (page) {
    const target = new URL(page.href, LOCAL_ORIGIN)
    // Preserve deep links and Notion URL options during ID -> slug conversion.
    if (url.search) target.search = url.search
    if (url.hash) target.hash = url.hash
    return target.origin === LOCAL_ORIGIN
      ? withLangPrefix(target.pathname, langPrefix) + target.search + target.hash
      : target.href
  }
  if (options.parentPath?.startsWith('/')) {
    const parent = options.parentPath.split(/[?#]/)[0].replace(/\/+$/, '')
    return withLangPrefix(`${parent}/${compact}`, langPrefix) + url.search + url.hash
  }
  return isNotion ? value : `https://www.notion.so/${compact}${url.search}${url.hash}`
}
