---
name: NotionNext Heo
description: A bright, personal blog system with crisp blue interaction, warm accents, and responsive reading surfaces.
colors:
  primary-blue: '#2B7FD8'
  heo-blue: '#3A86FF'
  highlight-yellow: '#F4D758'
  accent-red: '#E84A5F'
  page-light: '#F7F9FE'
  surface-light: '#FFFFFF'
  text-light: '#363636'
  page-dark: '#17191D'
  surface-dark: '#21232A'
  text-dark: 'rgba(255,255,255,0.88)'
  book-ink: '#19263A'
  hero-dark: '#214F7D'
  hero-label-ink: '#1D4772'
  highlight-ink: '#172844'
  action-ink: '#173455'
  dark-action-ink: '#14263B'
  shelf-edge: '#173C64'
  external-ink: '#1C3D61'
  favorite-ink: '#315371'
  paper: '#F7F2E8'
  paper-raised: '#F8F4E8'
  cover-blue: '#E7EFF8'
  cover-blue-dark: '#303845'
  cover-yellow: '#FBF1BA'
  cover-yellow-dark: '#4B4529'
  cover-pink: '#F8D9DF'
  cover-pink-dark: '#493139'
  cover-green: '#DCEFE7'
  cover-green-dark: '#263F36'
  cover-violet: '#E9E0F4'
  cover-violet-dark: '#3D3448'
  cover-rose: '#F4DFEB'
  cover-rose-dark: '#493341'
  hero-action-shadow: 'rgba(18,47,78,0.2)'
  shelf-shadow: 'rgba(16,45,76,0.32)'
  stage-shadow: 'rgba(22,59,95,0.26)'
  category-flag: 'rgba(24,38,58,0.84)'
  favorite-border: 'rgba(36,67,105,0.14)'
  favorite-shadow: 'rgba(24,42,72,0.12)'
  switch-shadow: 'rgba(31,66,106,0.1)'
typography:
  scale:
    micro: '0.62rem'
    tiny: '0.68rem'
    detail: '0.7rem'
    label-xs: '0.72rem'
    label-sm: '0.75rem'
    meta: '0.78rem'
    status: '0.8rem'
    control-sm: '0.84rem'
    copy-sm: '0.86rem'
    copy-compact: '0.9rem'
    control: '0.92rem'
    control-relaxed: '0.93rem'
    copy: '0.98rem'
    body: '1rem'
    card-title-compact: '1.08rem'
    statement-compact: '1.28rem'
    card-title: '1.3rem'
    footer-compact: '1.4rem'
    empty-title: '1.45rem'
    statement-tablet: '1.48rem'
    footer: '1.62rem'
    statement: '1.72rem'
    section-compact: '2rem'
    section-tablet: '2.3rem'
    section: '2.7rem'
    hero-phone: '3.15rem'
    hero-tablet: '4rem'
    hero-compact-desktop: '4.2rem'
    hero-desktop: '4.8rem'
    hero-wide: '5.6rem'
  display:
    fontFamily: 'Bitter, Noto Serif SC, SimSun, serif'
    fontSize: 'clamp(2.5rem, 6vw, 5.25rem)'
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: 'normal'
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, PingFang SC, Segoe UI, Microsoft YaHei, LXGW WenKai, sans-serif'
    fontSize: '1rem'
    fontWeight: 500
    lineHeight: 1.7
    letterSpacing: 'normal'
rounded:
  micro: '5px'
  tag: '6px'
  control: '8px'
  card: '12px'
  panel: '16px'
  full: '999px'
spacing:
  xs: '8px'
  sm: '12px'
  md: '20px'
  lg: '32px'
  xl: '48px'
components:
  button-primary:
    backgroundColor: '{colors.primary-blue}'
    textColor: '{colors.surface-light}'
    rounded: '{rounded.control}'
    padding: '10px 16px'
  card:
    backgroundColor: '{colors.surface-light}'
    textColor: '{colors.text-light}'
    rounded: '{rounded.card}'
    padding: '20px'
---

# Design System: NotionNext Heo

## Overview

**Creative North Star: "The Curious Personal Library"**

Heo is an optimistic personal publishing system: cool, open page fields carry clear content surfaces, while saturated blue interaction and occasional warm accents make the author's presence recognizable. New routes inherit the navigation and footer but may develop a subject-specific composition between them.

The system should feel authored rather than templated. Dense tools stay easy to scan; expressive moments come from real content, scale contrast, and one purposeful interaction rather than decorative glass or generic effects.

**Key Characteristics:**

- Clear blue actions on pale, breathable page fields.
- Warm yellow and red used sparingly for emphasis and personality.
- Compact controls paired with generous content composition.
- Light and dark treatments designed as equal states.

## Colors

The palette joins Heo's cool page fields with the referenced personal brand's blue, yellow, and red.

**The Three-Color Rule.** Blue carries interaction, yellow marks discovery, and red stays a rare accent; decorative multi-color gradients do not replace content.

## Typography

Display moments may use the existing Bitter and Chinese serif stack, while interface text remains in the configured system and CJK sans stack. Large type is reserved for route-defining moments; compact panels and controls use clear, restrained hierarchy.

The enumerated scale includes the `/book` surface's responsive display steps and compact metadata sizes. Those fine steps belong to one component system: they may not be copied into unrelated themes as a generic typography ramp.

**The Mixed Voice Rule.** Serif type identifies authored reading moments, while sans serif type handles actions, filters, metadata, and long body copy.

## Layout

The Heo shell caps primary content near 86rem and uses responsive horizontal padding. New feature routes may expand within that boundary. Desktop compositions can be asymmetrical, but mobile is deliberately reordered into one reading flow rather than proportionally shrunk. Stable grid tracks and aspect ratios prevent cover loading or dynamic labels from shifting the layout.

## Elevation & Depth

Surfaces are flat at rest or separated with a light structural border. A soft offset shadow appears on interactive lift and focused overlays; borders and heavy shadows are not stacked on the same surface.

**The Responsive Depth Rule.** Elevation communicates interaction state, never generic decoration.

## Shapes

Controls use compact 8px corners, content cards use 12px corners, and larger focused panels may use 16px corners. Pills are reserved for filters, statuses, and short mode controls. Cover artwork keeps its own rectangular book proportions.

## Components

### Buttons

Primary buttons use brand blue with high-contrast text. Icon controls use familiar symbols with tooltips and visible focus states. Hover and active movement remains small and quick.

### Chips

Filter chips are compact pills with a quiet unselected state and an unmistakable selected fill. Their width remains content-driven.

### Cards / Containers

Cards frame one book or one focused tool, never another card. Book covers and substantive copy lead; metadata supports. Hover may lift the book as a physical object while reduced-motion users receive a color or shadow state only.

### Inputs / Fields

Inputs use a light surface, quiet boundary, and blue focus ring. Placeholder text remains readable in both themes.

### Navigation

The existing Heo header and mobile drawer remain the global authority. Route-local controls stay below it and become sticky only when that materially improves browsing.

## Book Library Surface

The `/book` route enters Heo through `LayoutBook`, preserving the global header, footer, theme state, and full-width shell without duplicating the theme root.

- The first viewport is a compact annotated archive: authored copy sits beside eight real recommendations arranged as a regular side-spine deck. Previous/next controls and a compact position count sit above the deck, while vertical phone gestures turn the same stack without adding instructional copy.
- Catalog records use a Heo-scale `24px` radius, a stable horizontal cover-and-copy composition, and one soft elevation. Category-specific color carries from filters into card tags, while WeChat Read and favorite actions remain separate, labeled controls in the footer.
- The filter deck stays in normal document flow at every breakpoint. Categories remain horizontally scrollable; sorting, favorites, and view controls share one compact row without a search field or result-count strip.
- The detail experience uses a `28px` reading sheet. Its identity rail restores a substantial cover, complete verdict and tags, a real representative insight, and a bottom-aligned WeChat Read action while still fitting within one desktop viewport without independent scrolling. The reading column preserves highlights, chapters, arguments, explanations, examples, keywords, and copy controls.
- The idea index replaces an inaccessible force-graph-only workflow with a six-tone topic directory backed by the same 295 insights and 94 relationships. Desktop presents all 36 themes that contain direct written viewpoints without an internal scrollbar; phones adapt the same complete set into a two-row horizontal track above the reading path.
- Dark mode uses neutral charcoal surfaces and warm text, then keeps psychology blue, growth gold, literature teal, business green, design violet, and feminism rose distinct. All controls retain visible focus, touch targets, readable contrast, and reduced-motion behavior.

## Do's and Don'ts

### Do:

- **Do** use real book covers and stable book proportions where available.
- **Do** preserve the Heo shell and make route-local expression live inside it.
- **Do** design all interactive states for keyboard, touch, light, and dark contexts.

### Don't:

- **Don't** use nested cards, generic icon-card page scaffolds, or decorative glass panels.
- **Don't** make every section centered or every book card the same visual beat.
- **Don't** expose private API configuration or fabricate book metadata when a source lookup fails.
