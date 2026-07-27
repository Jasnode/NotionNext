# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Blog visitors browse the public site on desktop or mobile and want to discover a worthwhile next book without leaving the author's curation context.

## Product Purpose

NotionNext publishes the author's technology and life writing. The `/book` surface extends the Heo blog with a curated reading library that helps visitors browse recommendations, filter, save, read complete local notes, and continue in WeChat Read.

## Positioning

The library is not a bare list of titles: each book is paired with the author's concise verdict, themes, and distilled insights so visitors can decide why a book may matter before opening it.

## Operating Context

The book library lives at `/book` inside the existing Heo shell. Its source material is the local reading-shelf dataset in `C:\Users\Computer\Desktop\reading`, and its outbound reading destination is `https://weread.qq.com`.

## Capabilities and Constraints

- Preserve the current Heo navigation, footer, theme behavior, and established site configuration.
- Book cards must lead to the corresponding WeChat Read title or a title-specific WeChat Read search fallback.
- The page must work across phone and desktop layouts and remain legible in light and dark modes.
- Category filtering, sorting, favorites, view switching, and other enhancements must remain client-side; no private endpoints, credentials, or management logic may enter the public bundle.
- The current catalog contains 55 books across six categories. Future catalog updates are an open maintenance decision.

## Brand Commitments

The site name, Heo shell, and current blog identity remain intact. The user explicitly offered the local reading shelf and `88lin/mydesign-system` as references while asking the new surface to exceed the original visually.

## Evidence on Hand

- Existing Heo implementation under `themes/heo`.
- Local reading dataset with titles, authors, verdicts, highlights, tags, and chapter insights.
- Public WeChat Read search results and book covers for catalog matching.
- The referenced design system's blue, yellow, and red brand palette and responsive guidance.

## Product Principles

- Curated meaning before catalog volume.
- Immediate discovery through a multi-book recommendation stack and low-friction controls.
- Real book imagery and honest outbound destinations.
- Heo continuity around a distinctive reading experience.
- Local-first preference data with no account requirement.

## Accessibility & Inclusion

Keyboard navigation, visible focus, semantic controls, reduced-motion support, sufficient contrast, and touch targets suitable for mobile are required.
