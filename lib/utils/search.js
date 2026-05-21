import { getPageContentTextList } from '@/lib/db/notion/getPageContentText'

export function normalizeSearchKeyword(keyword) {
  return keyword == null ? '' : String(keyword).trim().toLowerCase()
}

function toPlainText(value) {
  if (value == null) return ''
  if (Array.isArray(value)) return value.filter(Boolean).join(' ')
  return String(value)
}

function buildMetadataText(post) {
  return [
    post.title,
    post.summary,
    toPlainText(post.tags),
    toPlainText(post.category)
  ]
    .map(toPlainText)
    .filter(Boolean)
    .join(' ')
}

function buildResultSnippets(post, contentTextList, keyword) {
  const results = []
  const candidates = [post.summary, ...contentTextList]

  for (const candidate of candidates) {
    const text = toPlainText(candidate).trim()
    if (!text || results.includes(text)) continue

    if (text.toLowerCase().includes(keyword)) {
      results.push(text)
    } else if (results.length < 3) {
      results.push(text)
    }
  }

  return results
}

export function buildPostSearchResult(post, pageBlockMap, keyword) {
  const normalizedKeyword = normalizeSearchKeyword(keyword)
  if (!post || !normalizedKeyword) return null

  const metadataText = buildMetadataText(post)
  const contentTextList = getPageContentTextList(post, pageBlockMap)
  const hit =
    metadataText.toLowerCase().includes(normalizedKeyword) ||
    contentTextList.some(text =>
      toPlainText(text).toLowerCase().includes(normalizedKeyword)
    )

  if (!hit) return null

  const resultPost = { ...post }
  const results = buildResultSnippets(
    resultPost,
    contentTextList,
    normalizedKeyword
  )
  if (results.length > 0) {
    resultPost.results = results
  }

  return resultPost
}
