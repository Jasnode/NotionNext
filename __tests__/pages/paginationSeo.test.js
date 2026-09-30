import { getStaticPaths as getPostListPaths, getStaticProps as getPostListProps } from '@/pages/page/[page]'
import {
  getStaticPaths as getCategoryPaths,
  getStaticProps as getCategoryProps
} from '@/pages/category/[category]/page/[page]'
import {
  getStaticPaths as getTagPaths,
  getStaticProps as getTagProps
} from '@/pages/tag/[tag]/page/[page]'
import { fetchGlobalAllData, cleanPostSummaries, getPostBlocks } from '@/lib/db/SiteDataApi'
import { getStaticPaths as getCategoryIndexPaths, getStaticProps as getCategoryIndexProps } from '@/pages/category/[category]'
import { getStaticPaths as getTagIndexPaths, getStaticProps as getTagIndexProps } from '@/pages/tag/[tag]'
import { siteConfig } from '@/lib/config'
import BLOG from '@/blog.config'

// 越界页返回 notFound 时同样要带 revalidate，否则 ISR 会把 404 锁死
const REVALIDATE_SECOND = BLOG.NEXT_REVALIDATE_SECOND

jest.mock('@/lib/config', () => ({
  siteConfig: jest.fn((key, defaultVal) =>
    key === 'POSTS_PER_PAGE' ? 2 : defaultVal
  )
}))

jest.mock('@/lib/db/SiteDataApi', () => ({
  fetchGlobalAllData: jest.fn(),
  getPostBlocks: jest.fn(),
  cleanPostSummaries: jest.fn(posts => posts.map(post => ({ id: post.id, summary: 'Client summary' })))
}))

jest.mock('@/lib/db/notion/getPostBlocks', () => ({
  formatNotionBlock: jest.fn(value => value)
}))

jest.mock('@/lib/utils/notion.util', () => ({
  adapterNotionBlockMap: jest.fn(value => value)
}))

jest.mock('@/themes/theme', () => ({
  DynamicLayout: () => null
}))

const publishedPosts = [1, 2, 3].map(id => ({
  id: String(id),
  type: 'Post',
  status: 'Published',
  category: ['技术教程'],
  tags: ['教程']
}))

const siteData = () => ({
  allPages: publishedPosts,
  NOTION_CONFIG: {},
  postCount: publishedPosts.length,
  categoryOptions: [{ name: '技术教程' }],
  tagOptions: [{ name: '教程' }]
})

describe('pagination SEO boundaries', () => {
  beforeEach(() => {
    siteConfig.mockImplementation((key, defaultVal) => key === 'POSTS_PER_PAGE' ? 2 : defaultVal)
    getPostBlocks.mockResolvedValue({ block: {} })
    fetchGlobalAllData.mockResolvedValue(siteData())
  })

  it.each([
    ['category', getCategoryIndexProps, { category: 'not-a-category' }],
    ['tag', getTagIndexProps, { tag: 'not-a-tag' }]
  ])('returns a revalidatable 404 for an unknown %s', async (_, getProps, params) => {
    await expect(getProps({ params, locale: 'zh-CN' })).resolves.toEqual({
      notFound: true, revalidate: REVALIDATE_SECOND
    })
    expect(cleanPostSummaries).not.toHaveBeenCalled()
  })

  it.each([undefined, null])('returns 404 instead of throwing when allPages is %s', async allPages => {
    fetchGlobalAllData.mockResolvedValue({ NOTION_CONFIG: {}, allPages })

    await expect(
      getCategoryIndexProps({ params: { category: '技术教程' }, locale: 'zh-CN' })
    ).resolves.toEqual({ notFound: true, revalidate: REVALIDATE_SECOND })
    await expect(
      getTagIndexProps({ params: { tag: '教程' }, locale: 'zh-CN' })
    ).resolves.toEqual({ notFound: true, revalidate: REVALIDATE_SECOND })
    await expect(
      getCategoryProps({ params: { category: '技术教程', page: '2' }, locale: 'zh-CN' })
    ).resolves.toEqual({ notFound: true, revalidate: REVALIDATE_SECOND })
    await expect(
      getTagProps({ params: { tag: '教程', page: '2' }, locale: 'zh-CN' })
    ).resolves.toEqual({ notFound: true, revalidate: REVALIDATE_SECOND })
    await expect(
      getPostListProps({ params: { page: '2' }, locale: 'zh-CN' })
    ).resolves.toEqual({ notFound: true, revalidate: REVALIDATE_SECOND })

    fetchGlobalAllData.mockResolvedValue({
      categoryOptions: [{ name: '技术教程' }],
      tagOptions: [{ name: '教程' }],
      allPages,
      NOTION_CONFIG: {}
    })
    await expect(getCategoryPaths()).resolves.toEqual({ paths: [], fallback: 'blocking' })
    await expect(getTagPaths()).resolves.toEqual({ paths: [], fallback: 'blocking' })
  })

  it('disables dynamic fallbacks and returns notFound for empty collections during static export', async () => {
    const previousExport = process.env.EXPORT
    process.env.EXPORT = 'true'
    try {
      fetchGlobalAllData.mockImplementation(() => Promise.resolve(siteData()))
      for (const getPaths of [getPostListPaths, getCategoryPaths, getTagPaths, getCategoryIndexPaths, getTagIndexPaths]) {
        expect((await getPaths({})).fallback).toBe(false)
      }
      for (const [getProps, params] of [
        [getCategoryIndexProps, { category: 'empty' }],
        [getTagIndexProps, { tag: 'empty' }]
      ]) {
        await expect(getProps({ params })).resolves.toEqual({ notFound: true, revalidate: undefined })
      }
    } finally {
      if (previousExport === undefined) delete process.env.EXPORT
      else process.env.EXPORT = previousExport
    }
  })

  it('does not publish a collection containing only drafts', async () => {
    const data = siteData()
    data.allPages = data.allPages.map(post => ({ ...post, status: 'Draft' }))
    fetchGlobalAllData.mockResolvedValue(data)
    await expect(getTagIndexProps({ params: { tag: '教程' }, locale: 'zh-CN' })).resolves.toEqual({
      notFound: true, revalidate: REVALIDATE_SECOND
    })
  })

  it('matches complete category names in lists and prebuilt pagination', async () => {
    const data = siteData()
    const exact = publishedPosts.map(post => ({ ...post, category: '工具' }))
    const other = publishedPosts.map(post => ({ ...post, id: 'other-' + post.id, category: '开发工具' }))
    data.allPages = [...exact, ...other]
    data.categoryOptions = [{ name: '工具' }, { name: '开发工具' }]
    fetchGlobalAllData.mockImplementation(() => Promise.resolve({ ...data }))
    const first = await getCategoryIndexProps({ params: { category: '工具' }, locale: 'zh-CN' })
    expect(first.props.postCount).toBe(3)
    const second = await getCategoryProps({ params: { category: '工具', page: '2' }, locale: 'zh-CN' })
    expect(second.props.posts.map(post => post.id)).toEqual(['3'])
    await expect(getCategoryProps({ params: { category: '工具', page: '3' }, locale: 'zh-CN' })).resolves.toEqual({
      notFound: true, revalidate: REVALIDATE_SECOND
    })
    const paths = await getCategoryPaths()
    expect(paths.paths).toEqual([
      { params: { category: '工具', page: '2' } },
      { params: { category: '开发工具', page: '2' } }
    ])
  })

  it('loads the requested language for category pagination', async () => {
    fetchGlobalAllData.mockImplementation(({ locale }) => Promise.resolve(locale === 'en'
      ? siteData()
      : { ...siteData(), allPages: [] }))
    const result = await getCategoryProps({ params: { category: '技术教程', page: '2' }, locale: 'en' })
    expect(result.props.posts.map(post => post.id)).toEqual(['3'])
    expect(fetchGlobalAllData).toHaveBeenCalledWith({ from: 'category-page-props', locale: 'en' })
  })

  const listRoutes = [
    ['posts', getPostListProps, { page: '2' }, ['3']],
    ['tag index', getTagIndexProps, { tag: '教程' }, ['1', '2']],
    ['category index', getCategoryIndexProps, { category: '技术教程' }, ['1', '2']],
    ['tag page', getTagProps, { tag: '教程', page: '2' }, ['3']],
    ['category page', getCategoryProps, { category: '技术教程', page: '2' }, ['3']]
  ]

  it.each(listRoutes)('preserves article preview data for %s', async (_, getProps, params) => {
    siteConfig.mockImplementation((key, defaultVal) => {
      if (key === 'POSTS_PER_PAGE') return 2
      if (key === 'POST_LIST_PREVIEW') return false
      return defaultVal
    })
    const data = siteData()
    data.allPages = data.allPages.map(post => ({ ...post, blockMap: { block: {} } }))
    fetchGlobalAllData.mockResolvedValue(data)
    const { props } = await getProps({ params, locale: 'zh-CN' })
    expect(cleanPostSummaries).not.toHaveBeenCalled()
    expect(props.posts.every(post => post.blockMap)).toBe(true)
  })

  it('permanently redirects duplicate first-page URLs', async () => {
    await expect(
      getPostListProps({ params: { page: '1' }, locale: 'zh-CN' })
    ).resolves.toEqual({
      redirect: { destination: '/', permanent: true }
    })
    await expect(
      getCategoryProps({ params: { category: '技术教程', page: '1' } })
    ).resolves.toEqual({
      redirect: {
        destination: '/category/%E6%8A%80%E6%9C%AF%E6%95%99%E7%A8%8B',
        permanent: true
      }
    })
    await expect(
      getTagProps({ params: { tag: '教程', page: '1' }, locale: 'zh-CN' })
    ).resolves.toEqual({
      redirect: {
        destination: '/tag/%E6%95%99%E7%A8%8B',
        permanent: true
      }
    })
    expect(fetchGlobalAllData).not.toHaveBeenCalled()
  })

  it('returns 404 for invalid and out-of-range page numbers', async () => {
    await expect(
      getPostListProps({ params: { page: 'not-a-page' }, locale: 'zh-CN' })
    ).resolves.toEqual({ notFound: true })
    await expect(
      getPostListProps({ params: { page: '3' }, locale: 'zh-CN' })
    ).resolves.toEqual({ notFound: true, revalidate: REVALIDATE_SECOND })
    await expect(
      getCategoryProps({ params: { category: '技术教程', page: '3' } })
    ).resolves.toEqual({ notFound: true, revalidate: REVALIDATE_SECOND })
    await expect(
      getTagProps({ params: { tag: '教程', page: '3' }, locale: 'zh-CN' })
    ).resolves.toEqual({ notFound: true, revalidate: REVALIDATE_SECOND })
  })

  it('only prebuilds category and tag pages after page one', async () => {
    const categoryPaths = await getCategoryPaths()
    const tagPaths = await getTagPaths()

    expect(categoryPaths.paths).toEqual([
      { params: { category: '技术教程', page: '2' } }
    ])
    expect(categoryPaths.fallback).toBe('blocking')
    expect(tagPaths.paths).toEqual([{ params: { tag: '教程', page: '2' } }])
    expect(tagPaths.fallback).toBe('blocking')
  })

  it('blocks unknown collection paths so the first request can return 404', async () => {
    expect((await getCategoryIndexPaths()).fallback).toBe('blocking')
    expect((await getTagIndexPaths()).fallback).toBe('blocking')
  })
})
