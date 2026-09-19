import BLOG from '@/blog.config'
import fs from 'fs'
import { siteConfig } from '../config'
import {
  buildSitemapLoc,
  normalizeSitemapBaseUrl,
  toSitemapDateString
} from '../sitemap-utils'
import { isValidSitemapSlug } from './sitemapHelper'

const MAX_SUMMARY_LENGTH = 180
const LLMS_PREVIEW_LIMIT = 20

export function generateLlmsTxt({ siteInfo, allPages, NOTION_CONFIG }) {
  const link = normalizeSitemapBaseUrl(
    siteConfig('LINK', BLOG.LINK, NOTION_CONFIG) || siteInfo?.link
  )
  if (!link) return

  // 品牌名优先级与 components/SEO.js 的 getSiteName 保持一致
  const siteTitle = cleanText(
    siteConfig('SEO_BRAND', null, NOTION_CONFIG) ||
      siteConfig('TITLE', null, NOTION_CONFIG) ||
      siteInfo?.title ||
      BLOG.AUTHOR ||
      'NotionNext'
  )
  const siteDescription = cleanText(
    siteInfo?.description ||
      siteConfig('DESCRIPTION', null, NOTION_CONFIG) ||
      siteConfig('BIO', BLOG.BIO, NOTION_CONFIG) ||
      BLOG.BIO
  )
  const author = cleanText(
    siteConfig('AUTHOR', BLOG.AUTHOR, NOTION_CONFIG) || BLOG.AUTHOR
  )
  const keywords = cleanText(
    siteConfig('KEYWORDS', BLOG.KEYWORDS, NOTION_CONFIG) || BLOG.KEYWORDS
  )
  const enableRss = Boolean(
    siteConfig('ENABLE_RSS', BLOG.ENABLE_RSS, NOTION_CONFIG)
  )
  const publishedPages = getPublishedPages(allPages, link)
  const updatedAt = getLatestUpdatedAt(publishedPages)
  const homeUrl = buildSitemapLoc({ baseUrl: link })

  const sharedHeader = [
    `# ${siteTitle}`,
    '',
    siteDescription ? `> ${siteDescription}` : null,
    '',
    `This file helps AI search engines and answer agents understand and cite ${siteTitle}.`,
    '',
    '## Site',
    '',
    `- URL: ${homeUrl}`,
    author ? `- Author: ${author}` : null,
    keywords ? `- Topics: ${keywords}` : null,
    `- Language: ${siteConfig('LANG', BLOG.LANG, NOTION_CONFIG) || BLOG.LANG}`,
    `- Last updated: ${updatedAt}`
  ]
  const machineReadableIndexes = [
    '',
    '## Machine-readable indexes',
    '',
    `- [Sitemap](${link}/sitemap.xml)`,
    enableRss ? `- [RSS feed](${link}/rss/feed.xml)` : null,
    `- [robots.txt](${link}/robots.txt)`,
    `- [Complete content index](${link}/llms-full.txt)`
  ]
  // 给只读 HTML 的 agent 留下可遍历的入口，而不是只能顺着单篇文章走
  const browseEntryPoints = [
    '',
    '## Browse',
    '',
    `- [Archive — all posts by date](${link}/archive)`,
    `- [Categories](${link}/category)`,
    `- [Tags](${link}/tag)`
  ]
  const citationGuidance = [
    '',
    '## Citation guidance',
    '',
    `When citing this site, prefer the canonical page URL and attribute the source to ${siteTitle}.`
  ]
  const content = [
    ...sharedHeader,
    ...machineReadableIndexes,
    ...browseEntryPoints,
    '',
    '## Key content',
    '',
    ...formatContentList(publishedPages.slice(0, LLMS_PREVIEW_LIMIT)),
    ...citationGuidance
  ]
    .filter(line => line !== null && line !== undefined)
    .join('\n')
  const fullContent = [
    ...sharedHeader,
    ...machineReadableIndexes,
    ...browseEntryPoints,
    '',
    '## Published content',
    '',
    ...formatContentList(publishedPages),
    ...citationGuidance
  ]
    .filter(line => line !== null && line !== undefined)
    .join('\n')

  try {
    fs.mkdirSync('./public', { recursive: true })
    fs.writeFileSync('llms.txt', `${content}\n`)
    fs.writeFileSync('./public/llms.txt', `${content}\n`)
    fs.writeFileSync('llms-full.txt', `${fullContent}\n`)
    fs.writeFileSync('./public/llms-full.txt', `${fullContent}\n`)
  } catch (error) {
    console.warn('无法写入 AI 内容索引', error)
  }
}

function getPublishedPages(allPages = [], link) {
  const uniquePages = new Map()

  allPages
    ?.filter(p => p.status === BLOG.NOTION_PROPERTY_NAME.status_publish)
    ?.filter(p => !p.password)
    ?.filter(p => isValidSitemapSlug(p.slug))
    ?.forEach(page => {
      const url = buildSitemapLoc({ baseUrl: link, slug: page.slug })
      if (!url) return

      const updatedAt = toSitemapDateString(
        page?.lastEditedDay || page?.publishDay,
        ''
      )
      const item = {
        title: cleanText(page.title || page.slug),
        summary: truncateText(cleanText(page.summary), MAX_SUMMARY_LENGTH),
        url,
        category: cleanText(page.category),
        tags: Array.isArray(page.tags)
          ? page.tags.map(cleanText).filter(Boolean)
          : [],
        publishedAt: page?.publishDay,
        updatedAt
      }

      const existing = uniquePages.get(url)
      if (
        !existing ||
        dateValue(item.updatedAt) > dateValue(existing.updatedAt)
      ) {
        uniquePages.set(url, item)
      }
    })

  return Array.from(uniquePages.values()).sort((a, b) => {
    const dateDiff = dateValue(b.updatedAt) - dateValue(a.updatedAt)
    if (dateDiff !== 0) return dateDiff
    return a.title.localeCompare(b.title)
  })
}

function formatContentList(pages) {
  if (!pages.length) return ['No published content is available yet.']

  return pages.map(page => {
    const details = [
      page.summary,
      page.category ? `Category: ${page.category}` : '',
      page.tags.length ? `Tags: ${page.tags.join(', ')}` : '',
      page.publishedAt ? `Published: ${page.publishedAt}` : '',
      page.updatedAt ? `Updated: ${page.updatedAt}` : ''
    ]
      .filter(Boolean)
      .join(' | ')

    return `- [${escapeMarkdownLinkText(page.title)}](${page.url})${details ? ` - ${details}` : ''}`
  })
}

function getLatestUpdatedAt(pages) {
  const latest = pages
    .map(page => page.updatedAt)
    .filter(Boolean)
    .sort()
    .pop()

  return latest || toSitemapDateString(new Date())
}

function cleanText(value) {
  if (value === undefined || value === null) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function truncateText(value, maxLength) {
  if (!value || value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 3).trim()}...`
}

function escapeMarkdownLinkText(value) {
  return cleanText(value).replace(/[\[\]]/g, '')
}

function dateValue(value) {
  const time = new Date(value || 0).getTime()
  return Number.isNaN(time) ? 0 : time
}
