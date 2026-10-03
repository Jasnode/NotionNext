const HTTP_LINK = /^(?:https?:)?\/\//i

const getSiteOrigin = siteOrigin => {
  const value = siteOrigin || (typeof window !== 'undefined' ? window.location?.origin : undefined)
  try {
    return value ? new URL(value).origin : undefined
  } catch {
    return undefined
  }
}

const isSameSiteLink = (href, siteOrigin) => {
  if (typeof href !== 'string' || !href) return false
  const origin = getSiteOrigin(siteOrigin)
  try {
    const url = new URL(href, origin || 'https://local.invalid')
    return ['http:', 'https:'].includes(url.protocol) &&
      url.origin === (origin || 'https://local.invalid')
  } catch {
    return false
  }
}

export const shouldOpenNotionLinkInNewTab = (href, target, siteOrigin) => {
  if (target === '_blank' || (typeof href === 'string' && href.endsWith('#'))) return true
  return typeof href === 'string' && HTTP_LINK.test(href) && !isSameSiteLink(href, siteOrigin)
}

/** Shared by initial HTML and legacy/client-inserted Notion links. */
export const getNotionLinkProps = ({ href, target, rel, siteOrigin, preferSameTab = false }) => {
  if (preferSameTab && target === '_blank' && isSameSiteLink(href, siteOrigin)) target = '_self'
  if (!shouldOpenNotionLinkInNewTab(href, target, siteOrigin)) return { target, rel }
  const tokens = new Set((rel || '').split(/\s+/).filter(Boolean))
  tokens.add('noopener')
  tokens.add('noreferrer')
  return { target: '_blank', rel: [...tokens].join(' ') }
}
