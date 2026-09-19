import { getStaticProps as getPostListProps } from '@/pages/page/[page]'
import {
  getStaticPaths as getCategoryPaths,
  getStaticProps as getCategoryProps
} from '@/pages/category/[category]/page/[page]'
import {
  getStaticPaths as getTagPaths,
  getStaticProps as getTagProps
} from '@/pages/tag/[tag]/page/[page]'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
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
  getPostBlocks: jest.fn()
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
    fetchGlobalAllData.mockResolvedValue(siteData())
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
})
