const isAbsoluteHttpUrl = value =>
  typeof value === 'string' && /^(https?:)?\/\//i.test(value.trim())

export const normalizeSitemapBaseUrl = link => {
  if (typeof link !== 'string') return ''
  return link.trim().replace(/\/+$/, '')
}

export const normalizeSitemapLocale = locale => {
  if (!locale) return ''
  const value = String(locale).trim()
  if (!value) return ''
  return value.startsWith('/') ? value : `/${value}`
}

export const toSitemapDateString = (
  dateInput,
  fallbackDate = new Date().toISOString().split('T')[0]
) => {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return fallbackDate
  }
  return date.toISOString().split('T')[0]
}

export const getLatestSitemapDate = (items = [], fallbackDate = '') => {
  const latest = items.reduce((currentLatest, item) => {
    const candidate = toSitemapDateString(
      item?.lastEditedDay || item?.publishDay,
      ''
    )
    return candidate > currentLatest ? candidate : currentLatest
  }, '')

  return latest || fallbackDate
}

export const buildSitemapLoc = ({ baseUrl, locale = '', slug } = {}) => {
  const normalizedBaseUrl = normalizeSitemapBaseUrl(baseUrl)
  if (!normalizedBaseUrl) return null

  const normalizedLocale = normalizeSitemapLocale(locale)

  if (slug === undefined || slug === null || slug === '') {
    return `${normalizedBaseUrl}${normalizedLocale}`
  }

  const rawSlug = String(slug).trim()
  if (!rawSlug || rawSlug === '#') {
    return null
  }

  if (isAbsoluteHttpUrl(rawSlug)) {
    try {
      const targetUrl = new URL(rawSlug, normalizedBaseUrl)
      const siteUrl = new URL(normalizedBaseUrl)

      // sitemap 仅收录本站链接，避免外链混入
      if (targetUrl.hostname !== siteUrl.hostname) {
        return null
      }

      return targetUrl.toString().replace(/\/+$/, '')
    } catch (error) {
      return null
    }
  }

  const normalizedSlug = rawSlug.replace(/^\/+/, '')
  if (!normalizedSlug) {
    return `${normalizedBaseUrl}${normalizedLocale}`
  }

  return `${normalizedBaseUrl}${normalizedLocale}/${normalizedSlug}`
}

export const normalizeSiteUrl = normalizeSitemapBaseUrl

export const createSiteUrl = (baseUrl, slug) =>
  buildSitemapLoc({ baseUrl, slug })

// getPageProperties normalizes custom Notion status labels to 'Published'.
// Match the public Post filters used by the category/tag list routes.
export const buildCollectionSitemapFields = ({
  allPages = [], baseUrl, locale = '', postsPerPage = 12, paginated = true
}) => {
  const posts = (allPages ?? []).filter(p => p.type === 'Post' && p.status === 'Published')
  const groups = new Map([['', posts]])
  for (const post of posts) {
    for (const [kind, values] of [
      ['tag', post.tags],
      ['category', Array.isArray(post.category) ? post.category : [post.category]]
    ]) {
      for (const name of new Set(Array.isArray(values) ? values : [])) {
        if (typeof name !== 'string' || !name.trim()) continue
        const slug = `${kind}/${encodeURIComponent(name)}`
        if (!groups.has(slug)) groups.set(slug, [])
        groups.get(slug).push(post)
      }
    }
  }
  const pageSize = Math.max(1, Math.floor(Number(postsPerPage)) || 12)
  const fields = []
  for (const [slug, items] of groups) {
    const lastmod = getLatestSitemapDate(items)
    const total = paginated ? Math.ceil(items.length / pageSize) : 1
    for (let page = slug ? 1 : 2; page <= total; page++) {
      const path = page === 1 ? slug : `${slug ? slug + '/' : ''}page/${page}`
      const loc = buildSitemapLoc({ baseUrl, locale, slug: path })
      if (loc) fields.push({loc, ...(lastmod ? {lastmod} : {}), changefreq: 'weekly'})
    }
  }
  return fields
}
