import Link from 'next/link'
import { siteConfig } from '@/lib/config'
import { useRouter } from 'next/router'

/**
 * 过滤Next.js Link特有的props，避免传递给DOM元素
 */
const filterLinkProps = props => {
  const { 
    href,
    as,
    replace,
    scroll,
    shallow,
    passHref,
    prefetch,
    legacyBehavior,
    locale,
    ...rest 
  } = props
  return rest
}

/**
 * 判断URL是否是外部链接
 */
const isExternalUrl = (url, baseUrl) => {
  if (!url || typeof url !== 'string') return false
  
  // 非HTTP协议直接排除
  if (!/^https?:\/\//i.test(url)) return false

  try {
    const baseOrigin = new URL(baseUrl).origin
    const targetOrigin = new URL(url, baseUrl).origin
    return baseOrigin !== targetOrigin
  } catch (e) {
    // URL解析失败视为外部链接
    return true
  }
}

/**
 * 判断URL是否是特殊协议链接
 */
const isSpecialProtocol = url => {
  return /^(mailto:|tel:|sms:|data:)/i.test(url)
}

const SmartLink = ({ href, children, ...props }) => {
  // 获取站点配置
  const BASE_URL = siteConfig('LINK') || ''
  const BASE_PATH = siteConfig('BASE_PATH', '')
  
  // 获取Next.js路由信息（客户端）
  const router = useRouter?.()
  const currentPath = router?.asPath || ''

  // 特殊协议直接返回<a>标签
  if (typeof href === 'string' && isSpecialProtocol(href)) {
    return (
      <a href={href} {...filterLinkProps(props)}>
        {children}
      </a>
    )
  }

  // 处理锚点链接（包括当前页面锚点）
  if (typeof href === 'string' && href.startsWith('#')) {
    const isSamePage = currentPath.includes('#') 
      ? currentPath.split('#')[0] + href === currentPath
      : false
    
    return (
      <a 
        href={href} 
        {...filterLinkProps(props)}
        {...(isSamePage ? {} : { scroll: false })}
      >
        {children}
      </a>
    )
  }

  // 处理外部链接
  if (typeof href === 'string' && isExternalUrl(href, BASE_URL)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        {...filterLinkProps(props)}
      >
        {children}
      </a>
    )
  }

  // 处理带BASE_PATH的相对路径
  let resolvedHref = href
  if (typeof href === 'string' && BASE_PATH && !href.startsWith(BASE_PATH)) {
    // 确保不以斜杠开头
    const cleanBase = BASE_PATH.replace(/^\/|\/$/g, '')
    // 确保不以斜杠结尾
    const cleanHref = href.replace(/^\//, '')
    resolvedHref = `/${cleanBase}/${cleanHref}`.replace(/\/+/g, '/')
  }

  // 内部链接使用Next.js的Link组件
  return (
    <Link 
      href={resolvedHref} 
      passHref
      {...props}
    >
      {typeof children === 'function' 
        ? children(filterLinkProps(props))
        : children
      }
    </Link>
  )
}

export default SmartLink
