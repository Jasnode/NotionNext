import throttle from 'lodash.throttle'
import { useEffect, useRef } from 'react'

/**
 * 回顶按钮
 * @returns
 */
export const BackToTopButton = () => {
  // 滚动监听
  const navBarScollListenerRef = useRef(null)
  if (!navBarScollListenerRef.current) {
    navBarScollListenerRef.current = throttle(() => {
      const scrollY = window.scrollY
      // 显示或隐藏返回顶部按钮
      const backToTop = document.querySelector('.back-to-top')
      if (backToTop) {
        backToTop.style.display = scrollY > 50 ? 'flex' : 'none'
      }
    }, 200)
  }
  const navBarScollListener = navBarScollListenerRef.current

  useEffect(() => {
    window.addEventListener('scroll', navBarScollListener, { passive: true })
    return () => {
      window.removeEventListener('scroll', navBarScollListener)
      navBarScollListener.cancel()
    }
  }, [navBarScollListener])

  // 使用原生 scrollTo，Lenis 激活时会自动接管动画
  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* <!-- ====== Back To Top Start --> */}
      <a
        onClick={scrollTop}
        className='back-to-top cursor-pointer fixed bottom-16 left-auto right-8 z-[999] hidden h-10 w-10 items-center justify-center rounded-md bg-primary text-white shadow-md transition duration-300 ease-in-out hover:bg-dark'>
        <span className='mt-[6px] h-3 w-3 rotate-45 border-l border-t border-white'></span>
      </a>
      {/* <!-- ====== Back To Top End --> */}
    </>
  )
}
