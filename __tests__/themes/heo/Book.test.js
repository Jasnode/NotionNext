import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import BookShelf from '@/themes/heo/components/Book'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ priority, alt, ...props }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...props} />
  }
}))

const touch = (x, y = 160, identifier = 1) => ({
  identifier,
  clientX: x,
  clientY: y
})

async function renderShelf() {
  const { container, unmount } = render(<BookShelf />)
  const page = container.querySelector('article')
  page.style.setProperty('--page', '#fff')
  await waitFor(() => expect(page).toHaveAttribute('aria-busy', 'false'))
  const activeCard = () => container.querySelector('[data-depth="0"]')
  return { activeCard, stack: activeCard().parentElement, unmount }
}

function swipe(stack, start, end) {
  fireEvent.touchStart(stack, { touches: [start] })
  fireEvent.touchMove(stack, { touches: [end] })
  fireEvent.touchEnd(stack, { touches: [], changedTouches: [end] })
}

beforeAll(() => {
  // jsdom does not implement scrolling on elements.
  HTMLElement.prototype.scrollTo = jest.fn()
})

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(1000)
  fetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ books: [], edges: [] })
  })
})

it('swipes left and right through recommendations and wraps at both ends', async () => {
  const { stack, activeCard } = await renderShelf()
  const firstLabel = activeCard().getAttribute('aria-label')

  swipe(stack, touch(220), touch(100))
  expect(screen.getByText('02 / 08')).toBeInTheDocument()
  expect(activeCard()).not.toHaveAttribute('aria-label', firstLabel)

  swipe(stack, touch(100), touch(220))
  expect(screen.getByText('01 / 08')).toBeInTheDocument()
  expect(activeCard()).toHaveAttribute('aria-label', firstLabel)

  swipe(stack, touch(100), touch(220))
  expect(screen.getByText('08 / 08')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '下一本推荐' }))
  expect(screen.getByText('01 / 08')).toBeInTheDocument()
})

it('keeps a vertical gesture as page scrolling even if the finger later moves sideways', async () => {
  const { stack, activeCard } = await renderShelf()
  fireEvent.touchStart(stack, { touches: [touch(220, 240)] })
  fireEvent.touchMove(stack, { touches: [touch(218, 210)] })
  fireEvent.touchMove(stack, { touches: [touch(90, 190)] })
  expect(activeCard().style.transform).toBe('')
  fireEvent.touchEnd(stack, {
    touches: [],
    changedTouches: [touch(90, 190)]
  })
  expect(screen.getByText('01 / 08')).toBeInTheDocument()
})

it('returns a short horizontal drag without changing books or opening notes', async () => {
  const { stack, activeCard } = await renderShelf()
  const card = activeCard()
  fireEvent.touchStart(card, { touches: [touch(220)] })
  fireEvent.touchMove(card, { touches: [touch(200)] })
  expect(card.style.transform).not.toBe('')
  fireEvent.touchEnd(card, { touches: [], changedTouches: [touch(200)] })
  fireEvent.click(card, { detail: 1 })

  expect(screen.getByText('01 / 08')).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(card.style.transform).toBe('')
  expect(card.style.transition).toBe('')
  expect(stack.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
})

it('allows a new tap immediately after a swipe while suppressing its generated click', async () => {
  const { stack, activeCard, unmount } = await renderShelf()
  swipe(stack, touch(220), touch(100))
  fireEvent.click(activeCard(), { detail: 1 })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

  const card = activeCard()
  fireEvent.touchStart(card, { touches: [touch(160)] })
  fireEvent.touchEnd(card, { touches: [], changedTouches: [touch(160)] })
  fireEvent.click(card, { detail: 1 })
  expect(await screen.findByRole('dialog')).toBeInTheDocument()
  unmount()
})

it('allows keyboard activation immediately after a swipe', async () => {
  const { stack, activeCard, unmount } = await renderShelf()
  swipe(stack, touch(220), touch(100))
  // A keyboard or assistive-technology click has detail 0.
  fireEvent.click(activeCard(), { detail: 0 })
  expect(await screen.findByRole('dialog')).toBeInTheDocument()
  unmount()
})

it('cancels a drag when a second finger lands and does not resume it mid-gesture', async () => {
  const { stack, activeCard } = await renderShelf()
  const card = activeCard()
  fireEvent.touchStart(card, { touches: [touch(220)] })
  fireEvent.touchMove(card, { touches: [touch(190)] })
  fireEvent.touchStart(card, {
    touches: [touch(190), touch(280, 160, 2)]
  })
  expect(card.style.transform).toBe('')
  fireEvent.touchEnd(card, {
    touches: [touch(190)],
    changedTouches: [touch(280, 160, 2)]
  })
  fireEvent.touchMove(card, { touches: [touch(80)] })
  fireEvent.touchEnd(card, { touches: [], changedTouches: [touch(80)] })
  fireEvent.click(card, { detail: 1 })

  expect(screen.getByText('01 / 08')).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(stack.querySelector('[style*="translate3d"]')).toBeNull()
})

it('ignores a gesture that begins with multiple fingers', async () => {
  const { stack } = await renderShelf()
  fireEvent.touchStart(stack, {
    touches: [touch(220), touch(280, 160, 2)]
  })
  fireEvent.touchMove(stack, {
    touches: [touch(100), touch(300, 160, 2)]
  })
  fireEvent.touchEnd(stack, {
    touches: [],
    changedTouches: [touch(100), touch(300, 160, 2)]
  })
  expect(screen.getByText('01 / 08')).toBeInTheDocument()
})

it('does not finish a swipe using the coordinates of an unrelated finger', async () => {
  const { stack } = await renderShelf()
  fireEvent.touchStart(stack, { touches: [touch(220)] })
  fireEvent.touchMove(stack, { touches: [touch(140)] })
  fireEvent.touchEnd(stack, {
    touches: [touch(140)],
    changedTouches: [touch(300, 160, 2)]
  })
  expect(screen.getByText('01 / 08')).toBeInTheDocument()
  fireEvent.touchEnd(stack, { touches: [], changedTouches: [touch(100)] })
  expect(screen.getByText('02 / 08')).toBeInTheDocument()
})

it('cleans up a cancelled drag without switching books or opening notes', async () => {
  const { stack, activeCard } = await renderShelf()
  const card = activeCard()
  fireEvent.touchStart(card, { touches: [touch(220)] })
  fireEvent.touchMove(card, { touches: [touch(100)] })
  fireEvent.touchCancel(card)
  fireEvent.click(card, { detail: 1 })
  expect(screen.getByText('01 / 08')).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(card.style.transform).toBe('')
  expect(card.style.transition).toBe('')

  swipe(stack, touch(220), touch(100))
  expect(screen.getByText('02 / 08')).toBeInTheDocument()
})
