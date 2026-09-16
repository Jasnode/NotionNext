/**
 * Waline 表情面板行为增强（尺寸/定位规则在 styles/globals.css）
 *
 * 弹窗 DOM 由 Waline 内部渲染、传不了 props，只能 init 后接管。
 * 几何值写成 CSS 变量给 globals.css 的 !important 规则消费——
 * 样式表 !important 优先于普通内联样式，直写 style.left 无效。
 */

const WHEEL_LINE_PX = 16

const wheelDelta = (e, raw, axisLength) => {
  if (e.deltaMode === 1) return raw * WHEEL_LINE_PX
  if (e.deltaMode === 2) return raw * axisLength
  return raw
}

export function attachWalineEmojiPanelBehavior(rootEl) {
  if (typeof window === 'undefined' || !rootEl) return () => {}

  const boundPopups = new WeakSet()
  const cleanups = []

  const bindPopup = popup => {
    if (boundPopups.has(popup)) return
    boundPopups.add(popup)

    const local = []

    // 左右缘 + 圆角对齐输入框卡片（纵向偏移在 globals.css 里 calc）
    // 不 round：非整数缩放下卡片宽是小数，取整会差半像素
    const syncGeometry = () => {
      const panel = popup.closest('.wl-panel') || rootEl
      const opEl = popup.offsetParent
      if (!opEl) return
      const opRect = opEl.getBoundingClientRect()
      const panelRect = panel.getBoundingClientRect()
      popup.style.setProperty(
        '--wl-popup-left',
        `${(panelRect.left - opRect.left).toFixed(2)}px`
      )
      popup.style.setProperty(
        '--wl-popup-width',
        `${panelRect.width.toFixed(2)}px`
      )
      popup.style.setProperty(
        '--wl-popup-radius',
        window.getComputedStyle(panel).borderRadius
      )
    }

    // 预览底边贴 .wl-actions 上沿。预览 img 挂 v-if 会重建，变量得写在 popup 上靠继承
    // top 的基准是 popup 的 padding box，rect 给的是 border box，要减掉 border
    let lastTop = null
    const syncPreviewTop = () => {
      if (!popup.classList.contains('display')) return
      const panel = popup.closest('.wl-panel') || rootEl
      const actions = panel.querySelector('.wl-actions')
      if (!actions) return
      const borderTop =
        parseFloat(window.getComputedStyle(popup).borderTopWidth) || 0
      const y =
        actions.getBoundingClientRect().top -
        popup.getBoundingClientRect().top -
        borderTop
      const next = `${y.toFixed(2)}px`
      if (next !== lastTop) {
        lastTop = next
        popup.style.setProperty('--wl-emoji-preview-top', next)
      }
    }

    // 分类栏横滚；网格滚到头拦掉。面板是贴着输入框的浮层，页面一滚它就跟着跑，
    // 所以面板内其余位置（预览图、边框）也一律吞掉
    const onWheel = e => {
      const tabs = e.target.closest?.('.wl-tabs')
      if (tabs) {
        e.preventDefault()
        // 触控板横滑只给 deltaX，滚轮只给 deltaY
        const raw =
          Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
        tabs.scrollLeft += wheelDelta(e, raw, tabs.clientWidth)
        return
      }
      const wrapper = e.target.closest?.('.wl-tab-wrapper')
      if (!wrapper) {
        e.preventDefault()
        return
      }
      const dy = wheelDelta(e, e.deltaY, wrapper.clientHeight)
      const atTop = wrapper.scrollTop <= 0
      const atBottom =
        wrapper.scrollTop + wrapper.clientHeight >= wrapper.scrollHeight - 1
      if ((dy < 0 && atTop) || (dy > 0 && atBottom)) e.preventDefault()
    }

    popup.setAttribute('data-lenis-prevent', '')
    popup.addEventListener('wheel', onWheel, { passive: false })
    local.push(() => {
      popup.removeAttribute('data-lenis-prevent')
      popup.removeEventListener('wheel', onWheel)
    })

    // rAF 排在 Waline 内联写 left 之后，再补 top
    let rafId = 0
    const onMouseOver = e => {
      if (!e.target.closest?.('.wl-tab-wrapper')) return
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(syncPreviewTop)
    }
    popup.addEventListener('mouseover', onMouseOver)
    local.push(() => {
      popup.removeEventListener('mouseover', onMouseOver)
      cancelAnimationFrame(rafId)
    })

    // display class 变化 = 面板开关，重算
    const attrObserver = new MutationObserver(records => {
      for (const r of records) {
        if (r.type === 'attributes' && r.attributeName === 'class') {
          syncGeometry()
          syncPreviewTop()
        }
      }
    })
    attrObserver.observe(popup, {
      attributes: true,
      attributeFilter: ['class']
    })
    local.push(() => attrObserver.disconnect())

    // 卡片会变尺寸（拖高 textarea 等）。popup 绝对定位不参与卡片布局，不会循环
    const panelEl = popup.closest('.wl-panel')
    let ro = null
    if (panelEl && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => syncGeometry())
      ro.observe(panelEl)
      local.push(() => ro.disconnect())
    }

    // textarea 文字溢出时自己能滚，Lenis 的 allowNestedScroll:false 会抢掉它。
    // 只标它和上面的 popup 这两个真正的嵌套滚动容器，别整个评论区都退出 Lenis
    const editorEl = panelEl?.querySelector('.wl-editor')
    if (editorEl) {
      editorEl.setAttribute('data-lenis-prevent', '')
      local.push(() => editorEl.removeAttribute('data-lenis-prevent'))
    }

    const onResize = () => {
      syncGeometry()
      syncPreviewTop()
    }
    window.addEventListener('resize', onResize)
    local.push(() => window.removeEventListener('resize', onResize))

    syncGeometry()
    cleanups.push(() => local.forEach(fn => fn()))
  }

  rootEl.querySelectorAll('.wl-emoji-popup').forEach(bindPopup)

  // 回复框的 popup 点「回复」才挂载，观察得一直挂着。
  // 只扫新增节点自身的子树——评论列表渲染时 DOM 变动很密，别每次整树查
  const treeObserver = new MutationObserver(records => {
    for (const r of records) {
      for (const node of r.addedNodes) {
        if (node.nodeType !== 1) continue
        if (node.matches('.wl-emoji-popup')) bindPopup(node)
        node.querySelectorAll('.wl-emoji-popup').forEach(bindPopup)
      }
    }
  })
  treeObserver.observe(rootEl, { childList: true, subtree: true })
  cleanups.push(() => treeObserver.disconnect())

  return () => {
    cleanups.forEach(fn => fn())
    cleanups.length = 0
  }
}

export default attachWalineEmojiPanelBehavior
