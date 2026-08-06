import { fireEvent, render, waitFor } from '@testing-library/react'
import PrismMac, {
  closeCodeSidePanel,
  isCodeSidePanelSupported,
  openCodeSidePanel,
  renderCollapseCode
} from '@/components/PrismMac'
import { siteConfig } from '@/lib/config'
import { usePathname } from 'next/navigation'
import { useGlobal } from '@/lib/global'
import { loadExternalResource } from '@/lib/utils'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn()
}))

jest.mock('@/lib/global', () => ({
  useGlobal: jest.fn()
}))

jest.mock('@/lib/utils', () => ({
  loadExternalResource: jest.fn()
}))

jest.mock('@/lib/config', () => ({
  siteConfig: jest.fn((key, fallback) => {
    if (key === 'CODE_COLLAPSE_MIN_LINES') return 3
    return fallback
  })
}))

const originalMatchMedia = window.matchMedia

const setDesktopViewport = matches => {
  const listeners = new Set()
  const mediaQuery = {
    matches,
    addEventListener: jest.fn((event, listener) => {
      if (event === 'change') listeners.add(listener)
    }),
    removeEventListener: jest.fn((event, listener) => {
      if (event === 'change') listeners.delete(listener)
    }),
    setMatches(nextMatches) {
      this.matches = nextMatches
      listeners.forEach(listener => listener({ matches: nextMatches }))
    }
  }
  window.matchMedia = jest.fn().mockReturnValue(mediaQuery)
  return mediaQuery
}

const appendCodeToolbar = (
  text = 'const one = 1\nconst two = 2\nconst three = 3',
  parent = document.body
) => {
  const toolbar = document.createElement('div')
  toolbar.className = 'code-toolbar'

  const pre = document.createElement('pre')
  const code = document.createElement('code')
  code.className = 'language-javascript'
  code.textContent = text

  pre.appendChild(code)
  toolbar.appendChild(pre)
  parent.appendChild(toolbar)

  return toolbar
}

const appendRawCodeBlock = (text, parent) => {
  const pre = document.createElement('pre')
  pre.className = 'notion-code language-javascript'
  const code = document.createElement('code')
  code.className = 'language-javascript'
  code.textContent = text
  pre.appendChild(code)
  parent.appendChild(pre)
  return pre
}

describe('PrismMac code side panel', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    setDesktopViewport(true)
    usePathname.mockReturnValue('/article/46')
    useGlobal.mockReturnValue({ isDarkMode: false })
    loadExternalResource.mockResolvedValue('loaded')
    siteConfig.mockImplementation((key, fallback) => {
      if (key === 'CODE_COLLAPSE_MIN_LINES') return 3
      return fallback
    })
  })

  afterEach(() => {
    closeCodeSidePanel()
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    jest.clearAllMocks()
    window.matchMedia = originalMatchMedia
  })

  it('only supports the side panel on desktop viewports', () => {
    setDesktopViewport(false)

    expect(isCodeSidePanelSupported()).toBe(false)
    expect(
      openCodeSidePanel({
        language: 'javascript',
        lineCount: 3,
        codeHtml: 'const value = 1',
        text: 'const value = 1'
      })
    ).toBe(false)
    expect(
      document.querySelector('#notion-code-side-panel')
    ).not.toBeInTheDocument()
  })

  it('opens, replaces, and closes a single sidebar instance', () => {
    expect(
      openCodeSidePanel({
        language: 'javascript',
        lineCount: 3,
        codeClassName: 'language-javascript',
        codeHtml: '<span class="token keyword">const</span> value = 1',
        text: 'const value = 1'
      })
    ).toBe(true)

    expect(document.querySelectorAll('#notion-code-side-panel')).toHaveLength(1)
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.querySelector('#notion-code-side-panel')).toHaveAttribute(
      'data-lenis-prevent'
    )
    expect(document.querySelector('.code-side-panel-drawer')).toHaveAttribute(
      'data-lenis-prevent'
    )
    expect(document.querySelector('.code-side-panel-title')).toHaveTextContent(
      'JavaScript'
    )
    expect(document.querySelector('.code-side-panel-meta')).toHaveTextContent(
      '3 lines'
    )
    expect(document.querySelector('.code-side-panel-code code')).toHaveClass(
      'language-javascript'
    )
    expect(document.querySelector('.code-side-panel-code').innerHTML).toContain(
      'token keyword'
    )
    expect(
      document.querySelector('.code-side-panel-backdrop')
    ).toBeInTheDocument()

    openCodeSidePanel({
      language: 'typescript',
      lineCount: 5,
      codeClassName: 'language-typescript',
      codeHtml: 'type Value = string',
      text: 'type Value = string'
    })

    expect(document.querySelectorAll('#notion-code-side-panel')).toHaveLength(1)
    expect(document.querySelector('.code-side-panel-title')).toHaveTextContent(
      'TypeScript'
    )

    fireEvent.click(document.querySelector('.code-side-panel-backdrop'))
    expect(
      document.querySelector('#notion-code-side-panel')
    ).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
    expect(document.documentElement.style.overflow).toBe('')

    openCodeSidePanel({
      language: 'typescript',
      lineCount: 5,
      codeClassName: 'language-typescript',
      codeHtml: 'type Value = string',
      text: 'type Value = string'
    })

    fireEvent.click(document.querySelector('.code-side-panel-close'))
    expect(
      document.querySelector('#notion-code-side-panel')
    ).not.toBeInTheDocument()
  })

  it('closes the sidebar with Escape', () => {
    openCodeSidePanel({
      language: 'javascript',
      lineCount: 3,
      codeHtml: 'const value = 1',
      text: 'const value = 1'
    })

    expect(document.body.style.overflow).toBe('hidden')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(
      document.querySelector('#notion-code-side-panel')
    ).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('traps keyboard focus and restores it after closing', () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Open preview'
    document.body.appendChild(trigger)
    trigger.focus()

    openCodeSidePanel({
      language: 'javascript',
      lineCount: 3,
      codeHtml: 'const value = 1',
      text: 'const value = 1'
    })

    const copyButton = document.querySelector('.code-side-panel-copy')
    const closeButton = document.querySelector('.code-side-panel-close')
    expect(closeButton).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Tab' })
    expect(copyButton).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(closeButton).toHaveFocus()

    fireEvent.click(closeButton)
    expect(trigger).toHaveFocus()
  })

  it('closes and restores scrolling when the viewport becomes mobile', () => {
    const mediaQuery = setDesktopViewport(true)
    document.body.style.overflow = 'clip'
    document.documentElement.style.overflow = 'auto'

    openCodeSidePanel({
      language: 'javascript',
      lineCount: 3,
      codeHtml: 'const value = 1',
      text: 'const value = 1'
    })

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.documentElement.style.overflow).toBe('hidden')

    mediaQuery.setMatches(false)

    expect(
      document.querySelector('#notion-code-side-panel')
    ).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('clip')
    expect(document.documentElement.style.overflow).toBe('auto')
  })

  it('adds the sidebar button for long desktop code blocks', () => {
    appendCodeToolbar()

    renderCollapseCode(true, false)

    const sidePanelButton = document.querySelector(
      '.collapse-side-panel-button'
    )
    expect(sidePanelButton).toHaveTextContent('侧栏预览')
    expect(document.querySelector('.collapse-code-title')).toHaveTextContent(
      '展开代码'
    )
    expect(document.querySelector('.collapse-code-language')).toHaveTextContent(
      'JavaScript'
    )
    expect(document.querySelector('.collapse-code-count')).toHaveTextContent(
      '3 lines'
    )

    fireEvent.click(sidePanelButton)

    expect(
      document.querySelector('.code-side-panel-code code')
    ).toHaveTextContent('const one = 1 const two = 2 const three = 3')
  })

  it('keeps the sidebar available when inline collapse is disabled', () => {
    appendCodeToolbar()

    renderCollapseCode(false, false, 2)

    expect(document.querySelector('.collapse-wrapper')).not.toBeInTheDocument()
    const sidePanelButton = document.querySelector(
      '.collapse-side-panel-button'
    )
    expect(sidePanelButton).toHaveTextContent('侧栏预览')

    fireEvent.click(sidePanelButton)
    expect(
      document.querySelector('#notion-code-side-panel')
    ).toBeInTheDocument()
  })

  it('only enhances the active Heo article when multiple themes are mounted', () => {
    const activeWrapper = document.createElement('div')
    activeWrapper.id = 'article-wrapper'
    const activeArticle = document.createElement('article')
    activeArticle.id = 'notion-article'
    activeWrapper.appendChild(activeArticle)
    document.body.appendChild(activeWrapper)

    const otherArticle = document.createElement('article')
    otherArticle.id = 'notion-article'
    document.body.appendChild(otherArticle)

    appendCodeToolbar(undefined, activeArticle)
    appendCodeToolbar(undefined, otherArticle)

    renderCollapseCode(false, false, 2)

    expect(
      activeArticle.querySelectorAll('.collapse-side-panel-button')
    ).toHaveLength(1)
    expect(
      otherArticle.querySelectorAll('.collapse-side-panel-button')
    ).toHaveLength(0)
  })

  it('keeps the existing collapse behavior without a sidebar button on mobile', () => {
    setDesktopViewport(false)
    appendCodeToolbar()

    renderCollapseCode(true, false)

    expect(document.querySelector('.collapse-wrapper')).toBeInTheDocument()
    expect(
      document.querySelector('.collapse-side-panel-button')
    ).not.toBeInTheDocument()
  })

  it('enhances code blocks added after Prism initializes', async () => {
    siteConfig.mockImplementation((key, fallback) => {
      const values = {
        CODE_COLLAPSE: false,
        CODE_COLLAPSE_MIN_LINES: 2,
        CODE_LINE_NUMBERS: false,
        CODE_MAC_BAR: false,
        MERMAID_CDN: '/mermaid.js',
        PRISM_JS_AUTO_LOADER: '/prism-autoloader.js',
        PRISM_JS_PATH: '/prism-components/',
        PRISM_THEME_PREFIX_PATH: '/prism-theme.css',
        PRISM_THEME_SWITCH: false
      }
      return key in values ? values[key] : fallback
    })

    const wrapper = document.createElement('div')
    wrapper.id = 'article-wrapper'
    const article = document.createElement('article')
    article.id = 'notion-article'
    wrapper.appendChild(article)
    document.body.appendChild(wrapper)

    const initialCode = appendRawCodeBlock('one\ntwo\nthree', article)
    const { unmount } = render(<PrismMac />)

    await waitFor(() => {
      expect(initialCode).toHaveAttribute('data-prism-mac-enhanced', 'true')
    })

    const addedCode = appendRawCodeBlock('four\nfive\nsix', article)

    await waitFor(() => {
      expect(addedCode).toHaveAttribute('data-prism-mac-enhanced', 'true')
      expect(
        addedCode
          .closest('.code-toolbar')
          ?.querySelector('.collapse-side-panel-button')
      ).toBeInTheDocument()
    })

    unmount()
  })
})
