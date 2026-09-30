import { isValidSitemapSlug } from '@/lib/utils/sitemapHelper'

describe('sitemap content URL filtering', () => {
  it.each([
    '', '#contact', 'mailto:hello@example.com', 'tel:+861234',
    'javascript:void(0)', 'data:text/plain,hello', 'ftp://example.com/file',
    '?s=keyword', 'article/hello?ref=menu', '/article/hello#notes',
    'search', '/search/', '/search.html', '/search/keyword/page/2',
    'https://example.com/search/', '//example.com/rss/feed.xml',
    '/rss/atom.xml', 'rss/feed.json', 'https://', '/bad%escape'
  ])('excludes non-content URL %s', slug => {
    expect(isValidSitemapSlug(slug)).toBe(false)
  })

  it.each([
    'http-guide', '/article/hello', '/tag/搜索', '/category/Tools%20%26%20Tips',
    '/article/hello.html', 'https://example.com/about', '//example.com/about'
  ])('preserves a content URL %s for same-site validation', slug => {
    expect(isValidSitemapSlug(slug)).toBe(true)
  })
})
