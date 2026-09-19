import { getStaticProps as getDashboardProps } from '@/pages/dashboard/[[...index]]'
import { getStaticProps as getSignInProps } from '@/pages/sign-in/[[...index]]'
import { getStaticProps as getSignUpProps } from '@/pages/sign-up/[[...index]]'
import { fetchGlobalAllData, resolvePostProps } from '@/lib/db/SiteDataApi'

jest.mock('@/lib/config', () => ({
  siteConfig: jest.fn((key, defaultVal) => defaultVal)
}))

jest.mock('@/lib/db/SiteDataApi', () => ({
  fetchGlobalAllData: jest.fn(),
  resolvePostProps: jest.fn()
}))

jest.mock('@/themes/theme', () => ({
  DynamicLayout: () => null
}))

const CLERK_KEY = 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'

describe('clerk route guards', () => {
  const originalKey = process.env[CLERK_KEY]

  beforeEach(() => {
    fetchGlobalAllData.mockResolvedValue({ NOTION_CONFIG: {}, allPages: [] })
    resolvePostProps.mockResolvedValue({ NOTION_CONFIG: {}, post: null })
  })

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env[CLERK_KEY]
    } else {
      process.env[CLERK_KEY] = originalKey
    }
  })

  it('404s the auth routes when clerk is not configured', async () => {
    delete process.env[CLERK_KEY]

    await expect(getSignInProps({ locale: 'zh-CN' })).resolves.toEqual({
      notFound: true
    })
    await expect(getSignUpProps({ locale: 'zh-CN' })).resolves.toEqual({
      notFound: true
    })
    // 空壳 dashboard 的 404 要能过期，否则之后建了同名 Notion 页也打不开
    await expect(getDashboardProps({ locale: 'zh-CN' })).resolves.toMatchObject(
      {
        notFound: true,
        revalidate: expect.anything()
      }
    )
    expect(fetchGlobalAllData).not.toHaveBeenCalled()
  })

  it('serves the auth routes once clerk is configured', async () => {
    process.env[CLERK_KEY] = 'pk_test_example'

    await expect(getSignInProps({ locale: 'zh-CN' })).resolves.toHaveProperty(
      'props'
    )
    await expect(getSignUpProps({ locale: 'zh-CN' })).resolves.toHaveProperty(
      'props'
    )
  })

  it('keeps a notion-backed dashboard page even without clerk', async () => {
    delete process.env[CLERK_KEY]
    resolvePostProps.mockResolvedValue({
      NOTION_CONFIG: {},
      post: { title: 'Dashboard', slug: 'dashboard' }
    })

    await expect(
      getDashboardProps({ locale: 'zh-CN' })
    ).resolves.toHaveProperty('props.post.slug', 'dashboard')
  })
})
