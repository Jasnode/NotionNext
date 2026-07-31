import { FriendLinksCollection } from '@/components/FriendLinksCollection'
import { galleryVisibilityClassName } from '@/lib/notion/galleryVisibilityClassName'
import { getBlockValue } from 'notion-utils'

const getCollectionView = ({ block, ctx }) => {
  const viewId = block?.view_ids?.[0]
  return getBlockValue(ctx?.recordMap?.collection_view?.[viewId])
}

export default function NotionCollection(props) {
  const className = galleryVisibilityClassName(getCollectionView(props))
  const collection = <FriendLinksCollection {...props} />

  if (!className) return collection

  return <div className={className}>{collection}</div>
}
