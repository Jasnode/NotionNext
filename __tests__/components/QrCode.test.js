import { act, render, waitFor } from '@testing-library/react'
import QrCode from '@/components/QrCode'
import { loadExternalResource } from '@/lib/utils'

jest.mock('@/lib/utils', () => ({
  loadExternalResource: jest.fn()
}))

describe('QrCode', () => {
  let warnSpy

  beforeEach(() => {
    delete window.QRCode
    loadExternalResource.mockReset()
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    delete window.QRCode
  })

  it('does not initialize after the component has unmounted', async () => {
    let resolveResource
    loadExternalResource.mockReturnValue(
      new Promise(resolve => {
        resolveResource = resolve
      })
    )
    const QRCode = jest.fn()
    QRCode.CorrectLevel = { H: 'high' }
    window.QRCode = QRCode

    const { unmount } = render(<QrCode value='https://example.com' />)
    unmount()

    await act(async () => {
      resolveResource('loaded')
      await Promise.resolve()
    })

    expect(QRCode).not.toHaveBeenCalled()
  })

  it('renders multiple instances into their own containers', async () => {
    loadExternalResource.mockResolvedValue('loaded')
    const QRCode = jest.fn(function (target, options) {
      this.clear = jest.fn()
      target.dataset.qrValue = options.text
    })
    QRCode.CorrectLevel = { H: 'high' }
    window.QRCode = QRCode

    const { container } = render(
      <>
        <QrCode value='https://example.com/one' size={96} />
        <QrCode value='https://example.com/two' size={128} />
      </>
    )

    await waitFor(() => expect(QRCode).toHaveBeenCalledTimes(2))

    expect(QRCode.mock.calls[0][0]).toBe(container.children[0])
    expect(QRCode.mock.calls[1][0]).toBe(container.children[1])
    expect(container.children[0]).toHaveAttribute(
      'data-qr-value',
      'https://example.com/one'
    )
    expect(container.children[1]).toHaveAttribute(
      'data-qr-value',
      'https://example.com/two'
    )
  })

  it('handles resource loading failures without an unhandled rejection', async () => {
    const error = new Error('network failed')
    loadExternalResource.mockRejectedValue(error)

    render(<QrCode value='https://example.com' />)

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        '[QrCode] resource load failed:',
        error
      )
    })
  })
})
