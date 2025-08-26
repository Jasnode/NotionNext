import Link from 'next/link'
import { siteConfig } from '@/lib/config'

const A_ALLOWED_PROPS = new Set([
  'className','style','id','title',
  'hrefLang','referrerPolicy','download',
  'target','rel',
  // data-/aria-
])
const filterAProps = (props = {}) => {
  const out = {}
  for (const k in props) {
    if (k.startsWith('data-') || k.startsWith('aria-') || A_ALLOWED_PROPS.has(k)) {
      out[k] = props[k]
    }
  }
  return out
}

const toStringUrlObject = (obj) => {
  // 组装 UrlObject -> 字符串（保留 query/hash）
  const { pathname = '', query, hash } = obj || {}
  let url = pathname || ''
  if (query && typeof query === 'object' && Object.keys(query).length) {
    const qs = new URLSearchParams(query).toString()
    if (qs) url += (url.includes('?') ? '&' : '?') + qs
  }
  if (hash) url += (hash.startsWith('#') ? hash : `#${hash}`)
  return url
}

const isExternalUrl = (hrefStr, siteBase) => {
  // 协议型外链（mailto/tel等）
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(hrefStr)) {
    // http/https 之外的协议一律视为外链
    return !/^https?:/i.test(hrefStr)
  }
  // 协议相对 //host
  if (hrefStr.startsWith('//')) return true
  // 相对路径认为是内部
  if (hrefStr.startsWith('/')) return false
  // 绝对 http(s) 与本域比较
  try {
    const u = new URL(hrefStr, siteBase || undefined)
    const base = new URL(siteBase)
    return u.origin !== base.origin
  } catch {
    // 解析失败时保守处理为外链
    return true
  }
}

const SmartLink = ({ href, children, ...rest }) => {
  const LINK = siteConfig('LINK') // 需要是绝对地址，如 https://example.com

  // 标准化为字符串用于判断
  const hrefStr = typeof href === 'string' ? href
                  : (typeof href === 'object' && href !== null ? toStringUrlObject(href) : '')

  if (!hrefStr) return null

  const external = isExternalUrl(hrefStr, LINK)

  if (external) {
    const aProps = filterAProps(rest)
    // 调用方传了 rel/target，也要确保安全位存在
    const target = aProps.target || '_blank'
    const relSet = new Set(
      (aProps.rel || '').split(/\s+/).filter(Boolean)
    )
    relSet.add('noopener'); relSet.add('noreferrer')
    return (
      <a
        {...aProps}
        href={hrefStr}
        target={target}
        rel={[...relSet].join(' ')}
      >
        {children}
      </a>
    )
  }

  // 内链：让 Next 处理（可接受 UrlObject 或字符串）
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  )
}

export default SmartLink
