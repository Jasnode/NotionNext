import { isBrowser } from '../../utils'
import { resolveNotionPageUrl } from './pageUrl'
import { getNotionLinkProps } from './linkTarget'

/** Keep legacy/client-inserted links consistent with the server renderer. */
export const convertInnerUrl = ({
  allPages,
  lang,
  innerPageUrlParentPath = false
}) => {
  if (!isBrowser) return

  const anchors = document
    .getElementById('notion-article')
    ?.querySelectorAll('a.notion-link, a.notion-collection-card, a.notion-page-link')
  if (!anchors) return

  const { origin, pathname } = window.location
  const langPrefix = pathname.split('/').filter(Boolean)[0] === lang ? `/${lang}` : ''
  for (const anchor of anchors) {
    const href = anchor.getAttribute('href')
    if (!href) continue

    const resolved = resolveNotionPageUrl(href, allPages, langPrefix, {
      siteOrigin: origin,
      parentPath: innerPageUrlParentPath && anchor.classList.contains('notion-page-link')
        ? pathname : undefined
    })
    if (resolved !== href) anchor.setAttribute('href', resolved)

    const linkProps = getNotionLinkProps({
      href: resolved,
      target: anchor.getAttribute('target'),
      rel: anchor.getAttribute('rel'),
      siteOrigin: origin,
      preferSameTab: true
    })
    for (const [key, value] of Object.entries(linkProps)) {
      if (value != null && anchor.getAttribute(key) !== value) anchor.setAttribute(key, value)
    }
  }
}
