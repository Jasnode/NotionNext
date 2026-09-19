import fs from 'fs'
import { generateLlmsTxt } from '@/lib/utils/llms.txt'

jest.mock('@/lib/config', () => ({
  siteConfig: jest.fn((key, defaultVal, extendConfig = {}) => {
    if (Object.prototype.hasOwnProperty.call(extendConfig, key)) {
      return extendConfig[key]
    }
    return defaultVal
  })
}))

describe('generateLlmsTxt', () => {
  let writeSpy

  beforeEach(() => {
    writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
  })

  afterEach(() => {
    writeSpy.mockRestore()
  })

  it('writes a concise discovery file and a complete content index', () => {
    const allPages = Array.from({ length: 22 }, (_, index) => ({
      title: `Article ${index + 1}`,
      slug: `article/${index + 1}`,
      status: 'Published',
      summary: `Summary ${index + 1}`,
      publishDay: `2026-01-${String(index + 1).padStart(2, '0')}`,
      lastEditedDay: `2026-02-${String(index + 1).padStart(2, '0')}`
    }))

    generateLlmsTxt({
      siteInfo: {
        title: 'Example Knowledge Base',
        description: 'Practical tutorials and research notes.'
      },
      allPages,
      NOTION_CONFIG: {
        LINK: 'https://example.com',
        LANG: 'en-US',
        AUTHOR: 'Example Author',
        ENABLE_RSS: true
      }
    })

    expect(writeSpy).toHaveBeenCalledTimes(4)
    const writes = Object.fromEntries(
      writeSpy.mock.calls.map(([file, value]) => [file, value])
    )

    expect(writes['llms.txt']).toContain(
      '[Complete content index](https://example.com/llms-full.txt)'
    )
    expect(writes['llms.txt']).toContain(
      '[Archive — all posts by date](https://example.com/archive)'
    )
    expect(writes['llms.txt']).toContain('## Key content')
    expect(writes['llms.txt']).not.toContain('[Article 1](')
    expect(writes['llms-full.txt']).toContain('## Published content')
    expect(writes['llms-full.txt']).toContain('[Article 1](')
    expect(writes['./public/llms-full.txt']).toBe(writes['llms-full.txt'])
  })

  it('excludes password-protected and unpublished pages', () => {
    generateLlmsTxt({
      siteInfo: { title: 'Example', description: 'Description' },
      allPages: [
        {
          title: 'Public',
          slug: 'article/public',
          status: 'Published',
          publishDay: '2026-01-01'
        },
        {
          title: 'Private',
          slug: 'article/private',
          status: 'Published',
          password: 'secret',
          publishDay: '2026-01-02'
        },
        {
          title: 'Draft',
          slug: 'article/draft',
          status: 'Draft',
          publishDay: '2026-01-03'
        }
      ],
      NOTION_CONFIG: { LINK: 'https://example.com' }
    })

    const fullContent = writeSpy.mock.calls.find(
      ([file]) => file === 'llms-full.txt'
    )[1]
    expect(fullContent).toContain('[Public](')
    expect(fullContent).not.toContain('[Private](')
    expect(fullContent).not.toContain('[Draft](')
  })
})
