import React from 'react'
import { render } from '@testing-library/react'

jest.mock('@/components/FriendLinksCollection', () => ({
  FriendLinksCollection: props => (
    <div data-testid='friend-links-collection' {...props} />
  )
}))

jest.mock('notion-utils', () => ({
  getBlockValue: value => value?.value || value
}))

import NotionCollection, {
  GALLERY_VISIBILITY_WRAPPER_CLASS
} from '@/components/NotionCollection'

const galleryProps = format => ({
  block: { view_ids: ['view-id'] },
  ctx: {
    recordMap: {
      collection_view: {
        'view-id': { value: { type: 'gallery', format } }
      }
    }
  }
})

describe('NotionCollection gallery visibility wrapper', () => {
  it('keeps the wrapper full width when a visibility class is needed', () => {
    const { container } = render(
      <NotionCollection
        {...galleryProps({
          gallery_properties: [{ property: 'title', visible: true }]
        })}
      />
    )

    expect(container.firstChild).toHaveClass(
      GALLERY_VISIBILITY_WRAPPER_CLASS,
      'notion-gallery-hide-page-icons'
    )
  })

  it('does not add a wrapper when no visibility override is needed', () => {
    const { container } = render(
      <NotionCollection
        {...galleryProps({
          show_page_icon: true,
          gallery_properties: [{ property: 'title', visible: true }]
        })}
      />
    )

    expect(container.firstChild).toHaveAttribute(
      'data-testid',
      'friend-links-collection'
    )
  })
})
