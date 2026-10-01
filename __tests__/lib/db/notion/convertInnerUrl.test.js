jest.mock('notion-utils', () => ({
  idToUuid: jest.fn(id => {
    const compactId = String(id).replace(/-/g, '')
    if (!/^[0-9a-fA-F]{32}$/.test(compactId)) return id

    return [
      compactId.slice(0, 8),
      compactId.slice(8, 12),
      compactId.slice(12, 16),
      compactId.slice(16, 20),
      compactId.slice(20)
    ].join('-')
  })
}))

import { convertInnerUrl } from '@/lib/db/notion/convertInnerUrl'

describe('convertInnerUrl', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    window.history.replaceState({}, '', 'http://localhost/notice')
  })

  it('keeps restored Notion source references in a new tab', () => {
    document.body.innerHTML = '<div id="notion-article"><a class="notion-page-link" href="https://www.notion.so/da8daa2f8d19420987d51cc9bdf01241" target="_blank">Source</a></div>'
    convertInnerUrl({ allPages: [] })
    expect(document.querySelector('a')).toHaveAttribute('target', '_blank')
  })

  it('leaves unrelated external UUID links and disabled anchors alone', () => {
    document.body.innerHTML = '<div id="notion-article"><a class="notion-link" href="https://example.com/4aea95fb3fd5fcf81846aaaaaaaaaaaa" target="_blank">External</a><a class="notion-collection-card">Disabled</a></div>'
    convertInnerUrl({ allPages: [{ href: '/links', short_id: 'fcf8-1846-aaaaaaaaaaaa' }] })
    expect(document.querySelector('a')).toHaveAttribute('href', 'https://example.com/4aea95fb3fd5fcf81846aaaaaaaaaaaa')
    expect(document.querySelector('a')).toHaveAttribute('target', '_blank')
    expect(document.querySelector('.notion-collection-card')).not.toHaveAttribute('href')
  })

  it('does not append child IDs again when processing server-rendered parent paths', () => {
    window.history.replaceState({}, '', 'http://localhost/en/article/parent')
    const href = '/en/article/parent/da8daa2f8d19420987d51cc9bdf01241#block'
    document.body.innerHTML = `<div id="notion-article"><a class="notion-page-link" href="${href}">Child</a></div>`
    convertInnerUrl({ allPages: [], lang: 'en', innerPageUrlParentPath: true })
    convertInnerUrl({ allPages: [], lang: 'en', innerPageUrlParentPath: true })
    expect(document.querySelector('a')).toHaveAttribute('href', href)
  })

  it('does not duplicate a locale prefix already present in the published URL', () => {
    window.history.replaceState({}, '', 'http://localhost/en/article/parent')
    document.body.innerHTML = '<div id="notion-article"><a class="notion-link" href="https://www.notion.so/4aea95fb3fd5fcf81846aaaaaaaaaaaa?pvs=4#section" target="_blank">Links</a></div>'
    convertInnerUrl({
      allPages: [{ href: '/en/links', short_id: 'fcf8-1846-aaaaaaaaaaaa' }],
      lang: 'en'
    })
    expect(document.querySelector('a')).toHaveAttribute('href', '/en/links?pvs=4#section')
  })

  it('maps notice links to published Page records from allLinkPages', () => {
    document.body.innerHTML = `
      <div id="notion-article">
        <a class="notion-link" href="https://www.notion.so/4aea95fb3fd5fcf81846aaaaaaaaaaaa" target="_blank">Links</a>
      </div>
    `

    convertInnerUrl({
      allPages: [
        {
          title: 'Links',
          type: 'Page',
          href: '/links',
          slug: 'links',
          short_id: 'fcf8-1846-aaaaaaaaaaaa'
        }
      ],
      lang: undefined
    })

    expect(document.querySelector('a.notion-link')).toHaveAttribute(
      'href',
      '/links'
    )
  })

  it('does not resolve Page links when only post navigation data is present', () => {
    const rawNotionUrl =
      'https://www.notion.so/4aea95fb3fd5fcf81846aaaaaaaaaaaa'
    document.body.innerHTML = `
      <div id="notion-article">
        <a class="notion-link" href="${rawNotionUrl}" target="_blank">Links</a>
      </div>
    `

    convertInnerUrl({
      allPages: [
        {
          title: 'Post only',
          type: 'Post',
          href: '/post-only',
          slug: 'post-only',
          short_id: '1111-2222-bbbbbbbbbbbb'
        }
      ],
      lang: undefined
    })

    expect(document.querySelector('a.notion-link')).toHaveAttribute(
      'href',
      rawNotionUrl
    )
  })

  it('keeps published Page slugs ahead of parent-path fallback', () => {
    document.body.innerHTML = `
      <div id="notion-article">
        <a class="notion-page-link" href="https://www.notion.so/4aea95fb3fd5fcf81846aaaaaaaaaaaa" target="_blank">Links</a>
      </div>
    `

    convertInnerUrl({
      allPages: [
        {
          title: 'Links',
          type: 'Page',
          href: '/links',
          slug: 'links',
          short_id: 'fcf8-1846-aaaaaaaaaaaa'
        }
      ],
      lang: undefined,
      innerPageUrlParentPath: true
    })

    expect(document.querySelector('a.notion-page-link')).toHaveAttribute(
      'href',
      '/links'
    )
  })

  it('can append unresolved Notion child pages to the current article path', () => {
    window.history.replaceState({}, '', 'http://localhost/article/parent-post')
    document.body.innerHTML = `
      <div id="notion-article">
        <a class="notion-page-link" href="https://www.notion.so/4aea95fb3fd5fcf81846aaaaaaaaaaaa" target="_blank">Child page</a>
      </div>
    `

    convertInnerUrl({
      allPages: [],
      lang: undefined,
      innerPageUrlParentPath: true
    })

    expect(document.querySelector('a.notion-page-link')).toHaveAttribute(
      'href',
      '/article/parent-post/4aea95fb3fd5fcf81846aaaaaaaaaaaa'
    )
  })

  it('preserves query params while resolving Notion ID', () => {
    // Notion URLs often include ?pvs=4 which must not break ID extraction
    document.body.innerHTML = `
      <div id="notion-article">
        <a class="notion-link" href="https://www.notion.so/4aea95fb3fd5fcf81846aaaaaaaaaaaa?pvs=4" target="_blank">Links</a>
      </div>
    `

    convertInnerUrl({
      allPages: [
        {
          title: 'Links',
          type: 'Page',
          href: '/links',
          slug: 'links',
          short_id: 'fcf8-1846-aaaaaaaaaaaa'
        }
      ],
      lang: undefined
    })

    expect(document.querySelector('a.notion-link')).toHaveAttribute(
      'href',
      '/links?pvs=4'
    )
  })

  it('preserves hash fragments while resolving Notion ID', () => {
    document.body.innerHTML = `
      <div id="notion-article">
        <a class="notion-link" href="https://www.notion.so/4aea95fb3fd5fcf81846aaaaaaaaaaaa#section" target="_blank">Links</a>
      </div>
    `

    convertInnerUrl({
      allPages: [
        {
          title: 'Links',
          type: 'Page',
          href: '/links',
          slug: 'links',
          short_id: 'fcf8-1846-aaaaaaaaaaaa'
        }
      ],
      lang: undefined
    })

    expect(document.querySelector('a.notion-link')).toHaveAttribute(
      'href',
      '/links#section'
    )
  })
})
