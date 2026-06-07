import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

/**
 * 滚动阻尼特效
 *
 * 使用 npm 包版 Lenis v1.3.x，同时保留原来的桌面滚动体感。
 */
const Lenis = () => {
  const lenisRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    // 仅桌面且未开启“减少动态效果”时启用，移动/触屏设备保留原生滚动。
    const isDesktopLike = window.matchMedia(
      '(min-width: 1024px) and (pointer: fine) and (hover: hover)'
    ).matches
    if (!isDesktopLike) return

    const allowMotion = window.matchMedia(
      '(prefers-reduced-motion: no-preference)'
    ).matches
    if (!allowMotion) return

    let isDisposed = false

    async function initLenis() {
      try {
        const { default: LenisLib } = await import('lenis')
        if (isDisposed) return

        const platform =
          navigator.userAgentData?.platform || navigator.platform || ''
        const isAppleLike =
          /mac|iphone|ipad|ipod/i.test(platform) ||
          /Mac OS X|iPad|iPhone|iPod/i.test(navigator.userAgent)
        const wheelMultiplier = isAppleLike ? 0.4 : 0.86

        const lenis = new LenisLib({
          duration: 1.1,
          easing: t => 1 - Math.pow(1 - t, 3),

          // v1 API 映射
          autoRaf: true,
          anchors: true,
          stopInertiaOnNavigate: true,
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier,
          syncTouch: false,
          touchMultiplier: 2
        })

        if (isDisposed) {
          lenis.destroy()
          return
        }

        lenisRef.current = lenis
      } catch (error) {
        console.error('Failed to initialize Lenis:', error)
      }
    }

    // Next.js 跨页导航前清掉上一页残留的滚动惯性。
    const stopInertia = () => {
      if (lenisRef.current) {
        lenisRef.current.stop()
        lenisRef.current.start()
      }
    }

    router.events.on('routeChangeStart', stopInertia)
    initLenis()

    return () => {
      isDisposed = true
      router.events.off('routeChangeStart', stopInertia)
      lenisRef.current?.destroy()
      lenisRef.current = null
    }
  }, [router.events])

  return <></>
}

export default Lenis
