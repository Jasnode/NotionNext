import Link from 'next/link'
import { siteConfig } from '@/lib/config'
import { resolveLinkHref, getHrefUrlString, isPublicHtmlHref } from '@/lib/utils/link'

// 过滤 <a> 标签不能识别的 props
const filterDOMProps = props => {
  const { passHref, legacyBehavior, ...rest } = props
  return rest
}

const SmartLink = ({ href, children, ...rest }) => {
  const LINK = siteConfig('LINK')
  const { isExternal, href: resolvedHref } = resolveLinkHref(href, LINK)

  if (isExternal) {
    return (
      <a
        href={resolvedHref}
        target='_blank'
        rel='noopener noreferrer'
        {...filterDOMProps(rest)}>
        {children}
      </a>
    )
  }

  if (isPublicHtmlHref(resolvedHref)) {
    const anchorHref = getHrefUrlString(resolvedHref)
    return (
      <a href={anchorHref} {...filterDOMProps(rest)}>
        {children}
      </a>
    )
  }

  // 内部链接（可为对象形式）
  return (
    <Link href={resolvedHref} {...rest}>
      {children}
    </Link>
  )
}

export default SmartLink
