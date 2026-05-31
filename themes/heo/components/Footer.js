import { BeiAnGongAn } from '@/components/BeiAnGongAn'
import CopyRightDate from '@/components/CopyRightDate'
import PoweredBy from '@/components/PoweredBy'
import { siteConfig } from '@/lib/config'
import SocialButton from './SocialButton'
import LazyImage from '@/components/LazyImage'
/**
 * 页脚
 * @returns
 */
const Footer = () => {
  const BEI_AN = siteConfig('BEI_AN')
  const BEI_AN_LINK = siteConfig('BEI_AN_LINK')
  return (
    <footer className='relative flex-shrink-0 bg-white dark:bg-[#17191d] justify-center text-center m-auto w-full leading-6  text-gray-600 dark:text-gray-100 text-sm'>
      {/* 颜色过度区 */}
      <div
        id='color-transition'
        className='h-20 bg-gradient-to-b from-[#f7f9fe] to-white  dark:bg-[#17191d] dark:from-inherit dark:to-inherit'
      />

      {/* 社交按钮 */}
      <div className='w-full h-24'>
        <SocialButton />
      </div>

      {/* 底部页面信息 */}
      <div
        id='footer-bottom'
        className='w-full min-h-[5rem] flex flex-col py-4 px-6 lg:flex-row lg:items-center justify-between gap-2 lg:gap-3 bg-[#f1f3f7] dark:bg-[#21232A] border-t dark:border-t-[#3D3D3F] relative overflow-hidden'>
        {/* 装饰背景 */}
        <div className='absolute inset-0 pointer-events-none overflow-hidden'>
          <div className='dark:hidden'>
            <div className='absolute top-0 left-1/4 w-40 h-40 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-20' />
            <div className='absolute top-0 right-1/4 w-40 h-40 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-20' />
            <div className='absolute bottom-0 left-1/2 w-40 h-40 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-20' />
          </div>
          <div className='hidden dark:block'>
            <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-500/30 to-transparent' />
          </div>
        </div>

        <div
          id='footer-bottom-left'
          className='relative z-10 flex flex-col sm:flex-row items-center gap-2 sm:gap-4'>
          <PoweredBy />
          <span className='hidden sm:inline text-gray-300 dark:text-gray-400'>|</span>
          <CopyRightDate />
        </div>

        <div
          id='footer-bottom-right'
          className='relative z-10 flex flex-wrap items-center justify-center gap-y-2 gap-x-1 text-xs sm:text-sm'>
          {BEI_AN && (
            <div className='inline-flex items-center gap-1.5 mr-2'>
              <LazyImage
                src='https://cdn.jsdmirror.com/gh/88lin/picx-images-hosting@master/icon120.5xb0hthnf2.webp'
                className='w-5 h-5'
                alt='萌ICP备案图标'
              />
              <a
                href={BEI_AN_LINK}
                target='_blank'
                rel='noopener noreferrer'>
                {BEI_AN}
              </a>
            </div>
          )}
          <BeiAnGongAn />

          <span className='hidden busuanzi_container_site_pv'>
            <i className='fas fa-eye text-red-400 dark:text-red-300' />
            <span className='px-1 busuanzi_value_site_pv'> </span>{' '}
          </span>
          <span className='pl-2 hidden busuanzi_container_site_uv'>
            <i className='fas fa-users text-emerald-400 dark:text-emerald-300' />{' '}
            <span className='px-1 busuanzi_value_site_uv'> </span>{' '}
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
