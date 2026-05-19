const ABSOLUTE_HTTP_LIKE_RE = /^(https?:)?\/\//i

// 这类静态 HTML 页面需要走浏览器原生导航，避免被 Next.js 客户端路由接管。
const PUBLIC_HTML_HREFS = new Set(['/coffee', '/coffee.html'])

const stripLeadingWww = hostname =>
  String(hostname || '')
    .replace(/^www\./i, '')
    .toLowerCase()

const normalizeSiteUrl = siteUrl => {
  if (typeof siteUrl !== 'string') return ''
  const trimmed = siteUrl.trim()
  if (!trimmed) return ''
  try {
    return new URL(trimmed).toString()
  } catch {
    return ''
  }
}

const toAbsoluteUrl = (value, siteUrl) => {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl)
  if (!normalizedSiteUrl || !isAbsoluteHttpLikeUrl(value)) return null

  try {
    return new URL(String(value).trim(), normalizedSiteUrl)
  } catch {
    return null
  }
}

const isSameSiteUrl = (targetUrl, siteUrl) => {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl)
  if (!normalizedSiteUrl || !targetUrl) return false

  try {
    const site = new URL(normalizedSiteUrl)
    return stripLeadingWww(targetUrl.hostname) === stripLeadingWww(site.hostname)
  } catch {
    return false
  }
}

export const isAbsoluteHttpLikeUrl = value =>
  typeof value === 'string' && ABSOLUTE_HTTP_LIKE_RE.test(value.trim())

export const isExternalSiteUrl = (value, siteUrl) => {
  const targetUrl = toAbsoluteUrl(value, siteUrl)
  if (!targetUrl) return false
  return !isSameSiteUrl(targetUrl, siteUrl)
}

export const normalizeInternalHref = (value, siteUrl) => {
  const targetUrl = toAbsoluteUrl(value, siteUrl)
  if (!targetUrl || isExternalSiteUrl(value, siteUrl)) {
    return typeof value === 'string' ? value : ''
  }

  return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}` || '/'
}

export const getHrefUrlString = href => {
  if (typeof href === 'string') {
    return href
  }

  if (
    typeof href === 'object' &&
    href !== null &&
    typeof href.pathname === 'string'
  ) {
    return href.pathname
  }

  return ''
}

export const isPublicHtmlHref = href => {
  const urlString = getHrefUrlString(href)
  if (!urlString || isAbsoluteHttpLikeUrl(urlString)) return false

  const pathname = urlString.split(/[?#]/)[0]
  const normalizedPath =
    pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname

  return PUBLIC_HTML_HREFS.has(normalizedPath)
}

export const resolveLinkHref = (href, siteUrl) => {
  const urlString = getHrefUrlString(href)

  if (!isAbsoluteHttpLikeUrl(urlString)) {
    return { isExternal: false, href }
  }

  const absoluteUrl = toAbsoluteUrl(urlString, siteUrl)
  if (!absoluteUrl) {
    return { isExternal: false, href }
  }

  if (isSameSiteUrl(absoluteUrl, siteUrl)) {
    return {
      isExternal: false,
      href: normalizeInternalHref(absoluteUrl.toString(), siteUrl)
    }
  }

  return {
    isExternal: true,
    href: absoluteUrl.toString()
  }
}
