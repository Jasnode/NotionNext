import { getStaticProps } from '@/pages/index'
import { fetchGlobalAllData, getPostBlocks } from '@/lib/db/SiteDataApi'
import { generateSitemapXml } from '@/lib/utils/sitemap.xml'

jest.mock('@/lib/config', () => ({
  siteConfig: (key, fallback) => key === 'POST_LIST_PREVIEW' ? true : fallback
}))
jest.mock('@/lib/db/SiteDataApi', () => ({
  fetchGlobalAllData: jest.fn(),
  getPostBlocks: jest.fn(),
  cleanPostSummaries: posts => posts ?? []
}))
jest.mock('@/lib/db/notion/getPostBlocks', () => ({ formatNotionBlock: value => value }))
jest.mock('@/lib/utils/notion.util', () => ({ adapterNotionBlockMap: value => value }))
jest.mock('@/lib/utils/robots.txt', () => ({ generateRobotsTxt: jest.fn() }))
jest.mock('@/lib/utils/llms.txt', () => ({ generateLlmsTxt: jest.fn() }))
jest.mock('@/lib/utils/rss', () => ({ generateRss: jest.fn(), shouldGenerateRssForLocale: () => false }))
jest.mock('@/lib/utils/sitemap.xml', () => ({ generateSitemapXml: jest.fn() }))
jest.mock('@/lib/utils/redirect', () => ({ generateRedirectJson: jest.fn() }))
jest.mock('@/lib/plugins/algolia', () => ({ checkDataFromAlgolia: jest.fn() }))
jest.mock('@/themes/theme', () => ({ DynamicLayout: () => null }))
jest.mock('p-limit', () => () => task => task())

it.each([null, undefined])('renders an empty home list with previews enabled when allPages is %s', async allPages => {
  fetchGlobalAllData.mockResolvedValue({ allPages, NOTION_CONFIG: {}, latestPosts: [] })
  const result = await getStaticProps({ locale: 'zh-CN' })
  expect(result.props.posts).toEqual([])
  expect(result.props.allPages).toBeUndefined()
  expect(getPostBlocks).not.toHaveBeenCalled()
})

describe('home page sitemap generation by deployment mode', () => {
  const originalLifecycle = process.env.npm_lifecycle_event
  const originalExport = process.env.EXPORT

  afterEach(() => {
    if (originalLifecycle === undefined) delete process.env.npm_lifecycle_event
    else process.env.npm_lifecycle_event = originalLifecycle
    if (originalExport === undefined) delete process.env.EXPORT
    else process.env.EXPORT = originalExport
  })

  it.each([
    ['build', undefined, false],
    ['build', 'false', false],
    ['build', 'true', true],
    ['export', 'true', true],
    ['dev', undefined, false],
    ['start', undefined, false]
  ])('lifecycle=%s, EXPORT=%s writes a static sitemap only when expected (%s)', async (lifecycle, exportMode, expected) => {
    process.env.npm_lifecycle_event = lifecycle
    if (exportMode === undefined) delete process.env.EXPORT
    else process.env.EXPORT = exportMode
    fetchGlobalAllData.mockResolvedValue({ allPages: [], NOTION_CONFIG: {}, latestPosts: [] })

    await getStaticProps({ locale: 'zh-CN' })

    expect(generateSitemapXml).toHaveBeenCalledTimes(expected ? 1 : 0)
  })
})
