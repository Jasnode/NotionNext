import {
  getStaticPaths,
  getStaticProps
} from '@/pages/search/[keyword]/page/[page]'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { getDataFromCache } from '@/lib/cache/cache_manager'
import BLOG from '@/blog.config'

jest.mock('@/lib/config', () => ({
  siteConfig: (key, fallback) => (key === 'POSTS_PER_PAGE' ? 2 : fallback)
}))
jest.mock('@/lib/db/SiteDataApi', () => ({ fetchGlobalAllData: jest.fn() }))
jest.mock('@/lib/cache/cache_manager', () => ({ getDataFromCache: jest.fn() }))
jest.mock('@/lib/db/notion/getPostBlocks', () => ({
  getPageBlockCacheKey: id => `page_block_${id}`
}))
jest.mock('@/themes/theme', () => ({ DynamicLayout: () => null }))

const originalExport = process.env.EXPORT
const publishedPosts = [1, 2, 3].map(id => ({
  id: String(id),
  title: `NotionNext ${id}`,
  type: 'Post',
  status: 'Published'
}))

beforeEach(() => {
  delete process.env.EXPORT
  fetchGlobalAllData.mockResolvedValue({
    allPages: [
      ...publishedPosts,
      { id: 'draft', title: 'NotionNext draft', type: 'Post', status: 'Draft' },
      { id: 'other', title: 'Other article', type: 'Post', status: 'Published' }
    ],
    NOTION_CONFIG: {}
  })
  getDataFromCache.mockResolvedValue(null)
})

afterEach(() => {
  if (originalExport === undefined) delete process.env.EXPORT
  else process.env.EXPORT = originalExport
})

it('omits duplicate first pages and dynamic fallbacks from static export', () => {
  process.env.EXPORT = 'true'
  expect(getStaticPaths()).toEqual({ paths: [], fallback: false })
})

it('blocks dynamic requests until redirects or page content are ready', () => {
  expect(getStaticPaths()).toEqual({ paths: [], fallback: 'blocking' })
})

it.each(['NotionNext', '开发 工具', 'C++ & Java/JS'])(
  'redirects the first page for %s before fetching data',
  async keyword => {
    await expect(
      getStaticProps({ params: { keyword, page: '1' }, locale: 'en' })
    ).resolves.toEqual({
      redirect: {
        destination: `/search/${encodeURIComponent(keyword)}`,
        permanent: true
      }
    })
    expect(fetchGlobalAllData).not.toHaveBeenCalled()
  }
)

it.each(['NaN', '-1', '0', '2.5', 'Infinity'])(
  'rejects invalid page %s before fetching data',
  async page => {
    await expect(
      getStaticProps({ params: { keyword: 'NotionNext', page } })
    ).resolves.toEqual({ notFound: true })
    expect(fetchGlobalAllData).not.toHaveBeenCalled()
  }
)

it('preserves published search results and requested language on the second page', async () => {
  const { props, revalidate } = await getStaticProps({
    params: { keyword: 'NotionNext', page: '2' },
    locale: 'en'
  })
  expect(props.posts.map(post => post.id)).toEqual(['3'])
  expect(props.postCount).toBe(3)
  expect(props.keyword).toBe('NotionNext')
  expect(Number(props.page)).toBe(2)
  expect(props.allPages).toBeUndefined()
  expect(revalidate).toBe(BLOG.NEXT_REVALIDATE_SECOND)
  expect(fetchGlobalAllData).toHaveBeenCalledWith(
    expect.objectContaining({ locale: 'en' })
  )
})

it.each([undefined, null, []])(
  'handles missing or empty data (%s) with a revalidatable 404',
  async allPages => {
    fetchGlobalAllData.mockResolvedValue({ allPages, NOTION_CONFIG: {} })
    await expect(
      getStaticProps({ params: { keyword: 'NotionNext', page: '2' } })
    ).resolves.toEqual({
      notFound: true,
      revalidate: BLOG.NEXT_REVALIDATE_SECOND
    })
  }
)

it('returns a revalidatable 404 for an out-of-range search page', async () => {
  await expect(
    getStaticProps({ params: { keyword: 'NotionNext', page: '3' } })
  ).resolves.toEqual({
    notFound: true,
    revalidate: BLOG.NEXT_REVALIDATE_SECOND
  })
})
