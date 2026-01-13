import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useGlobal } from '@/lib/global'

const BUSUANZI_SCRIPT_ID = 'busuanzi-script'
const BUSUANZI_SRC = '//cdn.busuanzi.cc/busuanzi/3.6.9/busuanzi.min.js' 
// 如果你想要数字缩写显示（1.23K），改成：
// const BUSUANZI_SRC = '//cdn.busuanzi.cc/busuanzi/3.6.9/busuanzi.abbr.min.js'

function loadBusuanziScript() {
  if (typeof document === 'undefined') return
  const old = document.getElementById(BUSUANZI_SCRIPT_ID)
  if (old) old.remove()

  const script = document.createElement('script')
  script.id = BUSUANZI_SCRIPT_ID
  script.src = BUSUANZI_SRC
  script.defer = true
  script.setAttribute('referrerpolicy', 'no-referrer-when-downgrade')
  document.head.appendChild(script)
}

export default function Busuanzi() {
  const router = useRouter()
  const { theme } = useGlobal()

  // 首次加载 + 路由切换刷新
  useEffect(() => {
    // 首次进入页面加载一次
    loadBusuanziScript()

    const handleRouteChange = () => {
      loadBusuanziScript()
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  // 更换主题时更新
  useEffect(() => {
    if (theme) loadBusuanziScript()
  }, [theme])
  return null
}
