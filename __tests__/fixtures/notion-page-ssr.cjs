const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')

async function main() {
  const React = require('react')
  const { renderToStaticMarkup } = require('react-dom/server')
  const notion = await import('react-notion-x')
  const { loadBindings, transformSync } = require('next/dist/build/swc')
  const { JSDOM } = require('jsdom')
  await loadBindings()
  const { RouterContext } = require('next/dist/shared/lib/router-context.shared-runtime')
  const config = { LINK: 'https://blog.example.com', INNER_PAGE_URL_PARENT_PATH: true }
  const id = '4aea95fb-3fd5-fcf8-1846-aaaaaaaaaaaa'
  const rootId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  const textId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  const childId = 'da8daa2f-8d19-4209-87d5-1cc9bdf01241'
  const quoteId = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
  const pages = [{ id, href: '/links' }]
  let globalContext = { allLinkPages: pages, lang: 'en' }
  const stubs = {
    '@/lib/config': { siteConfig: (key, fallback) => config[key] ?? fallback },
    '@/lib/global': { useGlobal: () => globalContext },
    '@/lib/utils': { isBrowser: false, deepClone: value => structuredClone(value) },
    '../../utils': { isBrowser: false, deepClone: value => structuredClone(value) },
    '@/lib/cache/cache_manager': {},
    '@/lib/db/notion/getNotionAPI': {},
    '@/lib/utils/notion.util': { normalizeNotionBlockType: value => value },
    '@/lib/db/notion/normalizeExternalMediaBlock': { normalizeExternalMediaBlock: () => {} },
    'p-limit': () => fn => fn(),
    '@/lib/db/notion/mapImage': { mapImgUrl: value => value, compressImage: value => value },
    '@/components/NotionEmbed': () => null,
    './OriginalityProof': () => null,
    'next/dynamic': () => () => null,
    'react-notion-x': notion
  }
  const cache = new Map()
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports
    const module = { exports: {} }
    cache.set(filename, module)
    const { code } = transformSync(fs.readFileSync(filename, 'utf8'), {
      filename,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2020',
        transform: { react: { runtime: 'automatic', development: false } } },
      module: { type: 'commonjs' }
    })
    const localRequire = specifier => {
      if (Object.hasOwn(stubs, specifier)) return stubs[specifier]
      if (specifier.endsWith('.css')) return {}
      if (specifier.startsWith('@/')) return load(path.resolve(specifier.slice(2) + '.js'))
      return require(specifier)
    }
    new Function('require', 'module', 'exports', code)(localRequire, module, module.exports)
    return module.exports
  }
  const NotionPage = load(path.resolve('components/NotionPage.js')).default
  const record = (blockId, value) => ({ role: 'reader', value: { id: blockId, alive: true, ...value } })
  const blockMap = { block: {
    [rootId]: record(rootId, { type: 'page', properties: { title: [['Root']] }, content: [id, childId, textId, quoteId] }),
    [id]: record(id, { type: 'page', parent_id: rootId, parent_table: 'block', properties: { title: [['Published page']] } }),
    [childId]: record(childId, { type: 'page', parent_id: rootId, parent_table: 'block', properties: { title: [['Child page']] } }),
    [quoteId]: record(quoteId, { type: 'quote', properties: { title: [
      ['Quoted link', [['a', '/' + id.replaceAll('-', '') + '?from=quote#heading']]],
      ['Anchor', [['a', '#chapter-1']]]
    ] } }),
    [textId]: record(textId, { type: 'text', properties: { title: [
      ['Internal', [['a', 'https://blog.example.com/about']]],
      ['Source', [['a', '/' + id.replaceAll('-', '') + '?pvs=4#']]],
      ['External', [['a', '//external.example.com/article']]]
    ] } })
  }, collection: {}, collection_view: {}, collection_query: {}, signed_urls: {}, notion_user: {} }
  const post = { href: '/article/parent', blockMap }
  post.blockMap.block = load(path.resolve('lib/db/notion/getPostBlocks.js')).formatNotionBlock(blockMap.block)
  const render = (router, linkOptions) => {
    const element = React.createElement(NotionPage, { post, linkOptions })
    return new JSDOM(renderToStaticMarkup(router
      ? React.createElement(RouterContext.Provider, { value: router }, element)
      : element)).window.document
  }
  const doc = render({ asPath: '/article/parent', locale: 'en', defaultLocale: 'zh-CN' })
  assert.equal(doc.querySelector('.notion-page-link').getAttribute('href'), '/en/links')
  assert.equal(doc.querySelectorAll('.notion-page-link')[1].getAttribute('href'), '/en/article/parent/' + childId.replaceAll('-', ''))
  const links = [...doc.querySelectorAll('a')]
  assert.equal(links.find(a => a.textContent === 'Internal').getAttribute('target'), null)
  assert.equal(links.find(a => a.textContent === 'Source').getAttribute('href'), '/en/links?pvs=4#')
  assert.equal(links.find(a => a.textContent === 'Source').getAttribute('target'), '_blank')
  assert.equal(links.find(a => a.textContent === 'External').getAttribute('target'), '_blank')
  assert.equal(links.find(a => a.textContent === 'Quoted link').getAttribute('href'), '/en/links?from=quote#heading')
  globalContext = undefined
  const rss = render(null, { allLinkPages: pages, siteOrigin: config.LINK, absoluteUrls: true, innerPageUrlParentPath: true })
  assert.equal(rss.querySelector('.notion-page-link').getAttribute('href'), 'https://blog.example.com/links')
  assert.equal(rss.querySelectorAll('.notion-page-link')[1].getAttribute('href'), 'https://blog.example.com/article/parent/' + childId.replaceAll('-', ''))
  const rssLinks = [...rss.querySelectorAll('a')]
  assert.equal(rssLinks.find(a => a.textContent === 'Quoted link').getAttribute('href'), 'https://blog.example.com/links?from=quote#heading')
  assert.equal(rssLinks.find(a => a.textContent === 'Anchor').getAttribute('href'), 'https://blog.example.com/article/parent#chapter-1')
  console.log(process.env.NODE_ENV + ': real NotionRenderer SSR and router-free RSS assertions passed')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
