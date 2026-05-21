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
    }

    const initializeWhenCodeReady = () => {
      if (isDisposed || initialized) return true

      const article = getNotionArticle()
      const hasCodeBlocks = Boolean(article?.querySelector('pre.notion-code'))
      if (!hasCodeBlocks) return false

      initialized = true
      if (codeMacBar) {
        loadExternalResource('/css/prism-mac-style.css', 'css')
      }
      // 加载prism样式
      loadPrismThemeCSS(
        isDarkMode,
        prismThemeSwitch,
        prismThemeDarkPath,
        prismThemeLightPath,
        prismThemePrefixPath
      )
      // 折叠代码
      loadExternalResource(prismjsAutoLoader, 'js')
        .then(() => {
          if (isDisposed) return
          try {
            cleanupPrism()
            if (typeof window !== 'undefined' && !window.Prism) {
              window.Prism = Prism
            }
            if (window?.Prism?.plugins?.autoloader) {
              window.Prism.plugins.autoloader.languages_path = prismjsPath
            }

            const dispose = renderPrismMac(codeLineNumbers)
            stopLineNumbers = typeof dispose === 'function' ? dispose : () => {}
            const disposeMermaid = renderMermaid(mermaidCDN)
            stopMermaid =
              typeof disposeMermaid === 'function' ? disposeMermaid : () => {}
            renderCollapseCode(
              codeCollapse,
              codeCollapseExpandDefault,
              codeCollapseMinLines
            )
            renderCustomCode()
          } catch (err) {
            console.warn('[PrismMac] render failed:', err)
          }
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
    }

    return () => {
      isDisposed = true
      waitForCodeBlocksObserver?.disconnect()
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

  useEffect(() => {
    let frameId = null
    const scheduleRenderCustomCode = () => {
      if (frameId !== null) return
      frameId = requestAnimationFrame(() => {
        frameId = null
        renderCustomCode()
      })
    }

    scheduleRenderCustomCode()
    const article = getNotionArticle()
    if (!article) {
      return () => {
        if (frameId !== null) {
          cancelAnimationFrame(frameId)
        }
      }
    }

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          scheduleRenderCustomCode()
          break
        }
      }
    });
    observer.observe(article, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
    };
  }, [pathname]);

  return <></>
}

const getNotionArticle = () => {
  const inArticleWrapper = document.querySelector('#article-wrapper #notion-article')
  if (inArticleWrapper) return inArticleWrapper

  const candidates = Array.from(document.querySelectorAll('#notion-article'))
  if (candidates.length <= 1) return candidates[0] || null

  // 多主题并存时可能有多个 notion-article，优先选择正文内容更完整的节点
  const score = el => {
    const codeCount = el.querySelectorAll('pre.notion-code, .code-toolbar').length
    const blockCount = el.querySelectorAll('.notion, .notion-page, .notion-text').length
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
    loadExternalResource(PRISM_THEME, 'css')
  } else {
    loadExternalResource(prismThemePrefixPath, 'css')
  }
}

/**
 * 将代码块转为可折叠对象
 */
const renderCollapseCode = (
  codeCollapse,
  codeCollapseExpandDefault,
  codeCollapseMinLines
) => {
  if (!codeCollapse) {
    return
  }
  const codeBlocks = document.querySelectorAll('.code-toolbar')
  for (const codeBlock of codeBlocks) {
    try {
      // 跳过已经折叠过的块，以及会被 renderCustomCode 处理的自定义块
      if (
        codeBlock.closest('.collapse-wrapper') ||
        containsCustomCodeBlock(codeBlock)
      ) {
        continue
      }

      const code = codeBlock.querySelector('code')
      if (!code || !shouldCollapseCodeBlock(code, codeCollapseMinLines)) {
        continue
      }

      const className = code.getAttribute('class') || ''
      const match = className.match(/language-([^\s]+)/)
      const language = match?.[1] || 'code'

      const parent = codeBlock.parentNode
      if (!parent || !parent.contains(codeBlock)) {
        continue
      }

      const collapseWrapper = document.createElement('div')
      collapseWrapper.className = 'collapse-wrapper w-full py-2'
      const panelWrapper = document.createElement('div')
      panelWrapper.className =
        'border dark:border-gray-600 rounded-md hover:border-indigo-500 duration-200 transition-colors'

      const header = document.createElement('div')
      header.className =
        'flex justify-between items-center px-4 py-2 cursor-pointer select-none'
      header.innerHTML = `<h3 class="text-lg font-medium">${language}</h3><svg class="transition-all duration-200 w-5 h-5 transform rotate-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6.293 6.293a1 1 0 0 1 1.414 0L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414l-3 3a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 0-1.414z" clip-rule="evenodd"/></svg>`

      const panel = document.createElement('div')
      panel.className =
        'invisible h-0 transition-transform duration-200 border-t border-gray-300'

      panelWrapper.appendChild(header)
      panelWrapper.appendChild(panel)
      collapseWrapper.appendChild(panelWrapper)

      parent.insertBefore(collapseWrapper, codeBlock)
      panel.appendChild(codeBlock)

      function collapseCode() {
        panel.classList.toggle('invisible')
        panel.classList.toggle('h-0')
        panel.classList.toggle('h-auto')
        header.querySelector('svg').classList.toggle('rotate-180')
        panelWrapper.classList.toggle('border-gray-300')
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

  const text = code.textContent || ''
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lineCount = normalizedText.replace(/\n$/, '').split('\n').length
  return lineCount > minLines
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

/**
 * 代码块类型为 Html, CSS, JS
 * 且第一行出现注释 <!-- custom -->, \* custom *\, // custom
 * (第二个对应 css 注释写法, 这里无法正常打出, notion 代码块中正常使用左斜杠 / 即可)
 * (空格不能少)
 * 则自动替换，将内容替换为实际代码执行
 */
const containsCustomCodeBlock = (block) => {
  const textContent = block.textContent || '';
  return (
    textContent.includes('<!-- custom -->') ||
    textContent.includes('/* custom */') ||
    textContent.includes('/* custom-link */') ||
    textContent.includes('// custom')
  );
};

const renderCustomCode = () => {
  const toolbars = document.querySelectorAll('div.code-toolbar');

  toolbars.forEach((toolbarEl) => {
    if (toolbarEl.dataset.customRendered === '1') return
    const codeElements = toolbarEl.querySelectorAll('code');
    codeElements.forEach(codeElement => {
      const match = codeElement.className.match(/language-([^\s]+)/);
      const language = match?.[1] || '';
      const firstChild = codeElement.firstChild;
      if (firstChild) {
        const firstComment = firstChild.textContent || '';
        const isCustomLink = {
          css: firstComment.includes('/* custom-link */'),
          javascript: firstComment.includes('// custom-link')
        }[language]; 
        const isCustom = {
          html: firstComment.includes('<!-- custom -->'),
          css: firstComment.includes('/* custom */'),
          javascript: firstComment.includes('// custom')
        }[language];
        let originalCode = codeElement.textContent;
        const toolbarParent = codeElement.closest('div.code-toolbar').parentNode;

        if (isCustomLink || isCustom) {
          // 移除 custom 注释
          originalCode = originalCode.replace(/(\/\/ custom-link)|(\/\* custom-link \*\/)|(<!-- custom -->)|(\/\* custom \*\/)|(\/\/ custom)/, '').trim();

          switch (language) {
            case 'html': {
              const htmlContainer = document.createElement('div');
              htmlContainer.innerHTML = originalCode;
              Array.from(htmlContainer.childNodes).forEach(node => {
                toolbarParent.insertBefore(node.cloneNode(true), toolbarEl);
              });
              break;
            }
            case 'css': {
              if (isCustomLink) {
                // 将原始代码按行分割，每行视为一个独立的CSS链接
                const urls = originalCode.split('\n').filter(line => line.trim() !== '');
                urls.forEach(url => {
                  const linkElement = document.createElement('link');
                  linkElement.rel = 'stylesheet';
                  linkElement.href = url.trim();
                  document.head.appendChild(linkElement);
                });
              } else {
                const styleElement = document.createElement('style');
                styleElement.textContent = originalCode;
                document.head.appendChild(styleElement);
              }
              break;
            }
            case 'javascript': {
              if (isCustomLink) {
                const scriptContainer = document.createElement('div');
                scriptContainer.innerHTML = originalCode;
                Array.from(scriptContainer.querySelectorAll('script')).forEach(script => {
                  const newScript = document.createElement('script');
                  if (script.src) {
                    newScript.src = script.src;
                    if (script.defer) newScript.defer = true;
                    if (script.async) newScript.async = true;
                  } else {
                    newScript.textContent = script.textContent;
                  }

                  const insertIntoHead = script.getAttribute('head') !== null;
                  if (insertIntoHead) {
                    document.head.appendChild(newScript);
                  } else {
                    document.body.appendChild(newScript);
                  }
                });
              } else {
                const scriptElement = document.createElement('script');
                scriptElement.textContent = originalCode;
                document.body.appendChild(scriptElement);
              }
              break;
            }
          }
          // 移除原始代码块容器
          toolbarParent.removeChild(toolbarEl);
        }
      }
    });
    toolbarEl.dataset.customRendered = '1';
  });
};

function renderPrismMac(codeLineNumbers) {
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
  if (codeToolBars) {
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
