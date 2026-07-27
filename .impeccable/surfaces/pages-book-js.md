---
version: 1
slug: 'pages-book-js'
primary_target: 'pages/book.js'
related_targets:
  [
    'themes/heo/index.js',
    'themes/heo/components/Book/index.js',
    'themes/heo/components/Book/styles.module.css'
  ]
---

# Book Library Surface

## Scope and Mode

- Primary target: `pages/book.js`
- Related target: `themes/heo/components/Book/index.js`
- Visitor mode: Experience with operate-level browsing controls.

## Audience and Job

Blog visitors want to discover a book through the author's curation, browse a 55-book catalog by category, and continue reading on WeChat Read. The page should reward open exploration without making repeat visits inefficient.

## Content and Action

Real book covers, authors, verdicts, tags, highlights, chapter notes, explanations, and examples lead. The primary action opens the author's complete local reading notes; continuing to the corresponding title in WeChat Read is a distinct secondary action. Eight stacked recommendations, six category paths, sorting, local favorites, view switching, random discovery, copyable insights, previous/next navigation, and a cross-book idea index support exploration.

## Chosen Direction

**Annotated Reading Archive.** A compact archive introduction sits beside eight regularly offset recommendations that advance with edge controls or a vertical phone gesture. Below it, generously rounded horizontal book records make the verdict and available note count immediately scannable. Opening a record reveals a focused reading sheet with a mostly single-screen identity rail, representative insight, full highlights, chapter-level ideas, explanations, examples, and a separate WeChat Read action. The cross-book view exposes 36 themes with direct written viewpoints in a six-tone directory, using a complete three-column panel on desktop and a two-row horizontal track on phones.

## Memorable Moment

The first recommendation stays in place while the next two books remain visibly stacked behind it; changing the recommendation feels like handling one compact deck rather than scrolling through another shelf. The visible card action then opens the complete body of writing that existed in the original shelf.

## Constraints

- Keep the existing Heo header, footer, global dark-mode behavior, and configuration intact.
- Enter the theme through Heo's `LayoutBook`; the route must settle to one `theme-heo` root and one 55-book catalog after hydration.
- Mobile rearranges the composition into horizontal book rows and a full-height rounded reading sheet; it does not hide note content.
- Book card activation opens local notes. Only the explicitly labeled external action leads to WeChat Read.
- Preserve all 55 books, 129 chapters, 295 insights, examples, keywords, and 94 cross-book relations from the local reading source.
- Favor real imagery, stable cover proportions, visible focus, reduced-motion behavior, and fast client-side category filtering.
- Do not ship credentials, external AI calls, fabricated matches, or local management logic.

## Unresolved Decisions

- The long-term source and update workflow for future books remains open.
