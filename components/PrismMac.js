import { useEffect } from 'react'
import Prism from 'prismjs'
// 所有语言的prismjs 使用autoloader引入
// import 'prismjs/plugins/autoloader/prism-autoloader'
import 'prismjs/plugins/toolbar/prism-toolbar'
import 'prismjs/plugins/toolbar/prism-toolbar.min.css'
import 'prismjs/plugins/show-language/prism-show-language'
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard'
import 'prismjs/plugins/line-numbers/prism-line-numbers'
import 'prismjs/plugins/line-numbers/prism-line-numbers.css'

// mermaid图
import { loadExternalResource } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { useGlobal } from '@/lib/global'
import { siteConfig } from '@/lib/config'

const PRISM_MAC_STYLE_PATH = '/css/prism-mac-style.css'

/**
 * 代码美化相关
 * @author https://github.com/txs/
 * @returns
 */
const PrismMac = () => {
  const pathname = usePathname()
  const { isDarkMode } = useGlobal()
  const codeMacBar = siteConfig('CODE_MAC_BAR')
  const prismjsAutoLoader = siteConfig('PRISM_JS_AUTO_LOADER')
  const prismjsPath = siteConfig('PRISM_JS_PATH')

  const prismThemeSwitch = siteConfig('PRISM_THEME_SWITCH')
  const prismThemeDarkPath = siteConfig('PRISM_THEME_DARK_PATH')
  const prismThemeLightPath = siteConfig('PRISM_THEME_LIGHT_PATH')
  const prismThemePrefixPath = siteConfig('PRISM_THEME_PREFIX_PATH')

  const mermaidCDN = siteConfig('MERMAID_CDN')
  const codeLineNumbers = siteConfig('CODE_LINE_NUMBERS')

  const codeCollapse = siteConfig('CODE_COLLAPSE')
  const codeCollapseExpandDefault = siteConfig('CODE_COLLAPSE_EXPAND_DEFAULT')
  const codeCollapseMinLines = siteConfig('CODE_COLLAPSE_MIN_LINES')

  useEffect(() => {
    let isDisposed = false
    let initialized = false
    let waitForCodeBlocksObserver = null
    let newCodeBlocksObserver = null
    let initTimer = null
    let enhancementTimer = null
    let stopLineNumbers = () => {}
    let stopMermaid = () => {}

    const cleanupPrism = () => {
      try {
        stopLineNumbers()
      } catch (e) {
        /* ignore */
      }

      try {
        stopMermaid()
      } catch (e) {
        /* ignore */
      }
      stopLineNumbers = () => {}
      stopMermaid = () => {}
    }

    const renderCodeEnhancements = () => {
      if (isDisposed) return

      try {
        cleanupPrism()
        if (typeof window !== 'undefined' && !window.Prism) {
          window.Prism = Prism
        }
        if (window?.Prism?.plugins?.autoloader) {
          window.Prism.plugins.autoloader.languages_path = prismjsPath
        }

        const dispose = renderPrismMac(codeLineNumbers, codeMacBar)
        stopLineNumbers = typeof dispose === 'function' ? dispose : () => {}
        const disposeMermaid = renderMermaid(mermaidCDN)
        stopMermaid =
          typeof disposeMermaid === 'function' ? disposeMermaid : () => {}
        renderCollapseCode(
          codeCollapse,
          codeCollapseExpandDefault,
          codeCollapseMinLines
        )
        getNotionArticle()
          ?.querySelectorAll('pre.notion-code')
          .forEach(codeBlock => {
            codeBlock.dataset.prismMacEnhanced = 'true'
          })
      } catch (err) {
        console.warn('[PrismMac] render failed:', err)
      }
    }

    const containsUnenhancedCodeBlock = node => {
      if (node?.nodeType !== 1) return false
      if (
        node.matches?.('pre.notion-code') &&
        node.dataset?.prismMacEnhanced !== 'true'
      ) {
        return true
      }

      return Array.from(node.querySelectorAll?.('pre.notion-code') || []).some(
        codeBlock => codeBlock.dataset.prismMacEnhanced !== 'true'
      )
    }

    const observeNewCodeBlocks = article => {
      newCodeBlocksObserver?.disconnect()
      newCodeBlocksObserver = new MutationObserver(mutations => {
        const hasNewCodeBlock = mutations.some(mutation =>
          Array.from(mutation.addedNodes).some(containsUnenhancedCodeBlock)
        )
        if (!hasNewCodeBlock || enhancementTimer) return

        enhancementTimer = window.setTimeout(() => {
          enhancementTimer = null
          renderCodeEnhancements()
        }, 0)
      })
      newCodeBlocksObserver.observe(article, {
        childList: true,
        subtree: true
      })
    }

    const loadCodeStyleSheets = () => {
      const prismThemeReady = loadPrismThemeCSS(
        isDarkMode,
        prismThemeSwitch,
        prismThemeDarkPath,
        prismThemeLightPath,
        prismThemePrefixPath
      )
      // 侧栏预览也依赖这份样式，即使用户关闭 Mac 顶栏和正文折叠。
      if (codeMacBar || codeCollapse || isCodeSidePanelSupported()) {
        loadPrismMacStyleCSS()
        Promise.resolve(prismThemeReady)
          .catch(err => {
            console.warn('[PrismMac] prism theme load failed:', err)
          })
          .finally(() => {
            loadPrismMacStyleCSS()
          })
      }
    }

    const initializeWhenCodeReady = () => {
      if (isDisposed || initialized) return true

      const article = getNotionArticle()
      const hasCodeBlocks = Boolean(article?.querySelector('pre.notion-code'))
      if (!hasCodeBlocks) return false

      initialized = true
      waitForCodeBlocksObserver?.disconnect()
      waitForCodeBlocksObserver = null
      if (initTimer) {
        clearTimeout(initTimer)
        initTimer = null
      }

      loadCodeStyleSheets()

      // 先用本地 Prism 渲染，避免外部 autoloader 阻塞代码折叠和侧栏。
      renderCodeEnhancements()
      observeNewCodeBlocks(article)

      loadExternalResource(prismjsAutoLoader, 'js')
        .then(() => {
          if (!isDisposed) renderCodeEnhancements()
        })
        .catch(err => {
          console.warn('[PrismMac] prism autoloader load failed:', err)
        })

      return true
    }

    if (!initializeWhenCodeReady()) {
      waitForCodeBlocksObserver = new MutationObserver(() => {
        if (initializeWhenCodeReady()) {
          waitForCodeBlocksObserver?.disconnect()
          waitForCodeBlocksObserver = null
        }
      })
      waitForCodeBlocksObserver.observe(document.body, {
        childList: true,
        subtree: true
      })
      initTimer = setTimeout(initializeWhenCodeReady, 1000)
    }

    return () => {
      isDisposed = true
      waitForCodeBlocksObserver?.disconnect()
      newCodeBlocksObserver?.disconnect()
      if (initTimer) clearTimeout(initTimer)
      if (enhancementTimer) clearTimeout(enhancementTimer)
      closeCodeSidePanel()
      cleanupPrism()
    }
  }, [
    pathname,
    isDarkMode,
    codeMacBar,
    prismjsAutoLoader,
    prismjsPath,
    prismThemeSwitch,
    prismThemeDarkPath,
    prismThemeLightPath,
    prismThemePrefixPath,
    mermaidCDN,
    codeLineNumbers,
    codeCollapse,
    codeCollapseExpandDefault,
    codeCollapseMinLines
  ])

  return <></>
}

const getNotionArticle = () => {
  const inArticleWrapper = document.querySelector(
    '#article-wrapper #notion-article'
  )
  if (inArticleWrapper) return inArticleWrapper

  const candidates = Array.from(document.querySelectorAll('#notion-article'))
  if (candidates.length <= 1) return candidates[0] || null

  // 多主题并存时可能有多个 notion-article，优先选择正文内容更完整的节点
  const score = el => {
    const codeCount = el.querySelectorAll(
      'pre.notion-code, .code-toolbar'
    ).length
    const blockCount = el.querySelectorAll(
      '.notion, .notion-page, .notion-text'
    ).length
    return codeCount * 10 + blockCount
  }

  return candidates.sort((a, b) => score(b) - score(a))[0] || null
}

const getNotionArticles = () => {
  const inArticleWrapper = Array.from(
    document.querySelectorAll('#article-wrapper #notion-article')
  )
  if (inArticleWrapper.length > 0) return inArticleWrapper

  return Array.from(document.querySelectorAll('#notion-article'))
}

const loadPrismMacStyleCSS = () => {
  const existing = document.querySelector(
    `link[href="${PRISM_MAC_STYLE_PATH}"]`
  )
  if (existing && existing.parentNode) {
    document.head.appendChild(existing)
    return Promise.resolve(PRISM_MAC_STYLE_PATH)
  }

  return loadExternalResource(PRISM_MAC_STYLE_PATH, 'css')
}

const CODE_SIDE_PANEL_ID = 'notion-code-side-panel'
const CODE_SIDE_PANEL_DESKTOP_QUERY = '(min-width: 1024px)'
const CODE_SIDE_PANEL_KEYDOWN = '__notionNextCodeSidePanelKeydown'
const CODE_SIDE_PANEL_STATE = '__notionNextCodeSidePanelState'

const CODE_LANGUAGE_LABELS = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  html: 'HTML',
  xml: 'XML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'Sass',
  json: 'JSON',
  md: 'Markdown',
  markdown: 'Markdown',
  py: 'Python',
  python: 'Python',
  sh: 'Shell',
  bash: 'Bash',
  sql: 'SQL',
  yaml: 'YAML',
  yml: 'YAML',
  mermaid: 'Mermaid',
  code: 'Code'
}

const formatCodeLanguage = language => {
  const normalized = String(language || '')
    .trim()
    .toLowerCase()
  return CODE_LANGUAGE_LABELS[normalized] || String(language || 'CODE')
}

export const isCodeSidePanelSupported = () => {
  if (typeof window === 'undefined') return false
  if (typeof window.matchMedia !== 'function') return true

  return window.matchMedia(CODE_SIDE_PANEL_DESKTOP_QUERY).matches
}

export const closeCodeSidePanel = () => {
  if (typeof document === 'undefined') return false

  const existing = document.getElementById(CODE_SIDE_PANEL_ID)
  if (existing) existing.remove()

  if (typeof window !== 'undefined') {
    const state = window[CODE_SIDE_PANEL_STATE]
    if (state?.keydownHandler) {
      document.removeEventListener('keydown', state.keydownHandler)
    }
    if (state?.desktopQuery && state.viewportHandler) {
      if (typeof state.desktopQuery.removeEventListener === 'function') {
        state.desktopQuery.removeEventListener('change', state.viewportHandler)
      } else {
        state.desktopQuery.removeListener?.(state.viewportHandler)
      }
    }
    if (state && document.body) {
      document.body.style.overflow = state.bodyOverflow
    }
    if (state && document.documentElement) {
      document.documentElement.style.overflow = state.documentOverflow
    }
    if (window[CODE_SIDE_PANEL_KEYDOWN]) {
      document.removeEventListener('keydown', window[CODE_SIDE_PANEL_KEYDOWN])
      delete window[CODE_SIDE_PANEL_KEYDOWN]
    }
    delete window[CODE_SIDE_PANEL_STATE]

    if (state?.returnFocus?.isConnected) {
      state.returnFocus.focus()
    }
  }

  return Boolean(existing)
}

const requestFrame = callback => {
  if (typeof window === 'undefined') return callback()

  const raf = window.requestAnimationFrame || (cb => window.setTimeout(cb, 0))
  return raf(callback)
}

export const openCodeSidePanel = ({
  language = '',
  lineCount = 0,
  codeClassName = '',
  codeHtml = '',
  text = ''
} = {}) => {
  if (typeof document === 'undefined' || !isCodeSidePanelSupported()) {
    return false
  }

  const returnFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  closeCodeSidePanel()

  const root = document.createElement('div')
  root.id = CODE_SIDE_PANEL_ID
  root.className = 'code-side-panel-root'
  root.setAttribute('data-lenis-prevent', '')

  const backdrop = document.createElement('button')
  backdrop.type = 'button'
  backdrop.className = 'code-side-panel-backdrop'
  backdrop.setAttribute('aria-label', '关闭代码预览侧栏')
  backdrop.addEventListener('click', closeCodeSidePanel)

  const drawer = document.createElement('aside')
  drawer.className = 'code-side-panel-drawer'
  drawer.setAttribute('role', 'dialog')
  drawer.setAttribute('aria-label', '代码预览侧栏')
  drawer.setAttribute('aria-modal', 'true')
  drawer.setAttribute('data-lenis-prevent', '')

  const header = document.createElement('div')
  header.className = 'code-side-panel-header'

  const heading = document.createElement('div')
  heading.className = 'code-side-panel-heading'

  const title = document.createElement('div')
  title.className = 'code-side-panel-title'
  title.textContent = formatCodeLanguage(language)

  const meta = document.createElement('div')
  meta.className = 'code-side-panel-meta'
  meta.textContent = lineCount ? `${lineCount} lines` : ''

  heading.appendChild(title)
  heading.appendChild(meta)

  const actions = document.createElement('div')
  actions.className = 'code-side-panel-actions'

  const copyButton = document.createElement('button')
  copyButton.type = 'button'
  copyButton.className = 'code-side-panel-copy'
  copyButton.textContent = '复制'
  const copyCode = async () => {
    const originalText = copyButton.textContent

    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable')
      }
      await navigator.clipboard.writeText(text)
      copyButton.textContent = '已复制'
    } catch {
      copyButton.textContent = '复制失败'
    }

    window.setTimeout(() => {
      if (copyButton.isConnected) copyButton.textContent = originalText
    }, 1200)
  }
  copyButton.addEventListener('click', () => {
    void copyCode()
  })

  const closeButton = document.createElement('button')
  closeButton.type = 'button'
  closeButton.className = 'code-side-panel-close'
  closeButton.setAttribute('aria-label', '关闭代码预览侧栏')
  closeButton.textContent = '关闭'
  closeButton.addEventListener('click', closeCodeSidePanel)

  actions.appendChild(copyButton)
  actions.appendChild(closeButton)
  header.appendChild(heading)
  header.appendChild(actions)

  const pre = document.createElement('pre')
  pre.className = 'code-side-panel-code'
  const code = document.createElement('code')
  code.className = codeClassName
  code.innerHTML = codeHtml
  pre.appendChild(code)

  drawer.appendChild(header)
  drawer.appendChild(pre)
  root.appendChild(backdrop)
  root.appendChild(drawer)

  const keydownHandler = event => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeCodeSidePanel()
      return
    }
    if (event.key !== 'Tab') return

    const activeElement = document.activeElement
    if (
      event.shiftKey &&
      (activeElement === copyButton || !drawer.contains(activeElement))
    ) {
      event.preventDefault()
      closeButton.focus()
    } else if (
      !event.shiftKey &&
      (activeElement === closeButton || !drawer.contains(activeElement))
    ) {
      event.preventDefault()
      copyButton.focus()
    }
  }
  const desktopQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia(CODE_SIDE_PANEL_DESKTOP_QUERY)
      : null
  const viewportHandler = event => {
    if (!event.matches) closeCodeSidePanel()
  }
  if (typeof desktopQuery?.addEventListener === 'function') {
    desktopQuery.addEventListener('change', viewportHandler)
  } else {
    desktopQuery?.addListener?.(viewportHandler)
  }
  window[CODE_SIDE_PANEL_KEYDOWN] = keydownHandler
  window[CODE_SIDE_PANEL_STATE] = {
    bodyOverflow: document.body?.style.overflow || '',
    documentOverflow: document.documentElement?.style.overflow || '',
    desktopQuery,
    viewportHandler,
    keydownHandler,
    returnFocus
  }
  document.addEventListener('keydown', keydownHandler)
  if (document.body) document.body.style.overflow = 'hidden'
  if (document.documentElement) {
    document.documentElement.style.overflow = 'hidden'
  }

  document.body.appendChild(root)
  closeButton.focus()
  requestFrame(() => {
    if (root.isConnected) root.classList.add('is-open')
  })

  return true
}

const createCodeSidePanelButton = ({ language, label, lineCount, code }) => {
  if (!isCodeSidePanelSupported()) return null

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'collapse-side-panel-button'
  button.textContent = '侧栏预览'
  button.setAttribute('aria-label', `在侧栏预览 ${label}`)
  button.addEventListener('click', event => {
    event.stopPropagation()
    openCodeSidePanel({
      language,
      lineCount,
      codeClassName: code.getAttribute('class') || '',
      codeHtml: code.innerHTML,
      text: code.textContent || ''
    })
  })

  return button
}

/**
 * 加载Prism主题样式
 */
const loadPrismThemeCSS = (
  isDarkMode,
  prismThemeSwitch,
  prismThemeDarkPath,
  prismThemeLightPath,
  prismThemePrefixPath
) => {
  let PRISM_THEME
  let PRISM_PREVIOUS
  if (prismThemeSwitch) {
    if (isDarkMode) {
      PRISM_THEME = prismThemeDarkPath
      PRISM_PREVIOUS = prismThemeLightPath
    } else {
      PRISM_THEME = prismThemeLightPath
      PRISM_PREVIOUS = prismThemeDarkPath
    }
    const previousTheme = document.querySelector(
      `link[href="${PRISM_PREVIOUS}"]`
    )
    if (
      previousTheme &&
      previousTheme.parentNode &&
      previousTheme.parentNode.contains(previousTheme)
    ) {
      previousTheme.parentNode.removeChild(previousTheme)
    }
    return loadExternalResource(PRISM_THEME, 'css')
  } else {
    return loadExternalResource(prismThemePrefixPath, 'css')
  }
}

/**
 * 将代码块转为可折叠对象
 */
export const renderCollapseCode = (
  codeCollapse,
  codeCollapseExpandDefault,
  codeCollapseMinLines
) => {
  // Heo 页面会同时渲染多个主题容器；只增强当前正文，避免改动其他主题。
  const article = getNotionArticle()
  const codeBlocks = article
    ? article.querySelectorAll('.code-toolbar')
    : document.querySelectorAll('.code-toolbar')
  for (const codeBlock of codeBlocks) {
    try {
      if (codeBlock.closest('.collapse-wrapper')) {
        continue
      }

      const code = codeBlock.querySelector('code')
      if (!code || !shouldCollapseCodeBlock(code, codeCollapseMinLines)) {
        continue
      }

      const className = code.getAttribute('class') || ''
      const match = className.match(/language-([^\s]+)/)
      const languageKey = match?.[1] || 'code'
      const language = formatCodeLanguage(languageKey)
      const lineCount = getCodeLineCount(code)
      const label = language ? `${language} 代码` : '代码预览'

      // 侧栏预览与折叠相互独立：关闭折叠时仍给长代码提供桌面预览入口。
      if (!codeCollapse) {
        if (codeBlock.querySelector('.collapse-side-panel-button')) {
          continue
        }

        const sidePanelButton = createCodeSidePanelButton({
          language,
          label,
          lineCount,
          code
        })
        if (sidePanelButton) {
          sidePanelButton.classList.add('code-side-panel-inline-button')
          const toolbar = codeBlock.querySelector('.toolbar')
          if (toolbar) {
            const toolbarItem = document.createElement('div')
            toolbarItem.className = 'toolbar-item code-side-panel-toolbar-item'
            toolbarItem.appendChild(sidePanelButton)
            toolbar.appendChild(toolbarItem)
          } else {
            sidePanelButton.classList.add('code-side-panel-standalone')
            codeBlock.appendChild(sidePanelButton)
          }
        }
        continue
      }

      const parent = codeBlock.parentNode
      if (!parent || !parent.contains(codeBlock)) {
        continue
      }

      const collapseWrapper = document.createElement('div')
      collapseWrapper.className = 'collapse-wrapper w-full py-2'
      const panelWrapper = document.createElement('div')
      panelWrapper.className = 'collapse-panel'

      const headerRow = document.createElement('div')
      headerRow.className = 'collapse-header-row'

      const header = document.createElement('button')
      header.type = 'button'
      header.className = 'collapse-header-button'
      header.setAttribute('aria-expanded', 'false')
      header.setAttribute('aria-label', `展开或折叠 ${language} 代码`)
      header.innerHTML = `
        <span class="collapse-header-content">
          <span class="collapse-header-copy">
            <span class="collapse-code-title">展开代码</span>
            <span class="collapse-code-language"></span>
          </span>
        </span>
        <span class="collapse-header-end">
          <span class="collapse-code-count"></span>
          <svg class="collapse-chevron" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
          </svg>
        </span>`
      header.querySelector('.collapse-code-language').textContent = language
      header.querySelector('.collapse-code-count').textContent =
        `${lineCount} lines`
      const chevron = header.querySelector('.collapse-chevron')

      const panel = document.createElement('div')
      panel.className =
        'collapse-code-panel invisible h-0 transition-transform duration-200 border-t border-gray-300'

      const sidePanelButton = createCodeSidePanelButton({
        language,
        label,
        lineCount,
        code
      })

      headerRow.appendChild(header)
      if (sidePanelButton) {
        headerRow.appendChild(sidePanelButton)
      }

      panelWrapper.appendChild(headerRow)
      panelWrapper.appendChild(panel)
      collapseWrapper.appendChild(panelWrapper)

      parent.insertBefore(collapseWrapper, codeBlock)
      panel.appendChild(codeBlock)

      function collapseCode() {
        panel.classList.toggle('invisible')
        panel.classList.toggle('h-0')
        panel.classList.toggle('h-auto')
        chevron?.classList.toggle('rotate-180')
        panelWrapper.classList.toggle('is-expanded')
        header.setAttribute(
          'aria-expanded',
          panel.classList.contains('h-auto') ? 'true' : 'false'
        )
      }

      // 点击后折叠展开代码
      header.addEventListener('click', collapseCode)
      // 是否自动展开
      if (codeCollapseExpandDefault) {
        header.click()
      }
    } catch (err) {
      console.warn('[PrismMac] collapse code failed:', err)
    }
  }
}

const shouldCollapseCodeBlock = (code, codeCollapseMinLines) => {
  const minLines = Number(codeCollapseMinLines)
  if (!Number.isFinite(minLines) || minLines <= 0) {
    return true
  }

  const lineCount = getCodeLineCount(code)
  return lineCount > minLines
}

const getCodeLineCount = code => {
  const text = code?.textContent || ''
  if (!text) return 0

  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  return normalizedText.replace(/\n$/, '').split('\n').length
}

/**
 * 将mermaid语言 渲染成图片
 */
const renderMermaid = mermaidCDN => {
  const bindingToken = `prism-${Date.now()}-${Math.random()}`
  const articleObservers = new Map()

  const processArticle = article => {
    const mermaidCodeBlocks = article.querySelectorAll(
      '.notion-code.language-mermaid'
    )
    for (const codeBlock of mermaidCodeBlocks) {
      const chart = codeBlock.querySelector('code')?.textContent
      if (chart && !codeBlock.querySelector('.mermaid')) {
        const mermaidChart = document.createElement('pre')
        mermaidChart.className = 'mermaid'
        mermaidChart.textContent = chart
        codeBlock.appendChild(mermaidChart)
      }
    }

    const mermaidsSvg = article.querySelectorAll('.mermaid')
    if (mermaidsSvg.length > 0) {
      let needLoad = false
      for (const e of mermaidsSvg) {
        if (e?.firstChild?.nodeName !== 'svg') {
          needLoad = true
          break
        }
      }
      if (needLoad) {
        loadExternalResource(mermaidCDN, 'js').then(url => {
          setTimeout(() => {
            const mermaid = window.mermaid
            mermaid?.contentLoaded()
          }, 100)
        })
      }
    }
  }

  const bindArticleObserver = article => {
    processArticle(article)
    const observer = new MutationObserver(() => {
      processArticle(article)
    })
    observer.observe(article, {
      childList: true,
      attributes: true,
      subtree: true
    })
    articleObservers.set(article, observer)
  }

  const scanAndBind = () => {
    const articles = getNotionArticles()
    for (const article of articles) {
      if (article.dataset.prismMermaidBound) continue
      article.dataset.prismMermaidBound = bindingToken
      bindArticleObserver(article)
    }
  }

  // 立即处理已有内容（主题切换时关键）
  scanAndBind()

  // 监听后续新增的文章容器
  if (window.__prismMermaidRootObserver) {
    window.__prismMermaidRootObserver.disconnect()
  }
  const rootObserver = new MutationObserver(() => {
    scanAndBind()
  })
  rootObserver.observe(document.body, {
    childList: true,
    subtree: true
  })
  window.__prismMermaidRootObserver = rootObserver

  return () => {
    for (const [article, observer] of articleObservers) {
      observer.disconnect()
      if (article.dataset.prismMermaidBound === bindingToken) {
        delete article.dataset.prismMermaidBound
      }
    }
    articleObservers.clear()

    rootObserver.disconnect()
    if (window.__prismMermaidRootObserver === rootObserver) {
      window.__prismMermaidRootObserver = null
    }
  }
}

function renderPrismMac(codeLineNumbers, codeMacBar) {
  const container = getNotionArticle()

  // Add line numbers
  if (codeLineNumbers) {
    const codeBlocks = container?.getElementsByTagName('pre')
    if (codeBlocks) {
      Array.from(codeBlocks).forEach(item => {
        if (!item.classList.contains('line-numbers')) {
          item.classList.add('line-numbers')
          item.style.whiteSpace = 'pre-wrap'
        }
      })
    }
  }
  // 重新渲染之前检查所有的多余text

  try {
    if (container && typeof Prism.highlightAllUnder === 'function') {
      Prism.highlightAllUnder(container)
    } else {
      Prism.highlightAll()
    }
  } catch (err) {
    console.warn('[PrismMac] prism highlight failed:', err)
  }

  const codeToolBars = container?.getElementsByClassName('code-toolbar')
  // Add pre-mac element for Mac Style UI
  if (codeMacBar && codeToolBars) {
    Array.from(codeToolBars).forEach(item => {
      try {
        const existPreMac = item.getElementsByClassName('pre-mac')
        if (existPreMac.length < 1) {
          const preMac = document.createElement('div')
          preMac.classList.add('pre-mac')
          preMac.innerHTML = '<span></span><span></span><span></span>'
          item.appendChild(preMac)
        }
      } catch (err) {
        console.warn('[PrismMac] pre-mac failed:', err)
      }
    })
  }

  // 折叠代码行号bug
  if (codeLineNumbers) {
    return fixCodeLineStyle()
  }
  return () => {}
}

/**
 * 行号样式在首次渲染或被detail折叠后行高判断错误
 * 在此手动resize计算
 */
const fixCodeLineStyle = () => {
  const article = getNotionArticle()
  if (!article) {
    return () => {}
  }

  if (!Prism?.plugins?.lineNumbers?.resize) {
    return () => {}
  }

  const observer = new MutationObserver(mutationsList => {
    for (const m of mutationsList) {
      if (m.target.nodeName === 'DETAILS') {
        const preCodes = m.target.querySelectorAll('pre.notion-code')
        for (const preCode of preCodes) {
          try {
            Prism.plugins.lineNumbers.resize(preCode)
          } catch (e) {
            /* ignore */
          }
        }
      }
    }
  })
  observer.observe(article, {
    attributes: true,
    subtree: true
  })
  const timeoutId = setTimeout(() => {
    const preCodes = article.querySelectorAll('pre.notion-code')
    for (const preCode of preCodes) {
      try {
        Prism.plugins.lineNumbers.resize(preCode)
      } catch (e) {
        /* ignore */
      }
    }
  }, 10)

  return () => {
    clearTimeout(timeoutId)
    observer.disconnect()
  }
}
export default PrismMac
