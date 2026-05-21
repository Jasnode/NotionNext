/**
 * 验证slug是否可以放入sitemap
 * 统一过滤逻辑，供 lib/utils/sitemap.xml.js 和 pages/sitemap.xml.js 共用
 */
export function isValidSitemapSlug(slug) {
  if (!slug || typeof slug !== 'string') return false
  const trimmed = slug.trim()
  if (!trimmed) return false
  // 绝对 URL 交由 buildSitemapLoc 按站点域名判断，避免误伤 http-guide 这类普通 slug
  // 过滤锚点链接
  if (trimmed.startsWith('#')) return false
  // 过滤不应出现在sitemap中的路径
  const excludeSlugs = ['search', 'rss/feed.xml', 'rss/atom.xml', 'rss/feed.json']
  if (excludeSlugs.includes(trimmed) || excludeSlugs.includes(trimmed.replace(/^\//, ''))) return false
  return true
}
