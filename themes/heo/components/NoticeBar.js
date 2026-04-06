import { ArrowRightCircle } from '@/components/HeroIcons'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import CONFIG from '../config'
import Swipe from './Swipe'

/**
 * 通知横幅
 */
export function NoticeBar() {
  let notices = siteConfig('HEO_NOTICE_BAR', null, CONFIG)
  const { locale } = useGlobal()
  if (typeof notices === 'string') {
    notices = JSON.parse(notices)
  }
  if (!notices || notices?.length === 0) {
    return <></>
  }

  return (
    <div className='max-w-[86rem] w-full mx-auto md:px-5'>
      <div className='xl:flex w-full px-5 md:px-0'>
        <div className='flex h-12 mb-4 font-bold w-full'>
          <div className='animate__animated animate__fadeIn animate__fast group cursor-pointer bg-white dark:bg-[#1e1e1e] dark:text-white hover:border-indigo-600 dark:hover:border-yellow-600 border dark:border-gray-700  duration-300 hover:shadow-xl transition-all rounded-3xl w-full h-full flex items-center justify-between px-5'>
            <span className='whitespace-nowrap'>{locale.COMMON.NOW}</span>
            <div className='w-full h-full hover:text-indigo-600 dark:hover:text-[#ffc848] flex justify-center items-center'>
              <Swipe items={notices} />
            </div>
            <div>
              <ArrowRightCircle className={'w-5 h-5'} />
            </div>
          </div>
        </div>
        {/* 右侧占位：与侧边栏同宽，保持对齐 */}
        <div className='hidden xl:block xl:px-2'></div>
        <div className='hidden xl:block w-72 flex-shrink-0'></div>
      </div>
    </div>
  )
}
