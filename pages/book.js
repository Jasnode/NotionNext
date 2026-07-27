import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import catalog from '@/themes/heo/components/Book/bookCatalog.json'
import { DynamicLayout } from '@/themes/theme'

const BookPage = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutBook' {...props} />
}

export async function getStaticProps({ locale }) {
  const [props, knowledgeJson] = await Promise.all([
    fetchGlobalAllData({ from: 'book', locale }),
    fs.promises.readFile(
      path.join(process.cwd(), 'public', 'data', 'book-knowledge.json'),
      'utf8'
    )
  ])
  const knowledge = JSON.parse(knowledgeJson)
  const bookStats = {
    bookCount: catalog.books.length,
    chapterCount: knowledge.books.reduce(
      (total, book) => total + book.chapters.length,
      0
    ),
    insightCount: catalog.books.reduce(
      (total, book) => total + book.insightCount,
      0
    ),
    knowledgeVersion: crypto
      .createHash('sha256')
      .update(knowledgeJson)
      .digest('hex')
      .slice(0, 12)
  }

  props.post = {
    title: '我的书架',
    summary: `${bookStats.bookCount} 本书、${bookStats.chapterCount} 个章节与 ${bookStats.insightCount} 条观点，保留从每本书里留下的完整判断与洞见。`,
    slug: 'book',
    type: 'Page',
    fullWidth: true,
    tags: ['书单', '阅读', '微信读书'],
    pageCoverThumbnail: '/images/books/design-of-design.jpg'
  }
  props.bookStats = bookStats

  delete props.allPages

  return {
    props,
    revalidate: process.env.EXPORT
      ? undefined
      : siteConfig(
          'NEXT_REVALIDATE_SECOND',
          BLOG.NEXT_REVALIDATE_SECOND,
          props.NOTION_CONFIG
        )
  }
}

export default BookPage
