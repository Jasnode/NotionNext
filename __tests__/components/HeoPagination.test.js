import { fireEvent, render, screen } from '@testing-library/react'
import PaginationNumber from '@/themes/heo/components/PaginationNumber'
import { useRouter } from 'next/router'

jest.mock('next/router', () => ({ useRouter: jest.fn() }))
jest.mock('@/lib/global', () => ({
  useGlobal: () => ({ locale: { PAGINATION: { PREV: 'Previous', NEXT: 'Next' } } })
}))
jest.mock('@/components/HeroIcons', () => ({ ChevronDoubleRight: () => null }))
jest.mock('@/components/SmartLink', () => function MockSmartLink({ href, children, passHref, ...props }) {
  const url = typeof href === 'string'
    ? href
    : href.pathname + (href.query?.s ? '?' + new URLSearchParams(href.query).toString() : '')
  return <a href={url} {...props}>{children}</a>
})

describe('Heo pagination crawlable boundaries', () => {
  it.each(['/page/2.html', '/category/教程/page/2.html', '/tag/教程/page/2.html/'])('normalizes the HTML alias %s and preserves search on every link', path => {
    const push = jest.fn()
    useRouter.mockReturnValue({ asPath: path + '?s=hello%20world#list', query: { s: 'hello world' }, push })
    const { container } = render(<PaginationNumber page={2} totalPage={3} />)
    const prefix = path.split('/page/')[0]
    for (const link of container.querySelectorAll('a')) {
      expect(link.getAttribute('href')).toMatch(/\?s=hello\+world$/)
      expect(link.getAttribute('href')).not.toMatch(/page\/2.*page|\.html|#list/)
    }
    expect(screen.getByText('3')).toHaveAttribute('href', `${prefix}/page/3?s=hello+world`)
    expect(screen.getAllByLabelText('Previous')[0]).toHaveAttribute('href', `${prefix || '/'}?s=hello+world`)
    fireEvent.input(screen.getByRole('textbox'), { target: { value: '3' } })
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
    expect(push).toHaveBeenCalledWith({ pathname: `${prefix}/page/3`, query: { s: 'hello world' } })
  })

  it.each(['/', '/tag/教程', '/category/工具'])('omits previous-page anchors on %s', path => {
    useRouter.mockReturnValue({ asPath: path, query: {} })
    const { container } = render(<PaginationNumber page={1} totalPage={3} />)
    expect(container.querySelector('a[rel="prev"]')).toBeNull()
    expect(container.querySelector('a[href$="/page/0"]')).toBeNull()
    expect(screen.getAllByLabelText('Next')[0]).toHaveAttribute('href', `${path === '/' ? '' : path}/page/2`)
  })

  it('links page two back to the list and omits next-page anchors at the end', () => {
    useRouter.mockReturnValue({ asPath: '/tag/教程/page/2?s=test', query: { s: 'test' } })
    const { container } = render(<PaginationNumber page={2} totalPage={2} />)
    expect(screen.getAllByLabelText('Previous')[0]).toHaveAttribute('href', '/tag/教程?s=test')
    expect(container.querySelector('a[rel="next"]')).toBeNull()
  })

  it.each([1, 3])('preserves desktop side slots on boundary page %s', page => {
    useRouter.mockReturnValue({ asPath: '/', query: {} })
    const { container } = render(<PaginationNumber page={page} totalPage={3} />)
    const desktop = container.querySelector('nav > div')
    expect(desktop.children).toHaveLength(3)
    const placeholder = desktop.children[page === 1 ? 0 : 2]
    expect(placeholder).toHaveClass('w-24', 'h-10', 'invisible')
    expect(placeholder).not.toHaveAttribute('href')
  })

  it('keeps query searches on the static search route for links and manual jumps', () => {
    const push = jest.fn()
    useRouter.mockReturnValue({
      route: '/search', asPath: '/search?s=tools&page=2',
      query: { s: 'tools', page: '2' }, push
    })
    render(<PaginationNumber page={2} totalPage={3} />)
    expect(screen.getByText('1')).toHaveAttribute('href', '/search?s=tools')
    expect(screen.getByText('3')).toHaveAttribute('href', '/search?s=tools&page=3')
    fireEvent.input(screen.getByRole('textbox'), { target: { value: '3' } })
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
    expect(push).toHaveBeenCalledWith({ pathname: '/search', query: { s: 'tools', page: 3 } })
  })
})
