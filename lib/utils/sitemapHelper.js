/**
 * 验证slug是否可以放入sitemap
 * 统一过滤逻辑，供 lib/utils/sitemap.xml.js 和 pages/sitemap.xml.js 共用
 */
export function isValidSitemapSlug(slug) {
  if (!slug || typeof slug !== 'string') return false
  const trimmed = slug.trim()
  if (!trimmed) return false
  // 菜单动作、参数页、锚点不是独立内容地址；绝对 HTTP URL 的域名由 buildSitemapLoc 检查。
  if (/[?#]/.test(trimmed)) return false
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) return false
  try {
    const url = new URL(trimmed, 'https://sitemap.invalid/')
    if (!['http:', 'https:'].includes(url.protocol)) return false
    const path = decodeURIComponent(url.pathname).replace(/\/+$/, '').replace(/\.html$/, '')
    if (/^\/search(?:\/|$)/.test(path)) return false
    if (/^\/rss\/(?:feed\.xml|atom\.xml|feed\.json)$/.test(path)) return false
    return true
  } catch {
    return false
  }
}
