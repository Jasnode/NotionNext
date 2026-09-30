import { fetchGlobalAllData, getSiteDataByPageId } from '@/lib/db/SiteDataApi'
import { getOrSetDataWithCache } from '@/lib/cache/cache_manager'
import { fetchNotionPageBlocks } from '@/lib/db/notion/getPostBlocks'

jest.mock('@/lib/cache/cache_manager', () => ({
  getOrSetDataWithCache: jest.fn((_key, loader) => loader())
}))

jest.mock('notion-utils', () => ({
  idToUuid: value => value
}))

jest.mock('p-limit', () => () => task => task())

jest.mock('@/lib/db/notion/getNotionAPI', () => ({
  __esModule: true,
  default: { getUsers: jest.fn() }
}))

jest.mock('@/lib/db/notion/getNotionPost', () => ({
  fetchPageFromNotion: jest.fn()
}))

jest.mock('@/lib/db/notion/getPostBlocks', () => ({
  fetchNotionPageBlocks: jest.fn()
}))

describe('Notion root database build failure', () => {
  const originalBuildMode = process.env.BUILD_MODE

  afterEach(() => {
    if (originalBuildMode === undefined) delete process.env.BUILD_MODE
    else process.env.BUILD_MODE = originalBuildMode
    jest.clearAllMocks()
  })

  it('fails the build when the root database request returns no data', async () => {
    process.env.BUILD_MODE = 'true'
    fetchNotionPageBlocks.mockResolvedValue(null)

    await expect(fetchGlobalAllData({ pageId: 'test-page', from: 'index' }))
      .rejects.toThrow(/无法获取 Notion 根数据库 test-page/)
  })

  it('rejects an invalid site cache entry during a build', async () => {
    process.env.BUILD_MODE = 'true'
    getOrSetDataWithCache.mockResolvedValueOnce({ collectionId: null })

    await expect(getSiteDataByPageId({ pageId: 'test-page', from: 'index' }))
      .rejects.toThrow(/无法读取 Notion 根数据库 test-page.*NOTION_PAGE_ID.*数据库.*公开/)
  })

  it('explains how to correct a regular Page used as the database root', async () => {
    process.env.BUILD_MODE = 'true'
    fetchNotionPageBlocks.mockResolvedValue({
      block: { 'test-page': { value: { id: 'test-page', type: 'page' } } }
    })

    await expect(getSiteDataByPageId({ pageId: 'test-page', from: 'index' }))
      .rejects.toThrow(/NOTION_PAGE_ID.*数据库.*普通 Page/)
  })

  it('accepts a valid database with no posts during a build', async () => {
    process.env.BUILD_MODE = 'true'
    const site = { collectionId: 'empty-database', allPages: [] }
    getOrSetDataWithCache.mockResolvedValueOnce(site)
    await expect(getSiteDataByPageId({ pageId: 'test-page', from: 'index' }))
      .resolves.toEqual(site)
  })

  it('preserves the development fallback when a request fails', async () => {
    process.env.BUILD_MODE = 'false'
    fetchNotionPageBlocks.mockResolvedValue(null)
    const result = await getSiteDataByPageId({ pageId: 'test-page', from: 'index' })
    expect(result.collectionId).toBeNull()
    expect(Array.isArray(result.allPages)).toBe(true)
  })
})

it('accepts a valid site through the full build data pipeline', async () => {
  const previous = process.env.BUILD_MODE
  process.env.BUILD_MODE = 'true'
  const site = { collectionId: 'valid-database', allPages: [], tagOptions: [], categoryOptions: [] }
  getOrSetDataWithCache.mockImplementationOnce((_key, loader) => loader())
    .mockResolvedValueOnce(site)
  try {
    const result = await fetchGlobalAllData({ pageId: 'test-page' })
    // Client data intentionally excludes the internal collection identifier.
    expect(result.collectionId).toBeUndefined()
    expect(result.allPages).toEqual([])
  } finally {
    if (previous === undefined) delete process.env.BUILD_MODE
    else process.env.BUILD_MODE = previous
  }
})
