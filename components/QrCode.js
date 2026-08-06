import { loadExternalResource } from '@/lib/utils'
import { useEffect, useRef } from 'react'

/**
 * 二维码生成
 */
export default function QrCode({ value, size = 256 }) {
  const containerRef = useRef(null)
  const qrCodeCDN =
    process.env.NEXT_PUBLIC_QR_CODE_CDN ||
    'https://s4.zstatic.net/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'

  useEffect(() => {
    let qrcode
    let isDisposed = false
    const container = containerRef.current
    if (!value || !container) return

    container.replaceChildren()
    loadExternalResource(qrCodeCDN, 'js')
      .then(() => {
        if (isDisposed || !container.isConnected) return

        const QRCode = window?.QRCode
        if (typeof QRCode !== 'undefined') {
          container.replaceChildren()
          qrcode = new QRCode(container, {
            text: value,
            width: size,
            height: size,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
          })
        }
      })
      .catch(error => {
        if (!isDisposed) {
          console.warn('[QrCode] resource load failed:', error)
        }
      })

    return () => {
      isDisposed = true
      qrcode?.clear()
      container.replaceChildren()
    }
  }, [qrCodeCDN, size, value])

  return <div ref={containerRef} />
}
