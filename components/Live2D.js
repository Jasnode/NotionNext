/* eslint-disable no-undef */
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { isMobile, loadExternalResource } from '@/lib/utils'
import { useEffect } from 'react'
import { getDevicePerformance } from '@/components/PerformanceDetector'

/**
 * 网页动画
 * @returns
 */
export default function Live2D() {
  const { theme, switchTheme } = useGlobal()
  const showPet = JSON.parse(siteConfig('WIDGET_PET'))
  const petLink = siteConfig('WIDGET_PET_LINK')
  const petSwitchTheme = siteConfig('WIDGET_PET_SWITCH_THEME')
  // 获取设备性能信息
  const { isLowEndDevice } = getDevicePerformance()

  useEffect(() => {
    // 低端设备不加载 Live2D
    if (isLowEndDevice) return

    if (showPet && !isMobile()) {
      Promise.all([
        loadExternalResource(
          'https://cdn.jsdmirror.com/gh/stevenjoezhang/live2d-widget@latest/live2d.min.js',
          'js'
        )
      ]).then(() => {
        if (typeof window?.loadlive2d !== 'undefined') {
          try {
            loadlive2d('live2d', petLink)
          } catch (error) {
            console.error('读取PET模型', error)
          }
        }
      })
    }
  }, [theme, isLowEndDevice])

  function handleClick() {
    if (petSwitchTheme) {
      switchTheme()
    }
  }

  // 低端设备或关闭宠物时不渲染
  if (!showPet || isLowEndDevice) {
    return <></>
  }

  return (
    <canvas
      id='live2d'
      width='280'
      height='250'
      onClick={handleClick}
      className='cursor-grab'
      onMouseDown={e => e.target.classList.add('cursor-grabbing')}
      onMouseUp={e => e.target.classList.remove('cursor-grabbing')}
    />
  )
}
