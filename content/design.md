---
version: alpha
name: Nuxt
description: Nuxt design system, powered by Nuxt UI and Tailwind CSS v4. Dark mode is the default theme.
brand:
  green: "#00DC82"
  black: "#0A0A0A"
  white: "#FFFFFF"
theme:
  font-sans: "'Inter', ui-sans-serif, system-ui, sans-serif"
  font-heading: "'Outfit', var(--font-sans)"
  color-green-50: "#EFFDF5"
  color-green-100: "#D9FBE8"
  color-green-200: "#B3F5D1"
  color-green-300: "#75EDAE"
  color-green-400: "#00DC82"
  color-green-500: "#00C16A"
  color-green-600: "#00A155"
  color-green-700: "#007F45"
  color-green-800: "#016538"
  color-green-900: "#0A5331"
  color-green-950: "#052E16"
semantic-colors:
  primary: green
  neutral: neutral
  important: violet
  secondary: blue
  success: green
  info: blue
  warning: yellow
  error: red
css-variables:
  ui-container: 90rem
  ui-bg-dark: "var(--ui-color-neutral-950)"
  ui-bg-muted-dark: "var(--ui-color-neutral-900)"
  ui-bg-elevated-dark: "var(--ui-color-neutral-900)"
  ui-bg-accented-dark: "var(--ui-color-neutral-800)"
text:
  dimmed: "text-dimmed"
  muted: "text-muted"
  toned: "text-toned"
  default: "text-default"
  highlighted: "text-highlighted"
  inverted: "text-inverted"
background:
  default: "bg-default"
  muted: "bg-muted"
  elevated: "bg-elevated"
  accented: "bg-accented"
  inverted: "bg-inverted"
border:
  default: "border-default"
  muted: "border-muted"
  accented: "border-accented"
  inverted: "border-inverted"
radius:
  base: "var(--ui-radius)"
  utilities: [xs, sm, md, lg, xl, 2xl, 3xl]
components:
  button-primary: 'UButton color="primary"'
  button-secondary: 'UButton color="neutral" variant="subtle"'
  button-ghost: 'UButton variant="ghost"'
  button-error: 'UButton color="error"'
  input: 'UInput'
  container: 'UContainer'
  page-hero: 'UPageHero'
  app-shell: 'UDashboardGroup'
  auth-form: 'UAuthForm'
  error-page: 'UError'
  content: 'ContentRenderer (@nuxt/content)'
---

# Nuxt

Use this file to design or build an official Nuxt surface: nuxt.com, framework and module documentation, templates, and other Nuxt-authored sites built with [Nuxt UI](https://ui.nuxt.com). The tokens in the front matter are the machine-readable source; this body explains how to apply them.

The aesthetic is developer-focused, calm, and confident: true neutral surfaces, Nuxt green as the single accent, and generous whitespace. Build trust through clarity and accurate technical content, never through decoration. Dark mode is the default theme.

## Download logos

Official Nuxt logo, with transparent backgrounds:

- For dark backgrounds: [Green & white SVG](https://nuxt.com/assets/design-kit/logo-green-white.svg) · [PNG](https://nuxt.com/assets/design-kit/logo-green-white.png)
- For light backgrounds: [Green & black SVG](https://nuxt.com/assets/design-kit/logo-green-black.svg) · [PNG](https://nuxt.com/assets/design-kit/logo-green-black.png)
- Icon only: [Green SVG](https://nuxt.com/assets/design-kit/icon-green.svg) · [PNG](https://nuxt.com/assets/design-kit/icon-green.png)
- Everything, including monochrome variants: [nuxt-brand-assets.zip](https://nuxt.com/nuxt-brand-assets.zip)

Prefer SVG for websites. In a header, link the logo home with `aria-label="Nuxt home"` and size it by height (`h-6`, `w-auto`). Follow the color mode by inlining the green & white SVG with its white paths set to `fill="currentColor"` and the SVG given `class="text-highlighted"`: the mountain stays green, and the wordmark turns black or white with the theme. Without inlining, render both files and swap them with `dark:hidden` / `hidden dark:block`.

To name a product such as Nuxt Studio, put the product name in the page title or as plain `font-heading` text beside the logo, separated by spacing. Never edit the SVG to add it.

Never use the wordmark without the mountain symbol, and never recolor, stretch, or redraw the logo. See [/design-kit](https://nuxt.com/design-kit) for every variant and the [Figma brand kit](https://www.figma.com/community/file/1296154408275753939/nuxt-brand-kit) for source files.

## Priority order

When requirements compete, protect them in this order:

1. Accuracy of the content: code samples, versions, APIs, and claims.
2. The host stack: Nuxt, Nuxt UI, and Tailwind CSS v4. Use existing components and tokens before writing new ones.
3. Readability and accessibility: WCAG AA contrast, keyboard access, visible focus.
4. Nuxt identity: the logo, green as the only accent, Outfit headings, Inter body, neutral surfaces.
5. Composition that fits the content, rather than a fixed template.

## Foundation

The system is Nuxt UI on top of Tailwind CSS v4. Brand tokens are declared once with `@theme`; everything else comes from Nuxt UI's semantic tokens:

```css [app/assets/css/main.css]
@import "tailwindcss";
@import "@nuxt/ui";

@theme static {
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-heading: 'Outfit', var(--font-sans);
  --color-green-50: #EFFDF5;
  /* … green-100 through green-950 … */
  --color-green-400: #00DC82;
}

@layer base {
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
    font-weight: var(--font-weight-medium) !important;
  }
}

:root {
  --ui-container: 90rem;
}

.dark {
  --ui-bg: var(--ui-color-neutral-950);
  --ui-bg-muted: var(--ui-color-neutral-900);
  --ui-bg-elevated: var(--ui-color-neutral-900);
  --ui-bg-accented: var(--ui-color-neutral-800);
}
```

```ts [app/app.config.ts]
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'neutral',
      important: 'violet'
    },
    pageHero: {
      slots: {
        container: 'py-10 sm:py-20 lg:py-20',
        title: 'sm:text-6xl'
      }
    }
  }
})
```

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'en' }
    }
  },
  colorMode: {
    preference: 'dark'
  },
  ui: {
    theme: {
      // Nuxt UI only generates the colors listed here; without `important`, color="important" does nothing.
      colors: ['primary', 'secondary', 'info', 'success', 'warning', 'error', 'important']
    },
    // Registers the Prose components on sites without @nuxt/content, such as a landing page with a code snippet.
    prose: true
  }
})
```

Documentation, blogs, changelogs, and any other written content use [Nuxt Content](https://content.nuxt.com): add `'@nuxt/content'` to `modules` (Nuxt UI then registers the Prose and `UContent*` components itself, so drop `prose: true`) and write pages in Markdown:

```ts [content.config.ts]
import { defineCollection, defineContentConfig } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    docs: defineCollection({ type: 'page', source: 'docs/**/*.md' })
  }
})
```

```vue
<!-- app/pages/docs/[...slug].vue -->
<script setup lang="ts">
const route = useRoute()
const { data: page } = await useAsyncData(route.path, () => queryCollection('docs').path(route.path).first())
const { data: navigation } = await useAsyncData('docs-navigation', () => queryCollectionNavigation('docs'))
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}
</script>

<template>
  <!-- inside the Docs shell below -->
  <ContentRenderer :value="page" />
  <!-- table of contents: <UContentToc :links="page?.body?.toc?.links" /> -->
</template>
```

Markdown gets syntax highlighting, heading anchors, and callouts (`::note`, `::tip`, `::warning`, `::caution`) from Nuxt Content. Never hand-write Prose components or table-of-contents arrays in Vue for written content.

Every page sets its own title and description with `useSeoMeta({ title, description })`.

Dark is the default color mode, not a forced one: keep a `UColorModeButton` so visitors can switch. Inter and Outfit need no `<link>` tags; `@nuxt/fonts`, bundled with Nuxt UI, self-hosts them from the `@theme` declarations.

The heading rule lives in a base layer until Nuxt UI ships a heading font token (`--ui-font-heading`). Its `!important` overrides the bold weights Nuxt UI hardcodes on titles, so weight utilities have no effect on headings.

The rule only reaches `h1`–`h6`. Several Nuxt UI components render their title as a `div` (`UAuthForm`, `UPricingPlan`, `UPageCard`, `UAccordion`), so those titles stay in Inter. That is correct for card titles and accordion triggers. When such a title names the page or a section, as on an auth form or a pricing plan, put a real heading in its `#title` slot (`<template #title><h1>Sign In to Nuxt</h1></template>`) so it gets Outfit and a document outline.

## Public tokens

Name tokens by role, never by value or typeface. Use only the tokens below; do not invent, alias, or redeclare them in page code. Extend the system by adding a role to `@theme` or `app.config.ts`, not by hardcoding values.

### Fonts

| Token | Utility | Role |
|-------|---------|------|
| `--font-heading` | `font-heading` | Headings and titles (Outfit) |
| `--font-sans` | `font-sans` | Body copy, labels, controls (Inter) |
| `--font-mono` | `font-mono` | Code, commands, file paths, identifiers |

Set only the identifier in `font-mono`, not the sentence around it.

### Colors

| Semantic | Maps to | Use |
|----------|---------|-----|
| `primary` | `green` | The main action on a view, links, active navigation |
| `neutral` | `neutral` | Text, borders, surfaces, disabled states |
| `important` | `violet` | Rare emphasis badges |
| `secondary` | `blue` | Rare informational accents; not for buttons |
| `success` | `green` | Success states |
| `info` | `blue` | Informational alerts |
| `warning` | `yellow` | Warnings, pending states |
| `error` | `red` | Errors, destructive actions |

Use the `color` prop on Nuxt UI components (`<UButton color="neutral" variant="subtle">`) and semantic utilities in markup. Light mode resolves to `-500` shades, dark mode to `-400`. Keep those shades: do not remap `--ui-primary` or any other semantic color per mode, even to raise contrast. A secondary action is a neutral button (see Components), not a `secondary` one.

Green marks interaction and state: the one primary action in a view, links, active navigation, and the selected item. It never fills large areas. Draw charts, bars, and other data in neutral shades and use primary only to highlight the series or bar that matters. A small chart built from plain elements (`div` bars with semantic colors and a text summary) is fine; do not add a chart library for it. `success` is also green, so give success states an icon and a word ("Ready", "Saved") to keep them from reading as actions.

### Text, surfaces, and borders

| Text | Role | Surface | Role | Border | Role |
|------|------|---------|------|--------|------|
| `text-highlighted` | Headings, emphasis | `bg-default` | Page canvas | `border-default` | Standard |
| `text-default` | Body | `bg-muted` | Subtle grouping | `border-muted` | Dividers |
| `text-toned` | Tertiary | `bg-elevated` | Cards, popovers | `border-accented` | Emphasis |
| `text-muted` | Secondary, captions | `bg-accented` | Hover, active | `border-inverted` | On inverted |
| `text-dimmed` | Disabled, placeholder | `bg-inverted` | Inverted | | |

The dark canvas is `neutral-950` (`#0A0A0A`), deeper than the Nuxt UI default.

### Brand colors

For logos, social images, and print. Do not use them as raw values in UI code.

| Name | Hex | Use |
|------|-----|-----|
| Green | `#00DC82` | Logo, brand accent. Maps to `green-400`. |
| Black | `#0A0A0A` | Dark backgrounds. Maps to `neutral-950`. |
| White | `#FFFFFF` | Text and logos on dark backgrounds. |

## Typography roles

Pick a role, not a size. Equivalent peers always share a role; never resize one item because its text is longer.

| Role | Use | Implementation |
|------|-----|----------------|
| Display | The single page-defining statement on a marketing or listing page | `UPageHero` title (`text-5xl sm:text-6xl` with the `pageHero` override), one step above Section so the hero stays dominant |
| Section | A major turn on a marketing page | `UPageSection` title (`text-3xl sm:text-4xl lg:text-5xl`); its `headline` eyebrow stays primary, as the component sets it |
| Page title | Documentation and content pages | `UPageHeader` title (`text-3xl sm:text-4xl`) |
| Heading | Nested structure in content | Prose `h2` / `h3` / `h4` (`text-2xl` / `text-xl` / `text-lg`) |
| Form title | The title of a focused form, such as sign in | `UAuthForm` title (`text-xl`), as an `h1` in its `#title` slot |
| Panel heading | A group inside an app view: a chart, a list, a settings group | `h2` with `text-lg text-highlighted` |
| Card title | Titles inside peer cards | `UPageCard` title (`text-base`) |
| Metric | A number that is the point of its card: a stat, a price | `font-heading text-3xl text-highlighted tabular-nums`; prices keep the `UPricingPlan` default |
| Lede | One short orientation passage under a title | Hero or section description (`text-lg sm:text-xl text-muted`) |
| Body | Reading text | Prose paragraph (`text-base leading-7`) |
| Label | Compact names, controls, navigation | `text-sm` |
| Caption | Subordinate context for evidence | `text-sm text-muted` or `text-xs text-muted` |

All headings render in Outfit at medium weight. Body copy is regular weight; emphasis is scarce. Rewrite rather than shrink text to make it fit.

Keep reading text near 65 characters per line. In the docs layout, the side columns already set that width, so add no `max-width` to `UPageBody`. Anywhere else, set reading text in a centered `max-w-3xl` column.

## Layout

### Page shells

Every page uses one of the shells below; pick by what the page is for, not how it looks. `UPageHero` and `UPageSection` render their own container, so never wrap them in a `UContainer`; everything else sits in exactly one `UContainer`, which keeps page content aligned with the header. `UPageCTA` is a card: place it inside a `UContainer` or `UPageSection`, or use `class="rounded-none"` for a deliberate full-bleed band. The `UContainer` inside `UPageCTA` only pads the card's content, so wrapping the card in a `UContainer` is not nesting.

**Hero and content** (listings, directories, design kit, team):

```vue
<UPage>
  <UPageHero title="…" description="…" />
  <UPageBody>
    <UContainer>
      <!-- content -->
    </UContainer>
  </UPageBody>
</UPage>
```

**Sections** (landing and pricing pages): `UPageHero` followed by `UPageSection` blocks, with no wrapper container. Pricing plans go in the hero's default slot or the first section, as `UPricingPlans`; the comparison is a `UPricingTable`.

**Docs**: one `UPage` holds the navigation, the header, the body, and the table of contents, so the navigation runs alongside the header:

```vue
<UContainer>
  <UPage>
    <template #left>
      <UPageAside>
        <UContentNavigation :navigation="navigation" />
      </UPageAside>
    </template>
    <UPageHeader title="…" description="…" />
    <UPageBody>
      <!-- content -->
    </UPageBody>
    <template #right>
      <UContentToc :links="page?.body?.toc?.links" />
    </template>
  </UPage>
</UContainer>
```

`UPageAside` is hidden below `lg`, so render the same `UContentNavigation` in the `#body` slot of `UHeader`, which becomes the mobile menu.

**Detail pages** (module and agency pages) keep their header full width above the columns:

```vue
<UContainer>
  <UPageHeader title="…" />
  <UPage>
    <UPageBody>
      <!-- content -->
    </UPageBody>
    <template #right>
      <!-- table of contents, stats, links -->
    </template>
  </UPage>
</UContainer>
```

**Articles** (blog posts): one `UContainer` with a centered `max-w-3xl` column for the header and body. From `xl`, the table of contents sits in a column beside it.

Use a second `UPage` only when content must sit above one column but beside another: deploy pages keep their navigation on the left and their header above the table of contents. A hero page that needs a sidebar places it after the hero: `UPage` > `UPageHero` + `UContainer` > `UPage` with `#left`.

**App** (dashboards, settings, consoles): `UDashboardGroup` > `UDashboardSidebar` + `UDashboardPanel`, with a `UDashboardNavbar` in each panel's `#header` holding the view title. These components size themselves, so use no `UContainer`, `UPage`, or `UPageHeader`, and no hero. The sidebar holds the logo, a vertical `UNavigationMenu`, and account controls; on mobile it opens from the navbar's menu button (the component default). Settings with a few sub-pages can use the docs shell instead, with the navigation in `#left`.

**Focused** (sign in, sign up, password reset, email verification): no site navigation. A full-height page with the logo at the top and one centered `max-w-sm` column holding a `UAuthForm`, or, for status screens without fields, the same title, description, and action.

**Error**: the site header, then `UError` with the error, then the footer.

### Spacing and grid

- **Spacing:** Tailwind's 4px scale. `gap-2` inside a group, `gap-4` between related items. Keep the padding `UPageSection` sets; heroes get `py-10 sm:py-20` from the `pageHero` override in `app.config.ts`.
- **Breakpoints:** Tailwind defaults (`sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px).
- **Radius:** every `rounded-*` utility derives from `--ui-radius`. Controls and cards use `rounded-md` or `rounded-lg`; reserve `rounded-2xl` for large panels.

Give every gap one owner: the parent's `gap` sets spacing, children do not add competing margins.

## Components

Use Nuxt UI primitives. Do not rebuild what exists:

| Pattern | Component |
|---------|-----------|
| Primary action | `<UButton color="primary">` |
| Secondary action | `<UButton color="neutral" variant="subtle">` |
| Tertiary or inline action | `<UButton variant="ghost">` or `variant="link"` |
| Destructive action | `<UButton color="error">` to confirm; `color="error" variant="ghost"` on list rows |
| Form input | `UForm`, `UFormField`, `UInput` |
| Page structure | `UPage`, `UPageHero`, `UPageSection`, `UPageHeader`, `UPageBody` |
| App structure | `UDashboardGroup`, `UDashboardSidebar`, `UDashboardPanel`, `UDashboardNavbar` |
| Content | `ContentRenderer` from `@nuxt/content`, for every docs, blog, or changelog page; a lone code snippet on a marketing page may use `ProsePre` directly |
| Navigation | `UHeader`, `UNavigationMenu`, `UContentNavigation`, `UBreadcrumb` |
| Filters and view switches | `UTabs` with `:content="false"` and `color="neutral"`, `USelect`, `UInput` with a search icon |
| Data | `UTable`, `UBadge` for status |
| Auth and errors | `UAuthForm`, `UError` |
| Empty states | `UEmpty` |
| Pricing | `UPricingPlans`, `UPricingTable` |
| Menus | `UDropdownMenu`, `UContextMenu` |
| Confirmation | `UModal` |

Icons use Lucide (`i-lucide-*`) for interface actions and Simple Icons (`i-simple-icons-*`) for third-party brands. Code-block file icons come from VS Code Icons (`i-vscode-icons-*`), which `ProsePre` uses by default: install `@iconify-json/vscode-icons` alongside the other two sets. Use an icon only when it makes an action or a status faster to recognize. Icons that components ship by default, such as callout and toast icons, stay.

For destructive actions that cannot be undone, such as deleting an account, use a plain section that states the consequences and opens a `UModal`; the solid error button that confirms lives in the modal, and may require typing the resource name. Do not frame the section in a red card.

## Effects and motion

Surfaces are flat. Earn a border or a card only when it communicates grouping, selection, or interaction that spacing cannot express.

Heroes are flat too: no glows, gradients, or background effects on any page. Authored code adds no blurs. The backdrop blur Nuxt UI puts on sticky chrome (`UHeader`, sticky table headers, the mobile table of contents) stays.

Default to stillness. Animate only to explain a state change or confirm an action, keep Nuxt UI's built-in transitions, and honor `prefers-reduced-motion`.

Keep the page still at its edges. Clip horizontal overflow on `html` and `body` so a sideways trackpad swipe never pans the page but still navigates back and forward; use `clip`, not `hidden`, which breaks `position: sticky`. Disable vertical rubber-band overscroll on devices with only a mouse or trackpad (touchscreen laptops count as touch), so sticky chrome such as the header, sidebar, and navbar doesn't bounce on macOS while touch devices keep pull-to-refresh. Never set `overscroll-behavior` on the x axis: it turns off swipe navigation.

```css [app/assets/css/main.css]
html,
body {
  overflow-x: clip;
}

@media (pointer: fine) and (not (any-pointer: coarse)) {
  html {
    overscroll-behavior-y: none;
  }
}
```

## Voice and content

- Title Case for every title and heading: hero, section, page, card, and modal titles, prose headings, labels, buttons, tabs, menu items, and table headers. Capitalize every word except articles, conjunctions, and short prepositions (a, an, the, and, or, by, for, in, of, on, to, with) after the first: `Privacy by Default`, not `Privacy by default`. Titles end without a period.
- Sentence case for descriptions and ledes, body text, helper text, placeholders, toasts, and empty-state messages. Keep code, product names, and user data as written.
- Name actions with a verb and a noun: `Deploy Project`, `Install Module`.
- Write errors as what happened plus what to do next.
- Toasts name the specific thing that changed, with no trailing period and no "successfully".
- Empty states point to the first action.
- In-progress states use a present participle and an ellipsis: `Deploying…`.
- Write placeholder and mock content as if it were real: plausible numbers and clearly fictional names such as Acme or Jane Doe. Never attribute invented quotes, usage, or customer logos to real people or companies. Do not mark content as fictional, illustrative, or sample anywhere in the UI; the person shipping the page replaces it.

## Reject these

- Raw hex values or palette classes (`text-gray-500`) in components instead of semantic tokens.
- Overriding `--ui-primary` or other semantic colors in light or dark mode.
- New tokens named after a value or typeface, such as `--font-outfit` or `--color-dark-navy`.
- Arbitrary font sizes in authored code, or weight utilities on headings. Sizes Nuxt UI components set by default are fine.
- Glows, gradients, gradient text, or blurs added by authored code, on any page, heroes included.
- Cards nested inside cards, or borders used to repair weak hierarchy.
- Icons in colored tiles, decorative icons, or mixed icon sets.
- Tiny muted body text used to make content fit.
- Titles in sentence case or ending with a period.
- State communicated by color alone, or green filling large areas such as charts.
- Re-implemented Nuxt UI components.
- A `UPageHero` or `UPageSection` inside a `UContainer`, or one `UContainer` inside another.
- The wordmark without the mountain, or a recolored, stretched, or redrawn logo.

## Review before shipping

1. **Identity:** Is it unmistakably Nuxt at a glance: logo, green accent, Outfit headings?
2. **Hierarchy:** Is there one dominant element per view, and does every element use a typography role?
3. **Tokens:** Are all colors, fonts, and radii semantic tokens, with no raw values?
4. **Restraint:** Can any border, card, icon, color, or effect be removed without losing meaning? If yes, remove it.
5. **Themes:** Do dark and light modes keep the same hierarchy and contrast?
6. **Access:** Is everything usable by keyboard, with visible focus, labels, and text alternatives?
7. **Reflow:** Does the layout recompose on narrow screens without overflow?

## Resources

- Brand assets: [/design-kit](https://nuxt.com/design-kit) and the [Figma brand kit](https://www.figma.com/community/file/1296154408275753939/nuxt-brand-kit)
- Nuxt UI design system: [ui.nuxt.com/docs/getting-started/theme/design-system](https://ui.nuxt.com/docs/getting-started/theme/design-system)
- Nuxt UI CSS variables: [ui.nuxt.com/docs/getting-started/theme/css-variables](https://ui.nuxt.com/docs/getting-started/theme/css-variables)
