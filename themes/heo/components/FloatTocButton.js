import { useState } from 'react'
import Catalog from './Catalog'

/**
 * 移动端悬浮目录按钮
 */
export default function FloatTocButton(props) {
  const [tocVisible, changeTocVisible] = useState(false)

  const { post, lock } = props

  const toggleToc = () => {
    changeTocVisible(!tocVisible)
  }

  const closeToc = () => {
    changeTocVisible(false)
  }

  //   没有目录或文章上锁时隐藏该按钮
  if (!post || lock || !post.toc || post.toc.length < 1) {
    return <></>
  }

  return (<div className='fixed lg:hidden right-4 bottom-24 z-40'>
        {/* 按钮 */}
        <div onClick={toggleToc} className={'relative z-50 w-11 h-11 select-none hover:scale-110 transform duration-200 text-black dark:text-gray-200 rounded-full bg-white drop-shadow-lg flex justify-center items-center dark:bg-hexo-black-gray py-2 px-2'}>
            <button id="toc-button" className={'fa-list-ol cursor-pointer fas'} />
        </div>

        {/* 目录Modal */}
        <div className='fixed inset-0 z-40 flex items-center justify-center px-4 pointer-events-none'>
            {/* 侧边菜单 */}
            <div
                className={`${tocVisible ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'} shadow-card dark:bg-black w-full max-w-sm duration-200 rounded-[1.75rem] py-3 bg-white dark:bg-gray-900 border border-black/5 dark:border-white/10`}>
                {post && <>
                    <div className='dark:text-gray-400 text-gray-600'>
                        <Catalog toc={post.toc} onItemClick={closeToc} />
                    </div>
                </>
                }
            </div>
        </div>
        {/* 背景蒙版 */}
        <div id='right-drawer-background' className={(tocVisible ? 'block' : 'hidden') + ' fixed top-0 left-0 z-30 w-full h-full bg-white/20 backdrop-blur-[2px] backdrop-saturate-125 dark:bg-black/25'}
            onClick={toggleToc} />
    </div>)
}
