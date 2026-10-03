import { getNotionLinkProps } from '@/lib/db/notion/linkTarget'

export { shouldOpenNotionLinkInNewTab } from '@/lib/db/notion/linkTarget'

const NotionLink = ({ href, target, rel, siteOrigin, preferSameTab, ...props }) => {
  const linkProps = getNotionLinkProps({ href, target, rel, siteOrigin, preferSameTab })
  return <a {...props} href={href} {...linkProps} />
}

export default NotionLink
