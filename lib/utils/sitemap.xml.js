import BLOG from '@/blog.config'
import fs from 'fs'
import { siteConfig } from '../config'
import {
  buildSitemapLoc,
  getLatestSitemapDate,
  normalizeSitemapBaseUrl,
  toSitemapDateString
} from '../sitemap-utils'
import { isValidSitemapSlug } from './sitemapHelper'

/**
 * 生成站点地图
 * @param {*} param0
 */
export function generateSitemapXml({ allPages, NOTION_CONFIG }) {
  const link = normalizeSitemapBaseUrl(
    siteConfig('LINK', BLOG.LINK, NOTION_CONFIG)
  )
  const dateNow = toSitemapDateString(new Date())
  const publishedPages =
    allPages
      ?.filter(p => p.status === BLOG.NOTION_PROPERTY_NAME.status_publish)
      ?.filter(p => isValidSitemapSlug(p.slug)) ?? []
  const latestContentDate = getLatestSitemapDate(publishedPages, dateNow)
  const urls = [
    {
      loc: buildSitemapLoc({ baseUrl: link }),
      lastmod: latestContentDate,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: buildSitemapLoc({ baseUrl: link, slug: 'archive' }),
      lastmod: latestContentDate,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: buildSitemapLoc({ baseUrl: link, slug: 'category' }),
      lastmod: latestContentDate,
      changefreq: 'daily'
    },
    {
      loc: buildSitemapLoc({ baseUrl: link, slug: 'tag' }),
      lastmod: latestContentDate,
      changefreq: 'daily'
    }
  ].filter(item => Boolean(item?.loc))

  publishedPages.forEach(post => {
    const loc = buildSitemapLoc({
      baseUrl: link,
      slug: post?.slug
    })
    if (!loc) return

    const lastmod = toSitemapDateString(
      post?.lastEditedDay || post?.publishDay,
      ''
    )
    urls.push({
      loc,
      ...(lastmod ? { lastmod } : {}),
      changefreq: 'weekly'
    })
  })

  const xml = createSitemapXml(getUniqueUrls(urls))
  try {
    fs.writeFileSync('sitemap.xml', xml)
    fs.writeFileSync('./public/sitemap.xml', xml)
  } catch (error) {
    console.warn('无法写入文件', error)
  }
}

/**
 * 生成站点地图XML
 * @param {*} urls
 * @returns
 */
function createSitemapXml(urls) {
  let urlsXml = ''
  urls.forEach(u => {
    urlsXml += `<url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    </url>
    `
  })

  return `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
    xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    ${urlsXml}
    </urlset>
    `
}

function getUniqueUrls(urls) {
  const uniqueUrlsMap = new Map()

  urls.forEach(url => {
    const existingUrl = uniqueUrlsMap.get(url.loc)

    // lastmod 可能缺省，走字符串比较，避免 Invalid Date 让比较恒为 false
    if (!existingUrl || (url.lastmod || '') > (existingUrl.lastmod || '')) {
      uniqueUrlsMap.set(url.loc, url)
    }
  })

  return Array.from(uniqueUrlsMap.values())
}
