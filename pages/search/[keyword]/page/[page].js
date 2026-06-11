import BLOG from '@/blog.config'
import { getDataFromCache } from '@/lib/cache/cache_manager'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { buildPostSearchResult } from '@/lib/utils/search'
import { DynamicLayout } from '@/themes/theme'
import { getPageBlockCacheKey } from '@/lib/db/notion/getPostBlocks'

const Index = props => {
  const { keyword } = props
  props = { ...props, currentSearch: keyword }

  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutSearch' {...props} />
}

/**
 * 服务端搜索
 * @param {*} param0
 * @returns
 */
export async function getStaticProps({ params: { keyword, page }, locale }) {
  const props = await fetchGlobalAllData({
    from: 'search-props',
    pageType: ['Post'],
    locale
  })
  const { allPages } = props
  const allPosts = allPages?.filter(
    page => page.type === 'Post' && page.status === 'Published'
  ) || []
  props.posts = await filterByMemCache(allPosts, keyword)
  props.postCount = props.posts.length
  const POSTS_PER_PAGE = siteConfig('POSTS_PER_PAGE', 12, props?.NOTION_CONFIG)
  // 处理分页
  props.posts = props.posts.slice(
    POSTS_PER_PAGE * (page - 1),
    POSTS_PER_PAGE * page
  )
  props.keyword = keyword
  props.page = page
  delete props.allPages
  return {
    props,
    revalidate: process.env.EXPORT
      ? undefined
      : siteConfig(
          'NEXT_REVALIDATE_SECOND',
          BLOG.NEXT_REVALIDATE_SECOND,
          props.NOTION_CONFIG
        )
  }
}

export function getStaticPaths() {
  return {
    paths: [{ params: { keyword: 'NotionNext', page: '1' } }],
    fallback: true
  }
}

/**
 * 在内存缓存中进行全文索引
 * @param {*} allPosts
 * @param keyword 关键词
 * @returns
 */
async function filterByMemCache(allPosts, keyword) {
  const filterPosts = []
  for (const post of allPosts) {
    const cacheKey = getPageBlockCacheKey(post.id, post.lastEditedDate)
    const page = await getDataFromCache(cacheKey, true)
    const resultPost = buildPostSearchResult(post, page, keyword)
    if (resultPost) {
      filterPosts.push(resultPost)
    }
  }
  return filterPosts
}

export default Index
