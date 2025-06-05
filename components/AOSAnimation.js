import { loadExternalResource } from '@/lib/utils'
import { useEffect } from 'react'
// import AOS from 'aos'

/**
 * 加载滚动动画
 * 改从外部CDN读取
 * https://michalsnik.github.io/aos/
 */
export default function AOSAnimation() {
  const initAOS = () => {
    Promise.all([
      loadExternalResource(
        'https://cdn.jsdmirror.cn/npm/aos@2.3.4/dist/aos.min.js',
        'js'
      ),
      loadExternalResource(
        'https://cdn.jsdmirror.cn/npm/aos@2.3.4/dist/aos.min.css',
        'css'
      )
    ]).then(() => {
      if (window.AOS) {
        window.AOS.init()
      }
    })
  }
  useEffect(() => {
    initAOS()
  }, [])
}
