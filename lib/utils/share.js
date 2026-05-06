export const buildQQShareUrl = ({ shareUrl = '', title = '', body = '' }) => {
  const params = new URLSearchParams({
    url: String(shareUrl),
    sharesource: 'qzone',
    title: String(title),
    desc: String(body)
  })

  return `https://connect.qq.com/widget/shareqq/index.html?${params.toString()}`
}
