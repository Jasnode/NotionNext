import { mapImgUrl } from '@/lib/db/notion/mapImage'
import {
  getBlockCollectionId,
  getBlockValue,
  getTextContent
} from 'notion-utils'
import {
  Collection as DefaultCollection,
  Property
} from 'react-notion-x/build/third-party/collection'
import { PageIcon } from 'react-notion-x'
import { useEffect, useMemo, useState } from 'react'

const FRIEND_LINK_NAME_PATTERN = /友(?:情)?链/
const RECHECK_INTERVAL_MS = 15 * 1000
const REQUEST_TIMEOUT_MS = 8 * 1000
const MAX_ONLINE_CHECKS = 2
const MAX_OFFLINE_CHECKS = 3
const MAX_CONCURRENT_CHECKS = 3

const isHttpUrl = value => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

const getLinkPropertyId = (block, schema) => {
  const entries = Object.entries(schema)
  const urlProperty = entries.find(([id, property]) => {
    const value = getTextContent(block.properties?.[id]).trim()
    return property.type === 'url' && isHttpUrl(value)
  })

  if (urlProperty) return urlProperty[0]

  return entries.find(([id, property]) => {
    const value = getTextContent(block.properties?.[id]).trim()
    return /url|link|链接|网址/i.test(property.name || '') && isHttpUrl(value)
  })?.[0]
}

const getLink = (block, schema) => {
  const propertyId = getLinkPropertyId(block, schema)
  return {
    propertyId,
    url: propertyId ? getTextContent(block.properties?.[propertyId]).trim() : ''
  }
}

const getCover = (block, collection, cover) => {
  if (cover?.type === 'page_cover' && block.format?.page_cover) {
    return mapImgUrl(block.format.page_cover, block)
  }

  if (cover?.type === 'property' && cover.property) {
    const property = collection.schema[cover.property]
    const data = block.properties?.[cover.property]
    if (property?.type === 'file' && data?.[0]) {
      const file = data[0].flat?.(2)
      if (file?.[2]) return mapImgUrl(file[2], block)
    }
  }

  return null
}

const LinkStatus = ({ result }) => {
  const status = result?.status || 'checking'
  const color =
    status === 'online'
      ? 'bg-green-500'
      : status === 'offline'
        ? 'bg-red-500'
        : 'bg-gray-500'
  const latency = Number.isFinite(result?.latency)
    ? `: ${(result.latency / 1000).toFixed(2)}s`
    : ''
  const label =
    status === 'online'
      ? `Online${latency}`
      : status === 'offline'
        ? 'Offline'
        : 'Checking...'

  return (
    <span className='blog-status flex items-center gap-1 mr-5'>
      <span
        className={`block flex-none w-3 h-3 animate-pulse rounded-full ${color}`}
        aria-hidden='true'
      />
      <span className='leading-none'>{label}</span>
    </span>
  )
}

const FriendLinkPageIcon = ({ block }) => {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <span className='contents' onErrorCapture={() => setVisible(false)}>
      <PageIcon block={block} className='notion-page-title-icon' />
    </span>
  )
}

/**
 * 由访客浏览器直接探测友链，结果代表当前访客能否访问目标站点。
 * no-cors 允许跨域请求返回不透明响应；这里只判断连接是否成功，不读取正文。
 */
const probeFriendLink = async (url, controller) => {
  const startedAt = performance.now()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'follow',
      signal: controller.signal
    })
    return {
      url,
      status: 'online',
      latency: Math.round(performance.now() - startedAt)
    }
  } catch {
    return { url, status: 'offline', latency: null }
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * 首轮和第二轮检测全部友链，第二轮仍失败的链接再进行第三次检测。
 * 每批最多并发三个浏览器请求，避免页面加载时瞬间建立过多连接。
 */
const useFriendLinkHealth = urlKey => {
  const [results, setResults] = useState({})

  useEffect(() => {
    const urls = JSON.parse(urlKey)
    setResults({})
    if (!urls.length) return

    let active = true
    let recheckTimer
    const controllers = new Set()
    const attempts = new Map(urls.map(url => [url, 0]))

    const checkLink = async url => {
      const controller = new AbortController()
      controllers.add(controller)
      attempts.set(url, (attempts.get(url) || 0) + 1)
      try {
        return await probeFriendLink(url, controller)
      } finally {
        controllers.delete(controller)
      }
    }

    const runChecks = async urlsToCheck => {
      setResults(current => {
        const next = { ...current }
        urlsToCheck.forEach(url => delete next[url])
        return next
      })

      const roundResults = []
      for (
        let index = 0;
        index < urlsToCheck.length;
        index += MAX_CONCURRENT_CHECKS
      ) {
        if (!active) return
        const batch = urlsToCheck.slice(index, index + MAX_CONCURRENT_CHECKS)
        const batchResults = await Promise.all(batch.map(checkLink))
        roundResults.push(...batchResults)
        if (active) {
          setResults(current => {
            const next = { ...current }
            batchResults.forEach(result => {
              next[result.url] = result
            })
            return next
          })
        }
      }

      const retryUrls = roundResults
        .filter(result => {
          const attemptCount = attempts.get(result.url) || 0
          return result.status === 'online'
            ? attemptCount < MAX_ONLINE_CHECKS
            : attemptCount < MAX_OFFLINE_CHECKS
        })
        .map(result => result.url)
      if (active && retryUrls.length > 0) {
        recheckTimer = setTimeout(() => {
          void runChecks(retryUrls)
        }, RECHECK_INTERVAL_MS)
      }
    }

    void runChecks(urls)

    return () => {
      active = false
      clearTimeout(recheckTimer)
      controllers.forEach(controller => controller.abort())
    }
  }, [urlKey])

  return results
}

const FriendLinkCard = ({
  block,
  collection,
  cover,
  coverSize,
  coverAspect,
  linkPropertyId,
  properties,
  result,
  url
}) => {
  const title = getTextContent(block.properties?.title).trim()
  const image = getCover(block, collection, cover)
  const coverPosition = (1 - (block.format?.page_cover_position ?? 0.5)) * 100
  const visibleProperties = properties.filter(
    property =>
      property.visible &&
      property.property !== 'title' &&
      collection.schema[property.property]
  )
  const linkPropertyIsVisible = visibleProperties.some(
    property => property.property === linkPropertyId
  )

  const statusRow = url && (
    <div className='flex items-center text-xs'>
      <LinkStatus result={result} />
      <a
        className={`blog-link select-none rounded-full text-white w-16 text-center text-sm p-1 ${result?.status === 'online' ? 'bg-blue-500' : 'bg-gray-300'}`}
        href={url}
        target='_blank'
        rel='noopener noreferrer'
      >
        Visit
      </a>
    </div>
  )

  return (
    <article
      className={`notion-collection-card notion-collection-card-size-${coverSize}`}
    >
      {(image || cover?.type !== 'none') && (
        <div className='notion-collection-card-cover'>
          {image ? (
            // 友链封面来源不固定，无法加入 Next Image 的固定域名白名单。
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={title || '友链头像'}
              loading='lazy'
              decoding='async'
              style={{
                objectFit: coverAspect || 'cover',
                objectPosition: `center ${coverPosition}%`
              }}
            />
          ) : (
            <div className='notion-collection-card-cover-empty' />
          )}
        </div>
      )}
      <div className='notion-collection-card-body'>
        <div className='notion-collection-card-property'>
          <span className='notion-property notion-property-title'>
            <span className='notion-page-link'>
              <span className='notion-page-title'>
                <FriendLinkPageIcon block={block} />
                <span className='notion-page-title-text'>{title}</span>
              </span>
            </span>
          </span>
        </div>
        {visibleProperties.map(property => {
          const propertyId = property.property
          const schema = collection.schema[propertyId]
          return (
            <div className='notion-collection-card-property' key={propertyId}>
              {propertyId === linkPropertyId && statusRow}
              <Property
                schema={schema}
                data={block.properties?.[propertyId]}
                block={block}
                collection={collection}
                inline
              />
            </div>
          )
        })}
        {!linkPropertyIsVisible && statusRow && (
          <div className='notion-collection-card-property'>{statusRow}</div>
        )}
      </div>
    </article>
  )
}

const FriendLinksGallery = ({
  cards,
  collection,
  className,
  collectionView
}) => {
  const format = collectionView.format || {}
  const properties = format.gallery_properties || []
  const cardLinks = useMemo(
    () =>
      cards.map(block => ({
        block,
        ...getLink(block, collection.schema)
      })),
    [cards, collection.schema]
  )
  const urlKey = JSON.stringify([
    ...new Set(cardLinks.map(item => item.url).filter(Boolean))
  ])
  const results = useFriendLinkHealth(urlKey)

  return (
    <div className={`notion-collection ${className || ''}`}>
      <div className='notion-gallery'>
        <div className='notion-gallery-view'>
          <div
            className={`notion-gallery-grid notion-gallery-grid-size-${format.gallery_cover_size || 'medium'}`}
          >
            {cardLinks.map(({ block, propertyId, url }) => {
              return (
                <FriendLinkCard
                  key={block.id}
                  block={block}
                  collection={collection}
                  cover={format.gallery_cover || { type: 'none' }}
                  coverSize={format.gallery_cover_size || 'medium'}
                  coverAspect={format.gallery_cover_aspect || 'cover'}
                  linkPropertyId={propertyId}
                  properties={properties}
                  result={results[url]}
                  url={url}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export const FriendLinksCollection = props => {
  const { block, className, ctx } = props
  const recordMap = ctx?.recordMap

  if (block?.type === 'page' || !recordMap) {
    return <DefaultCollection {...props} />
  }

  const collectionId = getBlockCollectionId(block, recordMap)
  const collection = getBlockValue(recordMap?.collection?.[collectionId])
  const viewId = block?.view_ids?.[0]
  const collectionView = getBlockValue(recordMap?.collection_view?.[viewId])
  const collectionData = recordMap?.collection_query?.[collectionId]?.[viewId]
  const collectionName = getTextContent(collection?.name).trim()
  const viewName = getTextContent(collectionView?.name).trim()

  const isFriendLinks =
    [collectionName, viewName].some(name =>
      FRIEND_LINK_NAME_PATTERN.test(name)
    ) &&
    collectionView?.type === 'gallery' &&
    !collectionView?.format?.collection_group_by &&
    Object.values(collection?.schema || {}).some(
      property =>
        property.type === 'url' ||
        /url|link|链接|网址/i.test(property.name || '')
    )

  if (!isFriendLinks || !collectionData) {
    return <DefaultCollection {...props} />
  }

  const blockIds =
    collectionData.collection_group_results?.blockIds ||
    collectionData['results:relation:uncategorized']?.blockIds ||
    collectionData.blockIds ||
    []
  const cards = blockIds
    .map(blockId => getBlockValue(recordMap.block?.[blockId]))
    .filter(Boolean)

  return (
    <FriendLinksGallery
      cards={cards}
      collection={collection}
      className={className}
      collectionView={collectionView}
    />
  )
}
