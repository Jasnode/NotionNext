const WALINE_COMMENT_CARD_CLASS = 'wl-card-item'
const WALINE_CARDS_CLASS = 'wl-cards'

export const isWalineCommentAnchor = element =>
  Boolean(element?.classList?.contains(WALINE_COMMENT_CARD_CLASS))

const normalizeHash = hash => {
  if (!hash || typeof hash !== 'string') return ''
  return hash.startsWith('#') ? hash.slice(1) : hash
}

export const scrollToWalineAnchor = ({
  anchor,
  root = typeof document !== 'undefined' ? document : null,
  delay = 300
}) => {
  const anchorId = normalizeHash(anchor)
  if (!anchorId || !root?.getElementById) return false

  const anchorElement = root.getElementById(anchorId)
  if (!isWalineCommentAnchor(anchorElement)) return false

  anchorElement.scrollIntoView?.({ block: 'end', behavior: 'smooth' })
  setTimeout(() => {
    anchorElement.classList.add('animate__animated')
    anchorElement.classList.add('animate__bounceInRight')
  }, delay)

  return true
}

export const createWalineAnchorObserver = ({
  anchor,
  container,
  root = typeof document !== 'undefined' ? document : null,
  mutationObserver =
    typeof MutationObserver !== 'undefined' ? MutationObserver : null,
  delay = 300
}) => {
  if (!anchor || !root || !mutationObserver) return null
  if (scrollToWalineAnchor({ anchor, root, delay })) return null

  const cardsNode = root.getElementsByClassName?.(WALINE_CARDS_CLASS)?.[0]
  const targetNode = cardsNode || container
  if (!targetNode) return null

  const observer = new mutationObserver(mutations => {
    const hasChildListChange = mutations.some(
      mutation => mutation.type === 'childList'
    )
    if (!hasChildListChange) return

    if (scrollToWalineAnchor({ anchor, root, delay })) {
      observer.disconnect()
    }
  })

  observer.observe(targetNode, { childList: true, subtree: true })
  return observer
}
