import { fireEvent, render, screen } from '@testing-library/react'
import ShareButtons from '@/components/ShareButtons'

jest.mock('@/lib/config', () => ({
  siteConfig: jest.fn(key => {
    const values = {
      LINK: 'https://blog.example.com',
      POSTS_SHARE_SERVICES: 'wechat',
      TITLE: 'Blog'
    }
    return values[key]
  })
}))

jest.mock('@/lib/global', () => ({
  useGlobal: jest.fn(() => ({
    locale: {
      COMMON: {
        SCAN_QR_CODE: '扫码分享',
        URL_COPIED: '链接已复制'
      }
    }
  }))
}))

jest.mock('@/lib/utils/share', () => ({
  buildQQShareUrl: jest.fn()
}))

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({ asPath: '/article/46' }))
}))

jest.mock('next/dynamic', () => {
  const React = require('react')
  return jest.fn(
    () =>
      function MockQrCode({ value }) {
        return React.createElement('div', {
          'data-testid': 'qr-code',
          'data-value': value
        })
      }
  )
})

jest.mock('next/image', () => ({
  __esModule: true,
  default: () => null
}))

jest.mock('react-share', () => ({}))

describe('ShareButtons WeChat popover', () => {
  const renderShareButtons = () => {
    const result = render(
      <ShareButtons post={{ title: 'Article', summary: 'Summary', tags: [] }} />
    )
    const button = screen.getByRole('button', { name: 'wechat' })
    button.getBoundingClientRect = jest.fn(() => ({
      bottom: 232,
      height: 32,
      left: 100,
      right: 132,
      top: 200,
      width: 32
    }))
    return { ...result, button }
  }

  it('portals the QR dialog outside the share button container', () => {
    const { button } = renderShareButtons()

    fireEvent.click(button)

    const dialog = screen.getByRole('dialog', { name: '扫码分享' })
    expect(document.body).toContainElement(dialog)
    expect(dialog.parentElement).toBe(document.body)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('qr-code')).toHaveAttribute(
      'data-value',
      window.location.href
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(
      screen.queryByRole('dialog', { name: '扫码分享' })
    ).not.toBeInTheDocument()
  })

  it('supports keyboard opening and closes with Escape or an outside click', () => {
    const { button } = renderShareButtons()

    fireEvent.focus(button)
    expect(screen.getByRole('dialog', { name: '扫码分享' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(
      screen.queryByRole('dialog', { name: '扫码分享' })
    ).not.toBeInTheDocument()
    expect(button).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(button)
    expect(screen.getByRole('dialog', { name: '扫码分享' })).toBeInTheDocument()

    fireEvent.pointerDown(document.body)
    expect(
      screen.queryByRole('dialog', { name: '扫码分享' })
    ).not.toBeInTheDocument()
  })
})
