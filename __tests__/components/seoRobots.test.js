import { render } from '@testing-library/react'
import SEO from '@/components/SEO'

jest.mock('@/lib/config', () => ({
  siteConfig: jest.fn()
}))

jest.mock('@/lib/global', () => ({
  useGlobal: () => ({
    locale: {
      NAV: {
        ARCHIVE: 'Archive',
        SEARCH: 'Search',
        PAGE_NOT_FOUND: 'Not Found'
      },
      COMMON: { CATEGORY: 'Category', TAGS: 'Tags' }
    }
  })
}))

const routerState = { route: '/', query: {} }

jest.mock('next/router', () => ({
  useRouter: () => routerState
}))

const { siteConfig } = require('@/lib/config')

const baseSiteConfig = {
  AUTHOR: 'Example Author',
  LINK: 'https://example.com',
  SEO_BRAND: 'Example Blog',
  TITLE: 'Example Blog',
  PATH: '',
  SUB_PATH: '',
  LANG: 'en-US'
}

const renderAt = (route, props = {}) => {
  routerState.route = route
  routerState.query = {}
  siteConfig.mockImplementation((key, defaultVal) =>
    Object.prototype.hasOwnProperty.call(baseSiteConfig, key)
      ? baseSiteConfig[key]
      : defaultVal
  )

  const { container } = render(
    <SEO
      siteInfo={{
        title: 'Example Blog',
        description: 'Example description',
        icon: '/logo.png',
        pageCover: '/cover.png',
        link: 'https://example.com'
      }}
      {...props}
    />
  )

  return {
    robots: container
      .querySelector('meta[name="robots"]')
      ?.getAttribute('content'),
    canonical: container.querySelector('link[rel="canonical"]'),
    jsonLd: JSON.parse(
      container.querySelector('script[type="application/ld+json"]').innerHTML
    )
  }
}

describe('SEO robots directives', () => {
  // 站内工具页，本身没有可索引内容
  it.each(['/search', '/404', '/500', '/auth'])(
    'keeps %s out of the index and drops its canonical',
    route => {
      const { robots, canonical } = renderAt(route)

      expect(robots).toMatch(/^noindex/)
      expect(canonical).toBeNull()
    }
  )

  // 未配置 Clerk 时这些路由照样被预渲染，但 heo 回退到 LayoutSlug 后是空壳
  it.each([
    '/sign-in/[[...index]]',
    '/sign-up/[[...index]]',
    '/dashboard/[[...index]]'
  ])('keeps %s out of the index while it has no post', route => {
    const { robots, canonical } = renderAt(route)

    expect(robots).toMatch(/^noindex/)
    expect(canonical).toBeNull()
  })

  it('still indexes a post-backed route that falls through to the default meta', () => {
    const { robots, canonical } = renderAt('/dashboard/[[...index]]', {
      post: { title: 'Dashboard', slug: 'dashboard', type: 'Page' }
    })

    expect(robots).toMatch(/^index/)
    expect(canonical.getAttribute('href')).toBe('https://example.com/dashboard')
  })

  it.each(['/', '/archive', '/page/[page]', '/category/[category]'])(
    'keeps %s indexable with a canonical',
    route => {
      const { robots, canonical } = renderAt(route, { page: 2 })

      expect(robots).toMatch(/^index/)
      expect(canonical).not.toBeNull()
    }
  )

  it('does not leave a loading placeholder in the title', () => {
    routerState.route = '/sign-in/[[...index]]'
    routerState.query = {}
    siteConfig.mockImplementation((key, defaultVal) =>
      Object.prototype.hasOwnProperty.call(baseSiteConfig, key)
        ? baseSiteConfig[key]
        : defaultVal
    )
    render(<SEO siteInfo={{ title: 'Example Blog' }} />)

    expect(document.title).toBe('Example Blog')
  })
})

describe('SEO gated content signal', () => {
  const postAt = password =>
    renderAt('/[prefix]', {
      post: {
        title: 'Gated post',
        slug: 'article/gated',
        type: 'Post',
        summary: 'Summary',
        ...(password ? { password } : {})
      }
    }).jsonLd['@graph'].find(item => item['@type'] === 'BlogPosting')

  // post.password 是哈希值，走 CLIENT_POST_SUMMARY_FIELDS 白名单到达 pageProps；
  // 这里守的是 getSEOMeta 真的把它接到 isAccessibleForFree 上
  it('declares a password-protected post as gated', () => {
    expect(postAt('5f4dcc3b5aa765d61d8327deb882cf99').isAccessibleForFree).toBe(
      false
    )
  })

  it('declares an open post as freely accessible', () => {
    expect(postAt(null).isAccessibleForFree).toBe(true)
  })
})
