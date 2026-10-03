import { renderToStaticMarkup } from 'react-dom/server.node'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import NotionPage from '@/components/NotionPage'

let mockRouter
let mockConfig
jest.mock('@/lib/config', () => ({ siteConfig: (key, fallback) => mockConfig[key] ?? fallback }))
jest.mock('@/lib/global', () => ({
  useGlobal: () => ({
    lang: 'en',
    allLinkPages: [{ short_id: 'fcf8-1846-aaaaaaaaaaaa', href: '/links' }]
  })
}))
jest.unmock('next/router')
jest.mock('@/lib/db/notion/mapImage', () => ({ compressImage: x => x, mapImgUrl: x => x }))
jest.mock('@/lib/utils', () => ({ isBrowser: false, loadExternalResource: jest.fn() }))
jest.mock('@/components/NotionEmbed', () => () => null)
jest.mock('@/components/OriginalityProof', () => () => null)
jest.mock('@fisch0920/medium-zoom', () => jest.fn())
jest.mock('next/dynamic', () => () => () => null)
jest.mock('react-notion-x', () => ({
  NotionRenderer: ({ components, mapPageUrl }) => (
    <>
      <components.PageLink className='notion-page-link' href={mapPageUrl('4aea95fb3fd5fcf81846aaaaaaaaaaaa')}>Published table page</components.PageLink>
      <components.PageLink className='notion-page-link' href={mapPageUrl('da8daa2f8d19420987d51cc9bdf01241')}>Unpublished child page</components.PageLink>
      <components.Link className='notion-link' href='https://www.notion.so/4aea95fb3fd5fcf81846aaaaaaaaaaaa?pvs=4#block' target='_blank'>Inline reference</components.Link>
      <components.PageLink className='notion-collection-card' href={mapPageUrl('da8daa2f8d19420987d51cc9bdf01241')}>Zoom-only gallery</components.PageLink>
    </>
  )
}))

beforeEach(() => {
  mockConfig = { POST_DISABLE_GALLERY_CLICK: true, LINK: 'https://blog.example.com' }
  mockRouter = { asPath: '/article/parent', locale: 'en', defaultLocale: 'zh-CN' }
})

const renderPage = (post = { blockMap: {} }) => renderToStaticMarkup(
  <RouterContext.Provider value={mockRouter}>
    <NotionPage post={post} />
  </RouterContext.Provider>
)

it.each([
  [{ asPath: '/article/59', locale: 'en', defaultLocale: 'zh-CN' }, '/en'],
  [{ asPath: '/article/59', locale: 'zh-CN', defaultLocale: 'zh-CN' }, ''],
  [{ asPath: '/en/article/59' }, '/en'],
  [{ asPath: '/article/59' }, '']
])('renders correct destinations before hydration with router %j', (router, prefix) => {
  mockRouter = router
  const html = renderPage()
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const links = [...doc.querySelectorAll('a')]
  expect(links.map(link => link.getAttribute('href'))).toEqual([
    `${prefix}/links`,
    'https://www.notion.so/da8daa2f8d19420987d51cc9bdf01241',
    `${prefix}/links?pvs=4#block`,
    null
  ])
  expect(html).not.toMatch(/href="\/[a-f0-9]{32}"/)
  expect(doc.querySelector('.notion-link').getAttribute('target')).toBe('_self')
})

it('preserves the opt-in parent path for child pages in the initial HTML', () => {
  mockConfig.INNER_PAGE_URL_PARENT_PATH = true
  const html = renderPage()
  const doc = new DOMParser().parseFromString(html, 'text/html')
  expect(doc.querySelectorAll('.notion-page-link')[1].getAttribute('href'))
    .toBe('/en/article/parent/da8daa2f8d19420987d51cc9bdf01241')
  expect(doc.querySelector('.notion-page-link').getAttribute('href')).toBe('/en/links')
  expect(doc.querySelector('.notion-link').getAttribute('href')).toBe('/en/links?pvs=4#block')
})

it('keeps gallery links available when gallery navigation is enabled', () => {
  mockConfig.POST_DISABLE_GALLERY_CLICK = false
  const html = renderPage()
  const doc = new DOMParser().parseFromString(html, 'text/html')
  expect(doc.querySelector('.notion-collection-card').getAttribute('href'))
    .toBe('https://www.notion.so/da8daa2f8d19420987d51cc9bdf01241')
})

it('uses the article path for child links when rendered without a router', () => {
  mockRouter = null
  mockConfig.INNER_PAGE_URL_PARENT_PATH = true
  const html = renderPage({ href: '/article/rss-post', blockMap: {} })
  const doc = new DOMParser().parseFromString(html, 'text/html')
  expect(doc.querySelectorAll('.notion-page-link')[1].getAttribute('href'))
    .toBe('/article/rss-post/da8daa2f8d19420987d51cc9bdf01241')
})
