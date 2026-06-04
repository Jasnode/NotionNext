/**
 * 全站唯一的"播客陪读"播放控制器。
 *
 * 关键设计：
 * - 整个进程只持有一个 <audio> 实例（懒加载），所有订阅者共享状态
 * - 状态更新走 immutable patch + 同步通知，避免 React 闭包里读到过期值
 * - 播放进度 = (currentIndex + currentTime/duration) / segments.length
 *   这样即使每段是独立音频文件，也能给出整篇的连续进度
 * - 全部异步操作都带 runId 比对，过期的回调会自行放弃写入
 */

export const PLAYBACK_STATUS = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  PLAYING: 'playing',
  PAUSED: 'paused',
  ENDED: 'ended'
})

const INITIAL_STATE = Object.freeze({
  postKey: '',
  manifest: null,
  status: PLAYBACK_STATUS.IDLE,
  message: '',
  playbackRate: 1,
  playbackRates: [1, 1.25, 1.5, 2],
  segments: [],
  script: [],
  currentIndex: 0,
  currentTime: 0,
  duration: 0,
  startedAt: 0
})

const DEFAULT_RATES = [1, 1.25, 1.5, 2]

function noop() {}

export function createPostAudioController(options = {}) {
  const initialRates = Array.isArray(options.playbackRates) && options.playbackRates.length > 0
    ? options.playbackRates
    : DEFAULT_RATES
  const createAudioElement = typeof options.createAudioElement === 'function'
    ? options.createAudioElement
    : () => (typeof Audio !== 'undefined' ? new Audio() : null)
  const now = typeof options.now === 'function' ? options.now : () => Date.now()

  let state = { ...INITIAL_STATE, playbackRates: initialRates }
  let audio = null
  const listeners = new Set()
  let runId = 0

  function ensureAudio() {
    if (audio) return audio
    const element = createAudioElement()
    if (!element) return null
    element.preload = 'auto'
    element.addEventListener('playing', handlePlaying)
    element.addEventListener('pause', handlePause)
    element.addEventListener('ended', handleEnded)
    element.addEventListener('timeupdate', handleTimeUpdate)
    element.addEventListener('durationchange', handleDurationChange)
    element.addEventListener('error', handleError)
    element.addEventListener('canplay', handleCanPlay)
    audio = element
    return audio
  }

  function notify() {
    for (const listener of listeners) {
      listener(state)
    }
  }

  function patch(partial) {
    state = { ...state, ...partial }
    notify()
  }

  function isStale(id) {
    return id !== runId
  }

  function handlePlaying() {
    if (state.status === PLAYBACK_STATUS.LOADING) {
      patch({ status: PLAYBACK_STATUS.PLAYING, message: '' })
    }
  }

  function handlePause() {
    if (state.status === PLAYBACK_STATUS.PLAYING) {
      patch({ status: PLAYBACK_STATUS.PAUSED })
    }
  }

  function handleTimeUpdate() {
    if (!audio) return
    const time = audio.currentTime || 0
    if (time !== state.currentTime) {
      patch({ currentTime: time })
    }
  }

  function handleDurationChange() {
    if (!audio) return
    const duration = audio.duration || 0
    if (duration !== state.duration) {
      patch({ duration })
    }
  }

  function handleCanPlay() {
    if (state.status === PLAYBACK_STATUS.LOADING) {
      patch({ message: '' })
    }
  }

  function handleEnded() {
    if (state.currentIndex + 1 < state.segments.length) {
      const nextIndex = state.currentIndex + 1
      const localRun = runId
      void playSegment(nextIndex, localRun)
      return
    }
    stop()
  }

  function handleError() {
    if (state.postKey) {
      patch({
        status: PLAYBACK_STATUS.IDLE,
        message: '播客音频加载失败',
        postKey: '',
        currentTime: 0,
        duration: 0
      })
    }
  }

  function stop(resetPost = true) {
    runId += 1
    if (audio) {
      audio.pause()
      try {
        audio.removeAttribute('src')
        audio.load()
      } catch (error) {
        // src 未设置过
      }
    }
    patch({
      ...INITIAL_STATE,
      playbackRates: state.playbackRates,
      playbackRate: state.playbackRate,
      postKey: resetPost ? '' : state.postKey
    })
  }

  async function playSegment(index, activeRunId) {
    const segment = state.segments[index]
    const player = ensureAudio()
    if (!segment?.src || !player) {
      patch({ status: PLAYBACK_STATUS.IDLE, message: '播客音频不可用', postKey: '' })
      return
    }
    if (isStale(activeRunId)) return

    patch({
      currentIndex: index,
      status: PLAYBACK_STATUS.LOADING,
      currentTime: 0,
      duration: 0,
      message: ''
    })

    try {
      if (player.getAttribute('src') !== segment.src) {
        player.src = segment.src
      }
      player.playbackRate = state.playbackRate
      await player.play()
      if (isStale(activeRunId)) return
      patch({ status: PLAYBACK_STATUS.PLAYING, message: '' })
    } catch (error) {
      if (isStale(activeRunId)) return
      if (error?.name === 'AbortError') {
        patch({ status: PLAYBACK_STATUS.PAUSED })
        return
      }
      patch({
        status: PLAYBACK_STATUS.IDLE,
        message: error?.message || '播客音频播放失败',
        postKey: ''
      })
    }
  }

  async function toggle(payload) {
    if (!payload?.postKey || !Array.isArray(payload.segments) || payload.segments.length === 0) {
      return
    }
    const { postKey, manifest, segments, script } = payload

    if (state.postKey === postKey && state.status === PLAYBACK_STATUS.PLAYING) {
      ensureAudio()?.pause()
      patch({ status: PLAYBACK_STATUS.PAUSED })
      return
    }

    if (state.postKey === postKey && state.status === PLAYBACK_STATUS.PAUSED) {
      const localRun = runId
      patch({ status: PLAYBACK_STATUS.LOADING, message: '' })
      try {
        await ensureAudio()?.play()
        if (isStale(localRun)) return
        patch({ status: PLAYBACK_STATUS.PLAYING, message: '' })
      } catch (error) {
        if (isStale(localRun) || error?.name === 'AbortError') return
        patch({ status: PLAYBACK_STATUS.PAUSED, message: error?.message || '' })
      }
      return
    }

    if (state.postKey === postKey && state.status === PLAYBACK_STATUS.LOADING) {
      stop()
      return
    }

    runId += 1
    const localRun = runId
    patch({
      postKey,
      manifest: manifest || state.manifest,
      segments,
      script: Array.isArray(script) ? script : state.script,
      currentIndex: 0,
      currentTime: 0,
      duration: 0,
      status: PLAYBACK_STATUS.LOADING,
      message: '',
      startedAt: now()
    })

    await playSegment(0, localRun)
  }

  function setPlaybackRate(rate) {
    const next = Number(rate)
    if (!Number.isFinite(next) || next <= 0) return
    if (audio) {
      audio.playbackRate = next
    }
    patch({ playbackRate: next })
  }

  function cyclePlaybackRate() {
    const rates = state.playbackRates
    const index = rates.indexOf(state.playbackRate)
    const next = rates[(index + 1) % rates.length] || rates[0]
    setPlaybackRate(next)
    return next
  }

  function seekToProgress(progress) {
    if (state.status === PLAYBACK_STATUS.IDLE) return
    if (typeof progress !== 'number' || !Number.isFinite(progress)) return
    const clamped = Math.max(0, Math.min(0.999, progress))
    const segments = state.segments
    if (segments.length === 0) return
    const targetIndex = Math.min(
      segments.length - 1,
      Math.floor(clamped * segments.length)
    )
    const intra = (clamped * segments.length) - targetIndex
    const player = ensureAudio()
    if (!player) return

    if (targetIndex !== state.currentIndex) {
      const localRun = runId
      void playSegment(targetIndex, localRun).then(() => {
        if (isStale(localRun) || !audio) return
        const targetDuration = audio.duration || 0
        if (targetDuration > 0) {
          audio.currentTime = intra * targetDuration
        }
      })
    } else {
      const duration = audio.duration || state.duration
      if (duration > 0) {
        player.currentTime = intra * duration
      }
    }
  }

  function getState() {
    return state
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') return noop
    listeners.add(listener)
    listener(state)
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0) {
        stop()
      }
    }
  }

  function dispose() {
    runId += 1
    listeners.clear()
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio = null
    }
  }

  return {
    getState,
    subscribe,
    toggle,
    stop,
    setPlaybackRate,
    cyclePlaybackRate,
    seekToProgress,
    dispose
  }
}
