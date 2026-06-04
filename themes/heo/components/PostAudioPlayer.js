import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPostAudioController, PLAYBACK_STATUS } from '@/lib/postAudioController'
import { buildPostAudioManifestUrls, getPostAudioKey, normalizeManifestSegments, normalizeManifestScript } from '@/lib/postAudioManifest'

const controller = typeof window !== 'undefined' ? createPostAudioController() : null
const manifestCache = new Map()
const manifestInflight = new Map()

function loadPostManifest(cacheKey, urls) {
  if (!cacheKey || !Array.isArray(urls) || urls.length === 0 || typeof fetch !== 'function') {
    return Promise.resolve(null)
  }
  if (manifestCache.has(cacheKey)) {
    return Promise.resolve(manifestCache.get(cacheKey))
  }
  if (manifestInflight.has(cacheKey)) {
    return manifestInflight.get(cacheKey)
  }

  const request = (async () => {
    for (const url of urls) {
      try {
        const response = await fetch(url)
        if (!response?.ok) continue
        const data = await response.json()
        if (data?.podcast) {
          manifestCache.set(cacheKey, data)
          return data
        }
      } catch {}
    }

    manifestCache.set(cacheKey, null)
    return null
  })().finally(() => {
    manifestInflight.delete(cacheKey)
  })

  manifestInflight.set(cacheKey, request)
  return request
}

function usePostManifest(post) {
  const [manifest, setManifest] = useState(null)
  const postId = post?.id
  const postSlug = post?.slug
  const manifestKey = useMemo(
    () => getPostAudioKey({ id: postId, slug: postSlug }),
    [postId, postSlug]
  )
  const manifestUrls = useMemo(
    () => buildPostAudioManifestUrls({ id: postId, slug: postSlug }),
    [postId, postSlug]
  )

  useEffect(() => {
    let cancelled = false
    setManifest(null)

    loadPostManifest(manifestKey, manifestUrls).then(data => {
      if (!cancelled) {
        setManifest(data)
      }
    })

    return () => { cancelled = true }
  }, [manifestKey, manifestUrls])

  return manifest
}

function useStopPlaybackOnPostChange(postAudioKey) {
  useEffect(() => {
    if (!controller) return
    const current = controller.getState()
    if (current.postKey && current.postKey !== postAudioKey) {
      controller.stop()
    }
  }, [postAudioKey])
}

function EqualizerBars({ playing }) {
  return (
    <span className='podcast-eq' aria-hidden='true'>
      {Array.from({ length: 13 }, (_, i) => (
        <span key={i} className={`podcast-eq-bar${playing ? ' is-playing' : ''}`} />
      ))}
    </span>
  )
}

function HeaderPodcastBadge({ post }) {
  const [state, setState] = useState(null)
  const manifest = usePostManifest(post)
  const postId = post?.id
  const postSlug = post?.slug
  const postAudioKey = useMemo(
    () => getPostAudioKey({ id: postId, slug: postSlug }),
    [postId, postSlug]
  )
  useStopPlaybackOnPostChange(postAudioKey)

  useEffect(() => {
    if (!controller) return
    return controller.subscribe(s => setState(s))
  }, [])

  const isCurrent = state?.postKey && manifest && postAudioKey === state.postKey
  const playing = isCurrent && state.status === PLAYBACK_STATUS.PLAYING

  const handleClick = useCallback(() => {
    if (!controller || !manifest?.podcast || !postAudioKey) return
    const segments = normalizeManifestSegments(manifest.podcast)
    const script = normalizeManifestScript(manifest.podcast?.script)
    if (segments.length === 0) return
    controller.toggle({
      postKey: postAudioKey,
      manifest,
      segments,
      script
    })
  }, [manifest, postAudioKey])

  if (!manifest?.podcast) return null

  return (
    <span
      className='podcast-header-badge'
      role='button'
      tabIndex={0}
      title={playing ? '暂停播客陪读' : '播放播客陪读'}
      aria-label={playing ? '暂停播客陪读' : '播放播客陪读'}
      onClick={handleClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}>
      <i className='fa-solid fa-podcast' />
      <EqualizerBars playing={playing} />
      <span className='podcast-header-badge-toggle'>
        <i className={`fa-solid ${playing ? 'fa-pause' : 'fa-play'}`} />
      </span>
    </span>
  )
}

function InlinePodcastPlayer({ post }) {
  const [state, setState] = useState(null)
  const manifest = usePostManifest(post)
  const postId = post?.id
  const postSlug = post?.slug
  const postAudioKey = useMemo(
    () => getPostAudioKey({ id: postId, slug: postSlug }),
    [postId, postSlug]
  )
  useStopPlaybackOnPostChange(postAudioKey)

  useEffect(() => {
    if (!controller) return
    return controller.subscribe(s => setState(s))
  }, [])

  const isCurrent = state?.postKey && manifest && postAudioKey === state.postKey
  const playing = isCurrent && state.status === PLAYBACK_STATUS.PLAYING
  const loading = isCurrent && state.status === PLAYBACK_STATUS.LOADING
  const progress = isCurrent ? computeProgress(state) : 0
  const playbackRate = state?.playbackRate || 1

  const handleToggle = useCallback(() => {
    if (!controller || !manifest?.podcast || !postAudioKey) return
    const segments = normalizeManifestSegments(manifest.podcast)
    const script = normalizeManifestScript(manifest.podcast?.script)
    if (segments.length === 0) return
    controller.toggle({
      postKey: postAudioKey,
      manifest,
      segments,
      script
    })
  }, [manifest, postAudioKey])

  const handleSpeed = useCallback(() => {
    if (!controller) return
    controller.cyclePlaybackRate()
  }, [])

  if (!manifest?.podcast) return null

  return (
    <div className='podcast-player' data-tts-target='post-podcast'>
      <div className='podcast-player-progress' style={{ width: `${progress * 100}%` }} />
      <div className='podcast-player-label'>
        <i className='fa-solid fa-podcast' />
        <span>本文支持播客陪读</span>
      </div>
      <div className='podcast-player-controls'>
        <button
          className='podcast-player-speed'
          type='button'
          title={`播放倍速 x${playbackRate}`}
          aria-label={`播放倍速 x${playbackRate}`}
          onClick={handleSpeed}>
          x{playbackRate}
        </button>
        <button
          className='podcast-player-play'
          type='button'
          title={playing ? '暂停' : loading ? '加载中' : '播放'}
          aria-label={playing ? '暂停播客陪读' : '播放播客陪读'}
          onClick={handleToggle}>
          {loading ? (
            <span className='podcast-player-loader' />
          ) : (
            <i className={`fa-solid ${playing ? 'fa-pause' : 'fa-play'}`} />
          )}
          <span>{playing ? '暂停' : loading ? '加载中' : '播放'}</span>
        </button>
      </div>
    </div>
  )
}

function computeProgress(state) {
  if (!state.segments || state.segments.length === 0) return 0
  const currentInSegment = state.duration > 0 ? state.currentTime / state.duration : 0
  return (state.currentIndex + currentInSegment) / state.segments.length
}

export { HeaderPodcastBadge, InlinePodcastPlayer }
export default InlinePodcastPlayer
