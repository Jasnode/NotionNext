import { HashTag } from '@/components/HeroIcons'
import LazyImage from '@/components/LazyImage'
import NotionIcon from '@/components/NotionIcon'
import WordCount from '@/components/WordCount'
import { siteConfig } from '@/lib/config'
import { formatDateFmt } from '@/lib/utils/formatDate'
import Link from 'next/link'
import WavesArea from './WavesArea'

/**
 * 文章页头
 * @param {*} param0
 * @returns
 */
export default function PostHeader({ post, siteInfo, isDarkMode }) {
  if (!post) {
    return <></>
  }
  // 文章头图
  // 文章头图组件，接收文章信息、网站信息和暗黑模式状态作为props
const PostHeaderImage = ({ post, siteInfo, isDarkMode }) => {
  // 确定要使用的封面图：优先使用文章的封面图，如果没有则使用网站的默认封面图
  const headerImage = post?.pageCover || siteInfo?.pageCover;

  // 从网站配置中获取是否启用不蒜子统计的设置
  const ANALYTICS_BUSUANZI_ENABLE = siteConfig('ANALYTICS_BUSUANZI_ENABLE');

  // 根据是否为暗黑模式选择合适的颜色
  const bgColor = isDarkMode ? 'bg-amber-600' : 'bg-teal-400';
  const shadowColor = isDarkMode ? 'rgba(202, 138, 4, 0.8)' : 'rgba(117, 201, 200, 0.8)';

  return (
    // 文章头图的主容器
    <div
      id='post-bg'
      className={`md:mb-0 -mb-5 w-full h-[35rem] relative md:flex-shrink-0 overflow-hidden bg-cover bg-center bg-no-repeat z-10 ${bgColor} transition-colors duration-500`}
    >
      {/* 样式定义：为封面图添加渐变效果和动画 */}
      <style jsx>{`
        .coverdiv::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, ${shadowColor}, transparent 50%);
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .coverdiv:hover::before {
          opacity: 1;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
      `}</style>

      {/* 背景容器：应用颜色和flex布局 */}
      <div className={`absolute top-0 w-full h-full py-10 flex justify-center items-center`}>
        {/* 文章背景图容器：应用模糊效果和悬浮动画 */}
        <div
          id='post-cover-wrapper'
          className='coverdiv lg:opacity-80 transform lg:translate-x-32 lg:rotate-6 hover:scale-105 transition-all duration-500 ease-in-out'
          style={{
            filter: 'blur(10px)',
            animation: 'float 6s ease-in-out infinite'
          }}
        >
          {/* 懒加载封面图片 */}
          <LazyImage
            id='post-cover'
            className='w-full h-full object-cover max-h-[55rem] min-w-[60vw] min-h-[25rem] rounded-lg shadow-2xl'
            src={headerImage}
            alt="文章封面图"
          />
        </div>
      </div>

      {/* 添加一个标题覆盖层 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white text-center px-4 py-2 bg-black bg-opacity-50 rounded-lg transform hover:scale-105 transition-transform duration-300">
          {post.title}
        </h1>
      </div>
    </div>
  );
};

  // const headerImage = post?.pageCover ? post.pageCover : siteInfo?.pageCover
  // const ANALYTICS_BUSUANZI_ENABLE = siteConfig('ANALYTICS_BUSUANZI_ENABLE')
  // return (
  //   <div
  //     id='post-bg'
  //     className='md:mb-0 -mb-5 w-full h-[30rem] relative md:flex-shrink-0 overflow-hidden bg-cover bg-center bg-no-repeat z-10'>
  //     <style jsx>{`
  //       .coverdiv:after {
  //         position: absolute;
  //         content: '';
  //         width: 100%;
  //         height: 100%;
  //         top: 0;
  //         left: 0;
  //         box-shadow: 110px -130px 500px 100px ${isDarkMode
  //             ? '#CA8A04'
  //             : '#75C9C8'} inset;
  //       }
  //     `}</style>

  //     <div
  //       className={`${isDarkMode ? 'bg-[#CA8A04]' : 'bg-[#75C9C8]'} absolute top-0 w-full h-full py-10 flex justify-center items-center`}>
  //       {/* 文章背景图 */}
  //       <div
  //         id='post-cover-wrapper'
  //         style={{
  //           filter: 'blur(15px)'
  //         }}
  //         className='coverdiv lg:opacity-50 lg:translate-x-96 lg:rotate-12'>
  //         <LazyImage
  //           id='post-cover'
  //           className='w-full h-full object-cover max-h-[50rem] min-w-[50vw] min-h-[20rem]'
  //           src={headerImage}
  //         />
  //       </div>

        {/* 文章文字描述 */}
        <div
          id='post-info'
          className='absolute top-48 z-10 flex flex-col space-y-4 lg:-mt-12 w-full max-w-[86rem] px-5'>
          {/* 分类+标签 */}
          <div className='flex justify-center md:justify-start items-center gap-4'>
            {post.category && (
              <>
                <Link
                  href={`/category/${post.category}`}
                  className='mr-4'
                  passHref
                  legacyBehavior>
                  <div className='cursor-pointer font-sm font-bold px-3 py-1 rounded-lg  hover:bg-white text-white bg-blue-500 dark:bg-yellow-500 hover:text-blue-500 duration-200 '>
                    {post.category}
                  </div>
                </Link>
              </>
            )}

            {post.tagItems && (
              <div className='hidden md:flex justify-center flex-nowrap overflow-x-auto'>
                {post.tagItems.map((tag, index) => (
                  <Link
                    key={index}
                    href={`/tag/${encodeURIComponent(tag.name)}`}
                    passHref
                    className={
                      'cursor-pointer inline-block text-gray-50 hover:text-white duration-200 py-0.5 px-1 whitespace-nowrap '
                    }>
                    <div className='font-light flex items-center'>
                      <HashTag className='text-gray-200 stroke-2 mr-0.5 w-3 h-3' />{' '}
                      {tag.name + (tag.count ? `(${tag.count})` : '')}{' '}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 文章Title */}
          <div className='max-w-5xl font-bold text-3xl lg:text-5xl md:leading-snug shadow-text-md flex  justify-center md:justify-start text-white'>
            {siteConfig('POST_TITLE_ICON') && (
              <NotionIcon icon={post.pageIcon} />
            )}
            {post.title}
          </div>

          {/* 标题底部补充信息 */}
          <section className='flex-wrap dark:text-gray-200 text-opacity-70 shadow-text-md flex text-sm  justify-center md:justify-start mt-4 text-white font-light leading-8'>
            <div className='flex justify-center '>
              <div className='mr-2'>
                <WordCount />
              </div>
              {post?.type !== 'Page' && (
                <>
                  <Link
                    href={`/archive#${formatDateFmt(post?.publishDate, 'yyyy-MM')}`}
                    passHref
                    className='pl-1 mr-2 cursor-pointer hover:underline'>
                    <i className='fa-regular fa-calendar'></i>{' '}
                    {post?.publishDay}
                  </Link>
                </>
              )}

              <div className='pl-1 mr-2'>
                <i className='fa-regular fa-calendar-check'></i>{' '}
                {post.lastEditedDay}
              </div>
            </div>

            {/* 阅读统计 */}
            {ANALYTICS_BUSUANZI_ENABLE && (
              <div className='busuanzi_container_page_pv font-light mr-2'>
                <i className='fa-solid fa-fire-flame-curved'></i>{' '}
                <span className='mr-2 busuanzi_value_page_pv' />
              </div>
            )}
          </section>
        </div>

        <WavesArea />
      </div>
    </div>
  )
}
