import { useEffect, useRef } from 'react'
import { loadExternalResource } from '@/lib/utils'

/**
 * 滚动阻尼特效
 * @returns {JSX.Element}
 */
const Lenis = () => {
  const lenisRef = useRef(null) // 用于存储 Lenis 实例
  const rafIdRef = useRef(null) // 用于存储 requestAnimationFrame ID
  const isAbortedRef = useRef(false) // 防止组件卸载后继续初始化

  useEffect(() => {
    isAbortedRef.current = false
    // 异步加载
    async function loadLenis() {
      try {
        await loadExternalResource('/js/lenis.js', 'js')

        // console.log('Lenis', window.Lenis)
        if (!window.Lenis) {
          console.error('Lenis not loaded')
          return
        }
        const LenisLib = window.Lenis
        if (isAbortedRef.current) return

        // 等待 DOM 完全加载
        if (document.readyState === 'loading') {
          await new Promise(resolve => {
            const done = () => resolve()
            window.addEventListener('DOMContentLoaded', done, { once: true })
          })
          if (isAbortedRef.current) return
        }

        // 创建 Lenis 实例
        const lenis = new LenisLib({
          duration: 1.2,
          easing: t => 1 - Math.pow(1 - t, 3),
          direction: 'vertical', // vertical, horizontal
          gestureDirection: 'vertical', // vertical, horizontal, both
          smooth: true,
          mouseMultiplier: 1,
          smoothTouch: false,
          touchMultiplier: 2,
          infinite: false
        })

        // 存储实例到 ref
        lenisRef.current = lenis

        // 监听滚动事件
        // lenis.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
        // console.log({ scroll, limit, velocity, direction, progress })
        // })

        // 动画帧循环
        const raf = (time) => {
          if (isAbortedRef.current || !lenisRef.current) return
          lenisRef.current.raf(time)
          rafIdRef.current = requestAnimationFrame(raf)
        }

        rafIdRef.current = requestAnimationFrame(raf)
      } catch (error) {
        console.error('Failed to load Lenis:', error)
      }
    }

    loadLenis()

    return () => {
      // 在组件卸载时清理资源
      isAbortedRef.current = true
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      if (lenisRef.current) {
        lenisRef.current.destroy() // 销毁 Lenis 实例
        lenisRef.current = null
        // console.log('Lenis instance destroyed')
      }
    }
  }, [])

  return <></>
}

export default Lenis
