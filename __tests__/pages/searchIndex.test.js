import { render, screen } from '@testing-library/react'
import Search, { getStaticProps } from '@/pages/search'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { useRouter } from 'next/router'

jest.mock('next/router', () => ({ useRouter: jest.fn() }))
jest.mock('@/lib/config', () => ({ siteConfig: (_key, fallback) => fallback }))
jest.mock('@/lib/db/SiteDataApi', () => ({ fetchGlobalAllData: jest.fn() }))
jest.mock('@/themes/theme', () => ({
  DynamicLayout: ({ posts, keyword }) => <div data-testid='results'>{JSON.stringify({ posts, keyword })}</div>
}))

it.each([undefined, null])('accepts missing allPages (%s) during static export', async allPages => {
  const previous = process.env.EXPORT
  process.env.EXPORT = 'true'
  try {
    fetchGlobalAllData.mockResolvedValue({ allPages, NOTION_CONFIG: {} })
    const { props } = await getStaticProps({ locale: 'zh-CN' })
    expect(props.posts).toEqual([])
    expect(props.staticSearch).toBe(true)
  } finally {
    if (previous === undefined) delete process.env.EXPORT
    else process.env.EXPORT = previous
  }
})

it.each(['tools', ['tools', 'ignored']])('accepts string and repeated query parameters: %j', query => {
  useRouter.mockReturnValue({ query: { s: query } })
  const match = { id: 'match', title: 'Useful Tools', category: 'Resources' }
  render(<Search posts={[match, { id: 'other', title: 'Other' }]} />)
  expect(JSON.parse(screen.getByTestId('results').textContent)).toEqual({ posts: [match], keyword: 'tools' })
})
