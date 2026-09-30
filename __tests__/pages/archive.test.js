import { getStaticProps } from '@/pages/archive/index'
import { fetchGlobalAllData, cleanPostSummaries } from '@/lib/db/SiteDataApi'
import { siteConfig } from '@/lib/config'

jest.mock('@/lib/config', () => ({
  siteConfig: jest.fn((key, defaultValue) => {
    if (key === 'POST_LIST_PREVIEW') return true
    return defaultValue
  })
}))

jest.mock('@/lib/db/SiteDataApi', () => ({
  fetchGlobalAllData: jest.fn(),
  cleanPostSummaries: jest.fn(posts => posts.map(post => ({ id: post.id, publishDate: post.publishDate })))
}))

jest.mock('@/themes/theme', () => ({
  DynamicLayout: () => null
}))

describe('archive list data', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    siteConfig.mockImplementation((key, defaultValue) => key === 'POST_LIST_PREVIEW' ? true : defaultValue)
    fetchGlobalAllData.mockResolvedValue({
      NOTION_CONFIG: {},
      allPages: [
        {
          id: 'published',
          type: 'Post',
          status: 'Published',
          publishDate: 2,
          blockMap: { block: {} }
        },
        { id: 'draft', type: 'Post', status: 'Draft', publishDate: 1 }
      ]
    })
  })

  it('preserves preview data when POST_LIST_PREVIEW is enabled', async () => {
    const result = await getStaticProps({ locale: 'zh-CN' })

    expect(result.props.posts).toEqual([
      expect.objectContaining({ id: 'published', blockMap: { block: {} } })
    ])
    expect(cleanPostSummaries).not.toHaveBeenCalled()
  })

  it('does not throw when allPages is unavailable', async () => {
    fetchGlobalAllData.mockResolvedValue({ NOTION_CONFIG: {} })

    const result = await getStaticProps({ locale: 'zh-CN' })

    expect(result.props.posts).toEqual([])
    expect(result.props.archivePosts).toEqual({})
  })

  it('preserves post data and groups it by date when global previews are disabled', async () => {
    siteConfig.mockImplementation((key, defaultValue) => defaultValue)
    const result = await getStaticProps({ locale: 'zh-CN' })
    expect(cleanPostSummaries).not.toHaveBeenCalled()
    expect(result.props.posts).toEqual([expect.objectContaining({ id: 'published', blockMap: { block: {} } })])
    expect(result.props.archivePosts['1970-01']).toEqual(result.props.posts)
    expect(result.props.allPages).toBeUndefined()
  })
})
