import { fireEvent, render, screen } from '@testing-library/react'
import { NotionRenderer, useNotionContext } from 'react-notion-x'
import NotionTabs, { getNotionTabsPlainText } from '@/components/NotionTabs'

jest.mock('react-notion-x', () => {
  const React = require('react')

  return {
    useNotionContext: jest.fn(),
    NotionRenderer: jest.fn(({ recordMap, blockId }) => {
      const block = recordMap?.block?.[blockId]?.value
      const title = block?.properties?.title?.[0]?.[0] || blockId

      return React.createElement(
        'div',
        { 'data-testid': `rendered-${blockId}` },
        title
      )
    })
  }
})

const recordMap = {
  block: {
    tabs: {
      value: {
        id: 'tabs',
        type: 'embed',
        format: {
          embed_variant: 'notion_tabs'
        },
        content: ['first-tab', 'second-tab']
      }
    },
    'first-tab': {
      value: {
        id: 'first-tab',
        type: 'text',
        properties: {
          title: [['First']]
        },
        content: ['first-body']
      }
    },
    'second-tab': {
      value: {
        id: 'second-tab',
        type: 'text',
        properties: {
          title: []
        },
        content: ['second-body']
      }
    },
    'first-body': {
      value: {
        id: 'first-body',
        type: 'text',
        properties: {
          title: [['First body']]
        }
      }
    },
    'second-body': {
      value: {
        id: 'second-body',
        type: 'text',
        properties: {
          title: [['Second body']]
        }
      }
    }
  }
}

const createContext = () => ({
  recordMap,
  components: { Embed: 'EmbedComponent' },
  mapPageUrl: jest.fn(id => `/${id}`),
  mapImageUrl: jest.fn(url => url),
  isShowingSearch: true,
  onHideSearch: jest.fn(),
  fullPage: true,
  darkMode: false,
  previewImages: true,
  forceCustomImages: false,
  showCollectionViewDropdown: false,
  showTableOfContents: true,
  minTableOfContentsItems: 2,
  linkTableTitleProperties: false,
  isLinkCollectionToUrlProperty: false,
  zoom: { shouldStayInParentContext: true }
})

describe('NotionTabs', () => {
  beforeEach(() => {
    NotionRenderer.mockClear()
    useNotionContext.mockReturnValue(createContext())
  })

  it('renders tab labels and switches the active panel content', () => {
    render(<NotionTabs block={recordMap.block.tabs.value} />)

    const firstTab = screen.getByRole('tab', { name: 'First' })
    const secondTab = screen.getByRole('tab', { name: 'Tab 2' })

    expect(firstTab).toHaveAttribute('aria-selected', 'true')
    expect(secondTab).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('rendered-first-body')).toHaveTextContent(
      'First body'
    )
    expect(screen.queryByTestId('rendered-second-body')).not.toBeInTheDocument()
    expect(NotionRenderer.mock.calls.at(-1)[0]).toEqual(
      expect.objectContaining({
        recordMap,
        blockId: 'first-body',
        fullPage: false,
        isShowingSearch: true,
        showTableOfContents: true,
        minTableOfContentsItems: 2
      })
    )
    expect(NotionRenderer.mock.calls.at(-1)[0]).not.toHaveProperty('zoom')

    fireEvent.click(secondTab)

    expect(secondTab).toHaveAttribute('aria-selected', 'true')
    expect(firstTab).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('rendered-second-body')).toHaveTextContent(
      'Second body'
    )
    expect(screen.getByTestId('rendered-first-body')).toBeInTheDocument()
    expect(
      screen.getByTestId('rendered-first-body').closest('[role="tabpanel"]')
    ).toHaveAttribute('hidden')
    expect(
      screen.getByTestId('rendered-second-body').closest('[role="tabpanel"]')
    ).not.toHaveAttribute('hidden')
  })

  it('keeps visited panel DOM mounted when an enhancer has moved its content', () => {
    render(<NotionTabs block={recordMap.block.tabs.value} />)

    const firstBody = screen.getByTestId('rendered-first-body')
    const originalParent = firstBody.parentElement
    const enhancerWrapper = document.createElement('div')
    enhancerWrapper.dataset.testid = 'enhancer-wrapper'
    originalParent.insertBefore(enhancerWrapper, firstBody)
    enhancerWrapper.appendChild(firstBody)

    expect(() => {
      fireEvent.click(screen.getByRole('tab', { name: 'Tab 2' }))
    }).not.toThrow()

    expect(firstBody).toBeInTheDocument()
    expect(enhancerWrapper).toContainElement(firstBody)
    expect(originalParent).toHaveAttribute('hidden')
  })

  it('flattens rich text labels to plain text', () => {
    expect(getNotionTabsPlainText([['Hello'], [' '], ['World']])).toBe(
      'Hello World'
    )
    expect(getNotionTabsPlainText(null)).toBe('')
  })

  it('navigates tabs with keyboard controls', () => {
    render(<NotionTabs block={recordMap.block.tabs.value} />)

    const firstTab = screen.getByRole('tab', { name: 'First' })
    const secondTab = screen.getByRole('tab', { name: 'Tab 2' })

    fireEvent.keyDown(firstTab, { key: 'ArrowRight' })
    expect(secondTab).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(secondTab, { key: 'Home' })
    expect(firstTab).toHaveAttribute('aria-selected', 'true')
  })

  it('ignores empty tabs and missing child blocks', () => {
    const { container, rerender } = render(
      <NotionTabs block={{ id: 'empty-tabs', content: [] }} />
    )
    expect(container).toBeEmptyDOMElement()

    rerender(
      <NotionTabs block={{ id: 'missing-tabs', content: ['missing'] }} />
    )
    expect(container).toBeEmptyDOMElement()
    expect(NotionRenderer).not.toHaveBeenCalled()
  })
})
