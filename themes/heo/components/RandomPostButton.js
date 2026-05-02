import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'

/**
 * 随机跳转到一个文章
 */
export default function RandomPostButton(props) {
  const { latestPosts } = props
  const router = useRouter()
  const { locale } = useGlobal()
  const posts = Array.isArray(latestPosts)
    ? latestPosts.filter(post => post?.slug)
    : []

  /**
   * 随机跳转文章
   */
  function handleClick() {
    if (posts.length === 0) return

    const randomPost = posts[Math.floor(Math.random() * posts.length)]
    router.push(`${siteConfig('SUB_PATH', '')}/${randomPost.slug}`)
  }

  if (posts.length === 0) {
    return null
  }

  return (
        <div title={locale.MENU.WALK_AROUND} className='cursor-pointer hover:bg-[rgba(139,92,246,0.12)] dark:hover:bg-[rgba(139,92,246,0.2)] rounded-full w-10 h-10 flex justify-center items-center duration-200 transition-all' onClick={handleClick}>
            <i className="fa-solid fa-podcast"></i>
        </div>
  )
}
