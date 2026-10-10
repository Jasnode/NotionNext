import fs from 'fs'
import path from 'path'
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
  it('wraps the collection with the visibility class when a gallery override is needed', () => {
    const { container } = render(
      <NotionCollection
        {...galleryProps({
          gallery_properties: [{ property: 'title', visible: false }]
        })}
      />
    )

    expect(container.firstChild).toHaveClass(
      GALLERY_VISIBILITY_WRAPPER_CLASS,
      'notion-gallery-hide-page-icons',
      'notion-gallery-hide-titles'
    )
    expect(container.firstChild.firstElementChild).toHaveAttribute(
      'data-testid',
      'friend-links-collection'
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

  it('keeps one stretch rule that prevents the wrapper from collapsing into one column', () => {
    const css = fs.readFileSync(
      path.resolve(__dirname, '../../styles/notion.css'),
      'utf8'
    )
    const rules = css.match(/\.notion-gallery-visibility-wrapper\s*\{[^}]*\}/g)

    expect(rules).toHaveLength(1)
    expect(rules[0]).toContain('align-self: stretch')
    expect(rules[0]).toContain('width: 100%')
    expect(rules[0]).toContain('min-width: 100%')
  })
})
