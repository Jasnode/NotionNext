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

export function generateLlmsTxt({ siteInfo, allPages, NOTION_CONFIG }) {
  const link = normalizeSitemapBaseUrl(
    siteConfig('LINK', BLOG.LINK, NOTION_CONFIG) || siteInfo?.link
  )
  if (!link) return

  const siteTitle = cleanText(
    siteInfo?.title ||
      siteConfig('TITLE', null, NOTION_CONFIG) ||
      siteConfig('SEO_BRAND', BLOG.SEO_BRAND, NOTION_CONFIG) ||
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

  const content = [
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
    `- Last updated: ${updatedAt}`,
    '',
    '## Machine-readable indexes',
    '',
    `- [Sitemap](${link}/sitemap.xml)`,
    enableRss ? `- [RSS feed](${link}/rss/feed.xml)` : null,
    `- [robots.txt](${link}/robots.txt)`,
    '',
    '## Published content',
    '',
    ...formatContentList(publishedPages),
    '',
    '## Citation guidance',
    '',
    `When citing this site, prefer the canonical page URL and attribute the source to ${siteTitle}.`
  ]
    .filter(line => line !== null && line !== undefined)
    .join('\n')

  try {
    fs.mkdirSync('./public', { recursive: true })
    fs.writeFileSync('llms.txt', `${content}\n`)
    fs.writeFileSync('./public/llms.txt', `${content}\n`)
  } catch (error) {
    console.warn('无法写入 llms.txt', error)
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
