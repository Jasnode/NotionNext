import { act, render, screen } from '@testing-library/react'
import NotionPage from '@/components/NotionPage'

jest.mock('@/lib/config', () => ({ siteConfig: (key, fallback) => fallback }))
jest.mock('@/lib/global', () => ({ useGlobal: () => undefined }))
jest.mock('@/lib/db/notion/mapImage', () => ({ compressImage: value => value, mapImgUrl: value => value }))
jest.mock('@/lib/utils', () => ({ isBrowser: true, loadExternalResource: jest.fn() }))
jest.mock('@/components/NotionEmbed', () => () => null)
jest.mock('@/components/OriginalityProof', () => () => null)
jest.mock('@fisch0920/medium-zoom', () => () => ({ attach: jest.fn(), detach: jest.fn() }))
jest.mock('react-notion-x', () => ({
  NotionRenderer: ({ components }) => (
    <components.PageLink className='notion-collection-card' href='/article/next'>Gallery article</components.PageLink>
  )
}))

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

it('does not let an old gallery timer remove links after the component unmounts', () => {
  const { unmount } = render(<NotionPage post={{}} linkOptions={{ disableGalleryClick: true }} />)
  unmount()
  render(<NotionPage post={{}} linkOptions={{ disableGalleryClick: false }} />)
  act(() => jest.advanceTimersByTime(1000))
  expect(screen.getByText('Gallery article')).toHaveAttribute('href', '/article/next')
})

it('keeps restored gallery links when the setting changes before the timer runs', () => {
  const post = {}
  const { rerender } = render(<NotionPage post={post} linkOptions={{ disableGalleryClick: true }} />)
  rerender(<NotionPage post={post} linkOptions={{ disableGalleryClick: false }} />)
  act(() => jest.advanceTimersByTime(1000))
  expect(screen.getByText('Gallery article')).toHaveAttribute('href', '/article/next')
})

it('limits delayed gallery processing to its own article', () => {
  render(<NotionPage post={{}} linkOptions={{ disableGalleryClick: true }} />)
  const { container } = render(<NotionPage post={{}} linkOptions={{ disableGalleryClick: false }} />)
  act(() => jest.advanceTimersByTime(1000))
  expect(container.querySelector('a')).toHaveAttribute('href', '/article/next')
})
