import { useRouter } from 'next/router'
import { useImperativeHandle, useRef, useState } from 'react'
import { useGlobal } from '@/lib/global'

const SearchInput = props => {
  const { currentSearch, cRef, className, staticSearch = false } = props
  const [onLoading, setLoadingState] = useState(false)
  const router = useRouter()
  const searchInputRef = useRef()
  const { locale } = useGlobal()
  // 输入法组合期锁定 — 用 useRef 持有，避免使用模块级变量在 SSR
  // 多请求 / 多实例间互相污染（之前 `let lock = false` 是模块作用域）。
  const lockRef = useRef(false)
  useImperativeHandle(cRef, () => {
    return {
      focus: () => {
        searchInputRef?.current?.focus()
      }
    }
  })

  const handleSearch = () => {
    if (lockRef.current) return
    const key = searchInputRef.current.value.trim()
    if (key && key !== '') {
      setLoadingState(true)
      // 静态导出无法生成任意关键词路径；动态部署保留服务端全文搜索。
      const destination = staticSearch
        ? { pathname: '/search', query: { s: key } }
        : { pathname: '/search/[keyword]', query: { keyword: key } }
      router.push(destination).catch(() => {}).finally(() => {
        setLoadingState(false)
      })
    } else {
      router.push({ pathname: '/' }).then(r => {})
    }
  }
  const handleKeyUp = e => {
    if (e.keyCode === 13) {
      // 回车
      handleSearch(searchInputRef.current.value)
    } else if (e.keyCode === 27) {
      // ESC
      cleanSearch()
    }
  }
  const cleanSearch = () => {
    searchInputRef.current.value = ''
  }

  const [showClean, setShowClean] = useState(false)
  const updateSearchKey = val => {
    if (lockRef.current) {
      return
    }
    searchInputRef.current.value = val

    if (val) {
      setShowClean(true)
    } else {
      setShowClean(false)
    }
  }
  function lockSearchInput () {
    lockRef.current = true
  }

  function unLockSearchInput () {
    lockRef.current = false
  }

  return (
    <div className={'flex w-full rounded-lg ' + className}>
      <input
        ref={searchInputRef}
        type="text"
        className={
          'outline-none w-full text-sm pl-5 rounded-lg transition focus:shadow-lg dark:text-gray-300 font-light leading-10 text-black bg-white dark:bg-gray-500'
        }
        onKeyUp={handleKeyUp}
        onCompositionStart={lockSearchInput}
        onCompositionUpdate={lockSearchInput}
        onCompositionEnd={unLockSearchInput}
        placeholder={locale.SEARCH.ARTICLES}
        onChange={e => updateSearchKey(e.target.value)}
        defaultValue={currentSearch || ''}
      />

      <div
        className="-ml-8 cursor-pointer  float-right items-center justify-center py-2"
        onClick={handleSearch}
      >
        <i
          className={`hover:text-black transform duration-200 text-gray-500 dark:text-gray-200 cursor-pointer fas ${
            onLoading ? 'fa-spinner animate-spin' : 'fa-search'
          }`}
        />
      </div>

      {showClean && (
        <div className="-ml-12 cursor-pointer float-right items-center justify-center py-2">
          <i
            className="hover:text-black transform duration-200 text-gray-400 dark:text-gray-300 cursor-pointer fas fa-times"
            onClick={cleanSearch}
          />
        </div>
      )}
    </div>
  )
}

export default SearchInput
