const DEFAULT_STATIC_AUDIO_BASE = '/post-audio'

export function buildPostAudioManifestUrl(post, basePath = DEFAULT_STATIC_AUDIO_BASE) {
  const key = getPostAudioKey(post)
  if (!key) return ''

  return `${basePath.replace(/\/+$/, '')}/${key}/manifest.json`
}

export function buildPostAudioManifestUrls(post, basePath = DEFAULT_STATIC_AUDIO_BASE) {
  const urls = []
  const addUrl = url => {
    if (url && !urls.includes(url)) {
      urls.push(url)
    }
  }

  addUrl(buildPostAudioManifestUrl(post, basePath))
  addUrl(buildPostAudioManifestUrlById(post?.id, basePath))

  return urls
}

export function getPostAudioKey(post) {
  const rawValue =
    typeof post?.slug === 'string' && !/^https?:\/\//i.test(post.slug)
      ? post.slug
      : post?.id

  return String(rawValue || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/')
}

export function buildPostAudioManifestUrlById(postId, basePath = DEFAULT_STATIC_AUDIO_BASE) {
  if (!postId) return ''
  return `${basePath.replace(/\/+$/, '')}/article/${encodeURIComponent(postId)}/manifest.json`
}

export function normalizeManifestSegments(audioGroup) {
  if (!audioGroup) return []
  const groupMimeType = audioGroup.mimeType || 'audio/mpeg'
  const segments = Array.isArray(audioGroup.segments) ? audioGroup.segments : []

  return segments
    .filter(segment => typeof segment?.src === 'string' && segment.src)
    .map((segment, index) => ({
      src: segment.src,
      mimeType: segment.mimeType || groupMimeType,
      speaker: segment.speaker === '乙' ? '乙' : '甲',
      duration: typeof segment.duration === 'number' ? segment.duration : null,
      textLength: typeof segment.textLength === 'number' ? segment.textLength : null,
      index
    }))
}

export function normalizeManifestScript(scriptGroup) {
  if (!Array.isArray(scriptGroup)) return []
  return scriptGroup
    .map(line => ({
      speaker: line?.speaker === '乙' ? '乙' : '甲',
      text: String(line?.text || '').trim()
    }))
    .filter(line => line.text)
    .slice(0, 32)
}
