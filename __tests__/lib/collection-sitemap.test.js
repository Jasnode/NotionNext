import { buildCollectionSitemapFields } from '@/lib/sitemap-utils'
import BLOG from '@/blog.config'
import getPageProperties from '@/lib/db/notion/getPageProperties'

jest.mock('notion-utils', () => ({
  getTextContent: value => value.map(part => part[0]).join(''),
  getDateValue: jest.fn()
}))

jest.mock('@/lib/db/notion/getNotionAPI', () => ({
  __esModule: true, default: { getUsers: jest.fn() }
}))

it('keeps collections in the sitemap after normalizing a localized publish status', async () => {
  const fields = BLOG.NOTION_PROPERTY_NAME
  const originalStatus = fields.status_publish
  fields.status_publish = '已发布'
  try {
    const posts = await Promise.all([1, 2, 3].map(id => getPageProperties(
      String(id),
      {
        properties: { type: [[fields.type_post]], status: [['已发布']], category: [['技术']], tags: [['教程']] },
        created_time: 1750000000000, last_edited_time: 1750000000000
      },
      {
        type: { name: fields.type, type: 'select' },
        status: { name: fields.status, type: 'select' },
        category: { name: fields.category, type: 'select' },
        tags: { name: fields.tags, type: 'multi_select' }
      }
    )))
    expect(posts.every(post => post.status === 'Published' && post.type === 'Post')).toBe(true)
    const urls = buildCollectionSitemapFields({
      allPages: posts, baseUrl: 'https://example.com', postsPerPage: 2
    }).map(field => field.loc)
    expect(urls).toEqual([
      'https://example.com/page/2',
      `https://example.com/tag/${encodeURIComponent('教程')}`,
      `https://example.com/tag/${encodeURIComponent('教程')}/page/2`,
      `https://example.com/category/${encodeURIComponent('技术')}`,
      `https://example.com/category/${encodeURIComponent('技术')}/page/2`
    ])
  } finally {
    fields.status_publish = originalStatus
  }
})

it('discovers only populated public collections, encodes names and includes real pagination', () => {
  const posts = [1, 2, 3].map(id => ({
    id, type: 'Post', status: 'Published', tags: ['教程 & 工具', '教程 & 工具'],
    category: ['技术'], lastEditedDay: '2026-09-28'
  }))
  posts.push({ type: 'Post', status: 'Draft', tags: ['秘密'] })
  const fields = buildCollectionSitemapFields({
    allPages: posts, baseUrl: 'https://example.com', locale: '/en', postsPerPage: 2
  })
  const paths = fields.map(field => field.loc.replace('https://example.com/en', ''))
  expect(paths).toEqual([
    '/page/2', `/tag/${encodeURIComponent('教程 & 工具')}`, `/tag/${encodeURIComponent('教程 & 工具')}/page/2`,
    `/category/${encodeURIComponent('技术')}`, `/category/${encodeURIComponent('技术')}/page/2`
  ])
  expect(fields.every(field => field.lastmod === '2026-09-28')).toBe(true)
  expect(buildCollectionSitemapFields({ allPages: posts, baseUrl: 'https://example.com', paginated: false })).toHaveLength(2)
})
