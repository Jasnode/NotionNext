import Link from 'next/link'
import { useState } from 'react'

export const MenuItemDrop = ({ link }) => {
  const [show, changeShow] = useState(false)
  const hasSubMenu = link?.subMenus?.length > 0

  if (!link || !link.show) {
    return null
  }

  return (
    <div
      onMouseOver={() => changeShow(true)}
      onMouseOut={() => changeShow(false)}
      className="relative"
    >
      {/* 不含子菜单 */}
      {!hasSubMenu && (
        <Link
          target={link?.target}
          href={link?.href}
          className="rounded-full flex justify-center items-center px-3 py-1 no-underline tracking-widest hover:bg-purple-600/25 hover:shadow-lg transform"
        >
          {link?.icon && <i className={link?.icon} />} {link?.name}
        </Link>
      )}
      {/* 含子菜单的按钮 */}
      {hasSubMenu && (
        <>
          <div className="cursor-pointer rounded-full flex justify-center items-center px-3 py-1 no-underline tracking-widest relative hover:bg-purple-600/25 hover:shadow-lg transform">
            {link?.icon && <i className={link?.icon} />} {link?.name}
            {/* 主菜单下方的安全区域 */}
            {show && (
              <div className='absolute w-full h-4 -bottom-4 left-0 bg-transparent z-30'></div>
            )}
          </div>
        </>
      )}
      {/* 子菜单 */}
      {hasSubMenu && (
        <ul
          className={`${show ? 'visible opacity-100 top-14 pointer-events-auto' : 'invisible opacity-0 top-20 pointer-events-none'} drop-shadow-md overflow-hidden rounded-3xl backdrop-blur-lg bg-purple-200/20 dark:bg-purple-600/20 transition-all duration-300 z-20 absolute`}
        >
          {link.subMenus.map((sLink, index) => {
            return (
              <li
                key={index}
                className="cursor-pointer hover:bg-blue-600 dark:hover:bg-[#ec4899] hover:text-white text-gray-900 dark:text-gray-100  tracking-widest transition-all duration-200 py-1 pr-6 pl-3"
              >
                <Link href={sLink.href} target={link?.target}>
                  <span className="text-sm text-nowrap font-normal">
                    {link?.icon && <i className={sLink?.icon}> &nbsp; </i>}
                    {sLink.title}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}