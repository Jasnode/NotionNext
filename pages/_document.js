// eslint-disable-next-line @next/next/no-document-import-in-page
import BLOG from '@/blog.config'
import Document, { Head, Html, Main, NextScript } from 'next/document'

const isLocalFontAwesome = BLOG.FONT_AWESOME?.startsWith(
  '/vendor/fontawesome/'
)

const getUrl = value => {
  try {
    return value ? new URL(value) : null
  } catch {
    return null
  }
}

const getUrlOrigin = value => getUrl(value)?.origin || ''

const getDnsPrefetchHref = value => {
  const url = getUrl(value)
  return url ? `//${url.host}` : ''
}

const getFontAwesomeWebfontBase = value => {
  const url = getUrl(value)
  if (!url) return ''

  const marker = '/css/'
  const markerIndex = url.pathname.lastIndexOf(marker)
  if (markerIndex === -1) return ''

  url.pathname = `${url.pathname.slice(0, markerIndex)}/webfonts/`
  url.search = ''
  url.hash = ''
  return url.toString()
}

const getFontAwesomeFontFaceCss = value => {
  const webfontBase = getFontAwesomeWebfontBase(value)
  if (!webfontBase) return ''

  return `@font-face{font-family:"Font Awesome 6 Free";font-style:normal;font-weight:900;font-display:swap;src:url("${webfontBase}fa-solid-900.woff2") format("woff2")}@font-face{font-family:"Font Awesome 6 Free";font-style:normal;font-weight:400;font-display:swap;src:url("${webfontBase}fa-regular-400.woff2") format("woff2")}@font-face{font-family:"Font Awesome 6 Brands";font-style:normal;font-weight:400;font-display:swap;src:url("${webfontBase}fa-brands-400.woff2") format("woff2")}.fa,.fas,.far,.fab,.fa-solid,.fa-regular,.fa-brands{display:inline-flex;width:1.25em;min-width:1.25em;align-items:center;justify-content:center;text-align:center;line-height:1}`
}

const fontAwesomeLoadScript = BLOG.FONT_AWESOME
  ? `
(function() {
  var link = document.getElementById('font-awesome-css');
  if (!link) return;
  var enable = function() { link.media = 'all'; };
  if (link.sheet) {
    enable();
  } else {
    link.addEventListener('load', enable, { once: true });
  }
})()
`
  : ''
const fontAwesomeOrigin = isLocalFontAwesome
  ? ''
  : getUrlOrigin(BLOG.FONT_AWESOME)
const fontAwesomeDnsPrefetchHref = isLocalFontAwesome
  ? ''
  : getDnsPrefetchHref(BLOG.FONT_AWESOME)
const fontAwesomeFontFaceCss = isLocalFontAwesome
  ? ''
  : getFontAwesomeFontFaceCss(BLOG.FONT_AWESOME)
const shouldPreconnectUnsplash = BLOG.THEME === 'magzine'

// 预先设置深色模式的脚本内容
const darkModeScript = `
(function() {
  const darkMode = localStorage.getItem('darkMode')

  const prefersDark =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

  const defaultAppearance = '${BLOG.APPEARANCE || 'auto'}'

  let shouldBeDark = darkMode === 'true' || darkMode === 'dark'

  if (darkMode === null) {
    if (defaultAppearance === 'dark') {
      shouldBeDark = true
    } else if (defaultAppearance === 'auto') {
      // 检查是否在深色模式时间范围内
      const date = new Date()
      const hours = date.getHours()
      const darkTimeStart = ${BLOG.APPEARANCE_DARK_TIME ? BLOG.APPEARANCE_DARK_TIME[0] : 18}
      const darkTimeEnd = ${BLOG.APPEARANCE_DARK_TIME ? BLOG.APPEARANCE_DARK_TIME[1] : 6}
      
      shouldBeDark = prefersDark || (hours >= darkTimeStart || hours < darkTimeEnd)
    }
  }
  
  // 立即设置 html 元素的类
  document.documentElement.classList.add(shouldBeDark ? 'dark' : 'light')
})()
`

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html lang={BLOG.LANG}>
        <Head>
          {/* 预先设置深色模式，避免闪烁 */}
          <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
          <meta httpEquiv='x-dns-prefetch-control' content='on' />
          <meta name='applicable-device' content='pc,mobile' />
          {fontAwesomeOrigin && (
            <>
              <link
                rel='preconnect'
                href={fontAwesomeOrigin}
                crossOrigin='anonymous'
              />
              <link rel='dns-prefetch' href={fontAwesomeDnsPrefetchHref} />
            </>
          )}
          {shouldPreconnectUnsplash && (
            <>
              <link rel='preconnect' href='https://images.unsplash.com' />
              <link rel='dns-prefetch' href='//images.unsplash.com' />
            </>
          )}
          {/* 预加载字体 */}
          {BLOG.FONT_AWESOME && (
            <>
              {isLocalFontAwesome && (
                <>
                  <link
                    rel='preload'
                    href='/vendor/fontawesome/webfonts/fa-solid-900.woff2'
                    as='font'
                    type='font/woff2'
                    crossOrigin='anonymous'
                  />
                  <link
                    rel='preload'
                    href='/vendor/fontawesome/webfonts/fa-regular-400.woff2'
                    as='font'
                    type='font/woff2'
                    crossOrigin='anonymous'
                  />
                  <link
                    rel='preload'
                    href='/vendor/fontawesome/webfonts/fa-brands-400.woff2'
                    as='font'
                    type='font/woff2'
                    crossOrigin='anonymous'
                  />
                </>
              )}
              <style
                dangerouslySetInnerHTML={{
                  __html:
                    '.fa,.fas,.far,.fab,.fa-solid,.fa-regular,.fa-brands{display:inline-flex;width:1.25em;min-width:1.25em;align-items:center;justify-content:center;text-align:center;line-height:1}'
                }}
              />
              {isLocalFontAwesome ? (
                <link
                  id='font-awesome-css'
                  rel='stylesheet'
                  href={BLOG.FONT_AWESOME}
                />
              ) : (
                <>
                  <link
                    rel='preload'
                    href={BLOG.FONT_AWESOME}
                    as='style'
                    crossOrigin='anonymous'
                  />
                  <link
                    id='font-awesome-css'
                    rel='stylesheet'
                    href={BLOG.FONT_AWESOME}
                    media='print'
                    crossOrigin='anonymous'
                    referrerPolicy='no-referrer'
                  />
                  {fontAwesomeFontFaceCss && (
                    <style
                      dangerouslySetInnerHTML={{
                        __html: fontAwesomeFontFaceCss
                      }}
                    />
                  )}
                  <script
                    dangerouslySetInnerHTML={{ __html: fontAwesomeLoadScript }}
                  />
                  <noscript>
                    <link
                      rel='stylesheet'
                      href={BLOG.FONT_AWESOME}
                      crossOrigin='anonymous'
                      referrerPolicy='no-referrer'
                    />
                  </noscript>
                </>
              )}
              {isLocalFontAwesome && (
                <noscript>
                  <link rel='stylesheet' href={BLOG.FONT_AWESOME} />
                </noscript>
              )}
            </>
          )}
        </Head>

        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
