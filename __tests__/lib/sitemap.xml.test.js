import fs from 'fs'
import { generateSitemapXml } from '@/lib/utils/sitemap.xml'
import { siteConfig } from '@/lib/config'
import BLOG from '@/blog.config'
import { getServerSideProps } from '@/pages/sitemap.xml'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { getServerSideSitemap } from 'next-sitemap'

jest.mock('@/lib/db/SiteDataApi', () => ({ fetchGlobalAllData: jest.fn() }))
jest.mock('next-sitemap', () => ({ getServerSideSitemap: jest.fn(() => ({ props: {} })) }))

jest.mock('@/lib/config', () => ({
  siteConfig: jest.fn((key, defaultVal, extendConfig = {}) => {
    if (key === 'LINK' && extendConfig?.LINK) {
      return extendConfig.LINK
    }
    return defaultVal
  })
}))

describe('generateSitemapXml', () => {
  let writeSpy

  beforeEach(() => {
    siteConfig.mockClear()
    writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
  })

  afterEach(() => {
    writeSpy.mockRestore()
  })

  it('keeps articles and collections consistent in both sitemap modes with localized Notion statuses', async () => {
    const originalStatus = BLOG.NOTION_PROPERTY_NAME.status_publish
    BLOG.NOTION_PROPERTY_NAME.status_publish = '已发布'
    try {
      const data = {
        NOTION_CONFIG: { LINK: 'https://example.com' },
        allPages: [
          { slug: 'article/public', type: 'Post', status: 'Published', category: 'Code', tags: ['Tools'] },
          { slug: 'article/draft', type: 'Post', status: 'Draft', category: 'Secret' }
        ]
      }
      generateSitemapXml(data)
      const xml = writeSpy.mock.calls[0][1]
      fetchGlobalAllData.mockResolvedValue(data)
      await getServerSideProps({ res: { setHeader: jest.fn() } })
      const urls = getServerSideSitemap.mock.calls[0][1].map(field => field.loc)
      for (const path of ['article/public', 'category/Code', 'tag/Tools']) {
        expect(xml).toContain(`<loc>https://example.com/${path}</loc>`)
        expect(urls).toContain(`https://example.com/${path}`)
      }
      expect(xml).not.toContain('article/draft')
      expect(urls).not.toContain('https://example.com/article/draft')
    } finally {
      BLOG.NOTION_PROPERTY_NAME.status_publish = originalStatus
    }
  })

  it.each([undefined, null])('accepts unavailable allPages (%s) in both sitemap modes', async allPages => {
    const data = { NOTION_CONFIG: { LINK: 'https://example.com' }, allPages }
    expect(() => generateSitemapXml(data)).not.toThrow()
    fetchGlobalAllData.mockResolvedValue(data)
    await expect(getServerSideProps({ res: { setHeader: jest.fn() } })).resolves.toEqual({ props: {} })
    expect(getServerSideSitemap.mock.calls[0][1]).toHaveLength(4)
  })

  it('filters invalid sitemap entries and uses last edited date first', () => {
    generateSitemapXml({
      NOTION_CONFIG: {
        LINK: 'https://example.com/'
      },
      allPages: [
        {
          slug: '/hello-world',
          status: 'Published',
          publishDay: '2026-02-20',
          lastEditedDay: '2026-02-22'
        },
        {
          slug: '/draft-post',
          status: 'Invisible',
          publishDay: '2026-02-20',
          lastEditedDay: '2026-02-22'
        },
        {
          slug: 'https://external.com/landing',
          status: 'Published',
          publishDay: '2026-02-20'
        },
        {
          slug: '#section',
          status: 'Published',
          publishDay: '2026-02-20'
        },
        {
          slug: 'search',
          status: 'Published',
          publishDay: '2026-02-20'
        },
        {
          slug: 'rss/feed.xml',
          status: 'Published',
          publishDay: '2026-02-20'
        },
        {
          slug: 'invalid-date-post',
          status: 'Published',
          publishDay: 'invalid-date'
        },
        {
          slug: '/hello-world',
          status: 'Published',
          publishDay: '2026-02-21',
          lastEditedDay: '2026-03-01'
        }
      ]
    })

    expect(writeSpy).toHaveBeenCalledTimes(2)

    const xml = writeSpy.mock.calls[0][1]
    expect(xml).toContain('<loc>https://example.com/hello-world</loc>')
    expect(xml).toContain('<lastmod>2026-03-01</lastmod>')
    expect(xml).toMatch(
      /<loc>https:\/\/example\.com<\/loc>\s*<lastmod>2026-03-01<\/lastmod>/
    )
    expect(xml).toContain('<loc>https://example.com/invalid-date-post</loc>')
    expect(xml).not.toContain('<loc>https://example.com/draft-post</loc>')
    expect(xml).not.toContain('https://external.com/landing')
    expect(xml).not.toContain('<loc>https://example.com/#section</loc>')
    expect(xml).not.toContain('<loc>https://example.com/search</loc>')
    expect(xml).not.toContain('<loc>https://example.com/rss/feed.xml</loc>')
    expect(xml).not.toContain(
      'https://example.com/https://external.com/landing'
    )
    expect(xml).not.toContain('Invalid Date')
    expect(
      (xml.match(/<loc>https:\/\/example\.com\/hello-world<\/loc>/g) || [])
        .length
    ).toBe(1)
  })

  it('does not emit navigation actions or search variants as content pages', () => {
    const excluded = ['mailto:hello@example.com', '/search/keyword', 'https://example.com/search/', '/about?ref=nav', '/about#contact']
    generateSitemapXml({
      NOTION_CONFIG: { LINK: 'https://example.com' },
      allPages: [...excluded, '/about'].map(slug => ({ slug, status: 'Published' }))
    })
    const xml = writeSpy.mock.calls[0][1]
    expect(xml).toContain('<loc>https://example.com/about</loc>')
    expect(xml).not.toMatch(/mailto:|search|ref=nav|#contact/)
  })

  it('prefers the dated entry when a duplicate loc has no lastmod', () => {
    generateSitemapXml({
      NOTION_CONFIG: { LINK: 'https://example.com' },
      allPages: [
        { slug: 'mixed-date-post', status: 'Published' },
        {
          slug: 'mixed-date-post',
          status: 'Published',
          publishDay: '2026-02-25'
        }
      ]
    })

    const xml = writeSpy.mock.calls[0][1]
    expect(xml).toMatch(
      /<loc>https:\/\/example\.com\/mixed-date-post<\/loc>\s*<lastmod>2026-02-25<\/lastmod>/
    )
  })
})

describe('dynamic multilingual sitemap', () => {
  it('serves all configured databases with locale prefixes and the SSR cache policy', async () => {
    const originalPageId = BLOG.NOTION_PAGE_ID
    BLOG.NOTION_PAGE_ID = 'main-database,en:english-database'
    try {
      fetchGlobalAllData.mockImplementation(({ pageId }) => Promise.resolve({
        NOTION_CONFIG: { LINK: 'https://example.com' },
        allPages: Array.from({ length: 13 }, (_, index) => ({
          slug: `article/${pageId}-${index + 1}`,
          type: 'Post',
          status: 'Published',
          category: 'Code',
          tags: ['Tools']
        }))
      }))
      const res = { setHeader: jest.fn() }
      await getServerSideProps({ res })

      expect(fetchGlobalAllData.mock.calls).toEqual([
        [{ pageId: 'main-database', from: 'sitemap.xml' }],
        [{ pageId: 'english-database', from: 'sitemap.xml' }]
      ])
      const urls = getServerSideSitemap.mock.calls[0][1].map(field => field.loc)
      for (const prefix of ['', '/en']) {
        for (const slug of ['', '/archive', '/page/2', '/category/Code/page/2', '/tag/Tools/page/2']) {
          expect(urls).toContain(`https://example.com${prefix}${slug}`)
        }
      }
      expect(urls).toContain('https://example.com/article/main-database-1')
      expect(urls).toContain('https://example.com/en/article/english-database-1')
      expect(urls).not.toContain('https://example.com/article/english-database-1')
      expect(new Set(urls).size).toBe(urls.length)
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600, stale-while-revalidate=59')
    } finally {
      BLOG.NOTION_PAGE_ID = originalPageId
    }
  })
})
