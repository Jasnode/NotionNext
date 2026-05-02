import fs from 'fs'
import { generateSitemapXml } from '@/lib/utils/sitemap.xml'
import { siteConfig } from '@/lib/config'

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
    expect(xml).toContain('<loc>https://example.com/invalid-date-post</loc>')
    expect(xml).not.toContain('<loc>https://example.com/draft-post</loc>')
    expect(xml).not.toContain('https://external.com/landing')
    expect(xml).not.toContain('<loc>https://example.com/#section</loc>')
    expect(xml).not.toContain('<loc>https://example.com/search</loc>')
    expect(xml).not.toContain('<loc>https://example.com/rss/feed.xml</loc>')
    expect(xml).not.toContain('https://example.com/https://external.com/landing')
    expect(xml).not.toContain('Invalid Date')
    expect((xml.match(/<loc>https:\/\/example\.com\/hello-world<\/loc>/g) || []).length).toBe(1)
  })
})
