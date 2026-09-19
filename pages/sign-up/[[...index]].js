import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { DynamicLayout } from '@/themes/theme'

/**
 * 注册
 * @param {*} props
 * @returns
 */
const SignUp = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutSignUp' {...props} />
}

export async function getStaticProps(req) {
  const { locale } = req

  // Clerk 未配置时这个路由只会渲染空壳，返回真 404 而不是可抓取的空白 200
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return { notFound: true }
  }

  const from = 'SignIn'
  const props = await fetchGlobalAllData({ from, locale })

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

/**
 * catch-all route for clerk
 * @returns
 */
export function getStaticPaths() {
  return {
    paths: [
      { params: { index: [] } }, // 使 /sign-up 路径可访问
      { params: { index: ['sign-up'] } } // 明确 sign-up 生成路径
    ],
    fallback: 'blocking' // 使用 'blocking' 模式让未生成的路径也能正确响应
  }
}
export default SignUp
