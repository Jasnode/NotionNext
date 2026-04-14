import fs from 'fs'
import path from 'path'
import pLimit from 'p-limit'
import { fetchNotionPageBlocks } from '@/lib/db/notion/getPostBlocks'
import { getDataFromCache, setDataToCache } from '@/lib/cache/cache_manager'
import { getBuildSessionPath } from '@/lib/cache/build_session'
import { withFileLock } from '@/lib/cache/file_lock'

function getPrefetchDoneFile() {
  return path.join(getBuildSessionPath('prefetch'), 'block-prefetch.done')
}

function isDone(doneFile) {
  try {
    return fs.existsSync(doneFile)
  } catch {
    return false
  }
}

function markDone(doneFile) {
  fs.mkdirSync(path.dirname(doneFile), { recursive: true })
  fs.writeFileSync(doneFile, String(process.pid), 'utf8')
}

/**
 * 获取优先预生成的页面
 * - 默认排序前 5 篇（Notion 拖拽顺序）
 * - 最新发布 5 篇（按 publishDate 倒序）
 * - 合并去重，适合 ISR 首批路径
 */
export function getPriorityPages(allPages) {
  const published = (allPages ?? []).filter(
    page => page.type === 'Post' && page.status === 'Published'
  )

  const top5Default = published.slice(0, 5)
  const top5Latest = [...published]
    .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
    .slice(0, 5)

  const seen = new Set()
  return [...top5Default, ...top5Latest].filter(page => {
    if (seen.has(page.id)) return false
    seen.add(page.id)
    return true
  })
}

async function doPrefetch(allPages, concurrency = 8) {
  const limit = pLimit(concurrency)
  let hit = 0
  let fetched = 0
  let failed = 0

  console.log(
    `[Prefetch][pid:${process.pid}] start ${allPages.length} page blocks`
  )
  const start = Date.now()

  await Promise.all(
    allPages.map(page =>
      limit(async () => {
        const cacheKey = `page_block_${page.id}`

        if (await getDataFromCache(cacheKey)) {
          hit++
          return
        }

        try {
          const block = await fetchNotionPageBlocks(page.id, 'prefetch')
          await setDataToCache(cacheKey, block, 60 * 60 * 2) // 2小时 (单位:秒)
          fetched++
        } catch (error) {
          console.warn(
            `[Prefetch][pid:${process.pid}] failed page:${page.id}`,
            error.message
          )
          failed++
        }
      })
    )
  )

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(
    `[Prefetch][pid:${process.pid}] done hit=${hit} fetched=${fetched} failed=${failed} elapsed=${elapsed}s`
  )
}

/**
 * 带跨进程保护的全量预热。
 * 同一次 build/export 中只允许一个 worker 真正预热，
 * 其他 worker 只等待当前构建轮次的 done 标记。
 */
export async function prefetchAllBlockMaps(allPages, concurrency = 8) {
  if (!Array.isArray(allPages) || allPages.length === 0) {
    console.log(`[Prefetch][pid:${process.pid}] skip empty page list`)
    return
  }

  const doneFile = getPrefetchDoneFile()
  if (isDone(doneFile)) {
    console.log(`[Prefetch][pid:${process.pid}] reuse warmed cache`)
    return
  }

  await withFileLock(
    'prefetch_all_blocks',
    async () => {
      if (isDone(doneFile)) {
        return true
      }

      await doPrefetch(allPages, concurrency)
      markDone(doneFile)
      console.log(`[Prefetch][pid:${process.pid}] marked done`)
      return true
    },
    () => (isDone(doneFile) ? true : null),
    { timeout: 30000, staleLockMs: 300000 }
  )
}
