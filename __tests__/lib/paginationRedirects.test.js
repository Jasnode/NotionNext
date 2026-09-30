/** @jest-environment node */
const { getPathMatch } = require('next/dist/shared/lib/router/utils/path-match')
const { prepareDestination } = require('next/dist/shared/lib/router/utils/prepare-destination')
const nextConfig = require('../../next.config')
const fs = require('node:fs')
const path = require('node:path')

describe('page zero redirects compiled by Next.js', () => {
  it.each([
    ['/page/0', '/'],
    ['/page/0.html', '/'],
    ['/category/code/page/0', '/category/code'],
    ['/category/code/page/0.html', '/category/code'],
    ['/tag/code/page/0', '/tag/code'],
    ['/tag/code/page/0.html', '/tag/code'],
    ['/tag/%E6%95%99%E7%A8%8B/page/0', '/tag/%E6%95%99%E7%A8%8B']
  ])('redirects %s directly to %s', (source, expected) => {
    const redirects = nextConfig.redirects()
    const route = redirects.find(rule => getPathMatch(rule.source)(source))
    expect(route.permanent).toBe(true)
    const params = getPathMatch(route.source)(source)
    const { newUrl, parsedDestination } = prepareDestination({
      destination: route.destination, params, query: { s: 'hello world' }, appendParamsToQuery: false
    })
    expect(newUrl).toBe(expected)
    expect(newUrl).not.toMatch(/^\/\//)
    expect(parsedDestination.query.s).toBe('hello world')
  })

  it('leaves valid page numbers alone', () => {
    const pageZeroRules = nextConfig.redirects().filter(rule => rule.source.includes('/page/0'))
    for (const source of ['/page/2', '/page/10', '/category/code/page/20', '/article/page/0', '/docs/guide/page/0.html']) {
      expect(pageZeroRules.some(rule => getPathMatch(rule.source)(source))).toBe(false)
    }
  })
})

describe('search pagination redirects', () => {
  const searchCases = ['NotionNext', '%E5%BC%80%E5%8F%91%20%E5%B7%A5%E5%85%B7', 'C%2B%2B%20%26%20Java%2FJS']
    .flatMap(keyword => ['0', '1'].flatMap(page => ['', '.html'].map(extension => [
      `/search/${keyword}/page/${page}${extension}`, `/search/${keyword}`
    ])))

  it.each(searchCases.filter(([source]) => /\/page\/0(?:\.html)?$/.test(source)))('Next.js redirects %s to %s and preserves query parameters', (source, expected) => {
    const route = nextConfig.redirects().find(rule => getPathMatch(rule.source)(source))
    expect(route).toBeDefined()
    expect(route.permanent).toBe(true)
    const params = getPathMatch(route.source)(source)
    const { newUrl, parsedDestination } = prepareDestination({
      destination: route.destination,
      params,
      query: { from: 'search link' },
      appendParamsToQuery: false
    })
    expect(newUrl).toBe(expected)
    expect(parsedDestination.query.from).toBe('search link')
  })

  // Validate the rule configuration only; this does not emulate Cloudflare's URL decoding.
  const staticRules = fs.readFileSync(path.join(__dirname, '../../public/_redirects'), 'utf8')
    .split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'))
    .map(line => {
      const [source, destination, status] = line.split(/\s+/)
      return { source, destination, status }
    })

  it.each(searchCases)('static redirect configuration maps %s to %s', (source, expected) => {
    const route = staticRules.find(rule => getPathMatch(rule.source)(source))
    expect(route).toBeDefined()
    expect(route.status).toBe('301')
    const { newUrl } = prepareDestination({
      destination: route.destination,
      params: getPathMatch(route.source)(source),
      query: {},
      appendParamsToQuery: false
    })
    expect(newUrl).toBe(expected)
  })

  it('does not redirect later pages or the search index', () => {
    for (const source of ['/search/NotionNext', '/search/NotionNext/page/2', '/search/NotionNext/page/11.html']) {
      expect(nextConfig.redirects().some(rule => getPathMatch(rule.source)(source))).toBe(false)
      expect(staticRules.some(rule => getPathMatch(rule.source)(source))).toBe(false)
    }
  })
})
