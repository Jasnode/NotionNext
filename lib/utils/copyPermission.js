export function getPageCanCopy(siteCanCopy, post) {
  const pageCanCopy =
    post?.CAN_COPY ?? post?.canCopy ?? post?.ext?.CAN_COPY ?? post?.ext?.canCopy

  if (pageCanCopy === undefined || pageCanCopy === null || pageCanCopy === '') {
    return parseCopyPermission(siteCanCopy)
  }

  return parseCopyPermission(pageCanCopy)
}

function parseCopyPermission(permission) {
  const value = Array.isArray(permission) ? permission[0] : permission

  if (typeof value === 'string') {
    return !['false', '0', 'no', '否'].includes(value.trim().toLowerCase())
  }

  return Boolean(value)
}
