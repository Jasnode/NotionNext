import { isBrowser } from '../../utils'
import { resolveNotionPageUrl } from './pageUrl'

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

    // Only local destinations switch to this tab. Source pages remain external.
    if (anchor.target === '_blank') {
      try {
        if (new URL(anchor.href).origin === origin) anchor.target = '_self'
      } catch {
        // Keep nonstandard destinations and their existing targets unchanged.
      }
    }
    // Preserve the existing opt-in convention for opening a trailing-# link.
    if (anchor.href.endsWith('#')) anchor.target = '_blank'
  }
}
