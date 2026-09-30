import { act, fireEvent, render, screen } from '@testing-library/react'
import SearchInput from '@/themes/heo/components/SearchInput'

const push = jest.fn(() => Promise.resolve())

jest.mock('next/router', () => ({ useRouter: () => ({ push }) }))
jest.mock('@/lib/global', () => ({
  useGlobal: () => ({ locale: { SEARCH: { ARTICLES: 'Search articles' } } })
}))

it.each([true, false])('uses an encoded, deployment-compatible destination (static: %s)', async staticSearch => {
  render(<SearchInput staticSearch={staticSearch} />)
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: '  教程 / &?#  ' } })
  await act(async () => { fireEvent.keyUp(input, { keyCode: 13 }); await Promise.resolve() })
  expect(push).toHaveBeenCalledWith(staticSearch
    ? { pathname: '/search', query: { s: '教程 / &?#' } }
    : { pathname: '/search/[keyword]', query: { keyword: '教程 / &?#' } })
})

it('does not navigate while composing Chinese input', async () => {
  render(<SearchInput staticSearch />)
  const input = screen.getByRole('textbox')
  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '教程' } })
  fireEvent.keyUp(input, { keyCode: 13 })
  expect(push).not.toHaveBeenCalled()
  fireEvent.compositionEnd(input)
  await act(async () => { fireEvent.keyUp(input, { keyCode: 13 }); await Promise.resolve() })
  expect(push).toHaveBeenCalledWith({ pathname: '/search', query: { s: '教程' } })
})

it('stops showing the spinner when navigation fails', async () => {
  push.mockRejectedValueOnce(new Error('Navigation cancelled'))
  const { container } = render(<SearchInput />)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'tools' } })
  await act(async () => {
    fireEvent.keyUp(screen.getByRole('textbox'), { keyCode: 13 })
    await Promise.resolve()
  })
  expect(container.querySelector('.fa-spinner')).toBeNull()
  expect(container.querySelector('.fa-search')).not.toBeNull()
})
