import { resolveNotionPageUrl } from '@/lib/db/notion/pageUrl'

const id = '4aea95fb3fd5fcf81846aaaaaaaaaaaa'
const pages = [{ id, short_id: 'fcf8-1846-aaaaaaaaaaaa', href: '/links' }]

describe('Notion page URLs', () => {
  it.each([id, `/${id}`, '4aea95fb-3fd5-fcf8-1846-aaaaaaaaaaaa', `https://www.notion.so/${id}`, `https://example.notion.site/Links-${id}`])(
    'resolves published pages before hydration: %s', value => {
      expect(resolveNotionPageUrl(value, pages)).toBe('/links')
    }
  )

  it('retains query strings, block fragments and locale prefixes', () => {
    expect(resolveNotionPageUrl(`/${id}?pvs=4#block`, pages, '/en'))
      .toBe('/en/links?pvs=4#block')
    expect(resolveNotionPageUrl(id, [{ id, href: '/en/links' }], '/en'))
      .toBe('/en/links')
  })

  it('supports the compact published page records used by the global context', () => {
    expect(resolveNotionPageUrl(id, [{ short_id: pages[0].short_id, href: '/links' }]))
      .toBe('/links')
  })

  it('keeps unpublished child pages at Notion instead of inventing local routes', () => {
    expect(resolveNotionPageUrl(`/${id}?pvs=4#block`))
      .toBe(`https://www.notion.so/${id}?pvs=4#block`)
    const original = `https://example.notion.site/Links-${id}?pvs=4#block`
    expect(resolveNotionPageUrl(original)).toBe(original)
  })

  it('maps absolute URLs on the configured blog origin during SSR', () => {
    expect(resolveNotionPageUrl(`https://blog.example.com/${id}#section`, pages, '/en', {
      siteOrigin: 'https://blog.example.com/'
    })).toBe('/en/links#section')
  })

  it('honors the optional parent-path mode before hydration', () => {
    expect(resolveNotionPageUrl(`https://www.notion.so/${id}?pvs=4#block`, [], '/en', {
      parentPath: '/article/parent'
    })).toBe(`/en/article/parent/${id}?pvs=4#block`)
    expect(resolveNotionPageUrl(id, pages, '/en', { parentPath: '/article/parent' }))
      .toBe('/en/links')
  })

  it.each([`https://example.com/${id}`, `//example.com/${id}`, '/article/59', '#block', 'mailto:a@example.com', undefined])(
    'leaves unrelated destinations intact: %s', value => {
      expect(resolveNotionPageUrl(value, pages)).toBe(value)
    }
  )
})
