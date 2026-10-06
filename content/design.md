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
  ui-header-height: 112px
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
  prose: 'prose prose-primary dark:prose-invert'
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

Prefer SVG for websites. Never use the wordmark without the mountain symbol, and never recolor, stretch, or redraw the logo. See [/design-kit](https://nuxt.com/design-kit) for every variant and the [Figma brand kit](https://www.figma.com/community/file/1296154408275753939/nuxt-brand-kit) for source files.

## Priority order

When requirements compete, protect them in this order:

1. Accuracy of the content: code samples, versions, APIs, and claims.
2. The host stack: Nuxt, Nuxt UI, and Tailwind CSS v4. Use existing components and tokens before writing new ones.
3. Readability and accessibility: WCAG AA contrast, keyboard access, visible focus.
4. Nuxt identity: the logo, green as the only accent, Outfit headings, Inter body, neutral surfaces.
5. Composition that fits the content, rather than a fixed template.

## Foundation

The system is Nuxt UI on top of Tailwind CSS v4. Brand tokens are declared once with `@theme`; everything else comes from Nuxt UI's semantic tokens:

```css
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

.dark {
  --ui-bg: var(--ui-color-neutral-950);
  --ui-bg-muted: var(--ui-color-neutral-900);
  --ui-bg-elevated: var(--ui-color-neutral-900);
  --ui-bg-accented: var(--ui-color-neutral-800);
}
```

```ts [app.config.ts]
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'neutral',
      important: 'violet'
    }
  }
})
```

The heading rule lives in a base layer until Nuxt UI ships a heading font token (`--ui-font-heading`). Its `!important` overrides the bold weights Nuxt UI hardcodes on titles, so weight utilities have no effect on headings.

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
| `secondary` | `blue` | Secondary actions |
| `success` | `green` | Success states |
| `info` | `blue` | Informational alerts |
| `warning` | `yellow` | Warnings, pending states |
| `error` | `red` | Errors, destructive actions |

Use the `color` prop on Nuxt UI components (`<UButton color="neutral" variant="subtle">`) and semantic utilities in markup. Light mode resolves to `-500` shades, dark mode to `-400`.

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
| Display | The single page-defining statement on a marketing page | `UPageHero` title |
| Section | A major turn on a marketing page | `UPageSection` title (`text-3xl sm:text-4xl lg:text-5xl`) |
| Page title | Documentation and content pages | `UPageHeader` title (`text-3xl sm:text-4xl`) |
| Heading | Nested structure in content | Prose `h2` / `h3` / `h4` (`text-2xl` / `text-xl` / `text-lg`) |
| Card title | Titles inside peer cards | `UPageCard` title (`text-base`) |
| Lede | One short orientation passage under a title | Hero or section description (`text-lg sm:text-xl text-muted`) |
| Body | Reading text | Prose paragraph (`text-base leading-7`) |
| Label | Compact names, controls, navigation | `text-sm` |
| Caption | Subordinate context for evidence | `text-sm text-muted` or `text-xs text-muted` |

All headings render in Outfit at medium weight. Body copy is regular weight; emphasis is scarce. Keep prose near 65 characters per line, and rewrite rather than shrink text to make it fit.

## Layout

- **Container:** `UContainer`, max width `--ui-container: 90rem`.
- **Spacing:** Tailwind's 4px scale. `gap-2` inside a group, `gap-4` between related items, `py-10 sm:py-20` for sections, `py-24 sm:py-32 lg:py-40` for heroes.
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
| Destructive action | `<UButton color="error">` |
| Form input | `UInput`, `UFormField` |
| Page structure | `UPage`, `UPageHero`, `UPageSection`, `UPageHeader`, `UPageBody` |
| Content | `ContentRenderer` with prose components |
| Navigation | `UHeader`, `UNavigationMenu`, `UContentNavigation` |
| Menus | `UDropdownMenu`, `UContextMenu` |

Icons use Lucide (`i-lucide-*`) for interface actions and Simple Icons (`i-simple-icons-*`) for third-party brands. Use an icon only when it makes an action faster to recognize.

## Effects and motion

Surfaces are flat. Earn a border or a card only when it communicates grouping, selection, or interaction that spacing cannot express.

The green hero glow (`HeroBackground`, enabled per page with the `heroBackground` page meta) is reserved for marketing page heroes. Documentation and product interfaces use no glows, gradients, or blurs.

Default to stillness. Animate only to explain a state change or confirm an action, keep Nuxt UI's built-in transitions, and honor `prefers-reduced-motion`.

## Voice and content

- Title Case for labels, buttons, titles, and tabs; sentence case for body and helper text.
- Name actions with a verb and a noun: `Deploy Project`, `Install Module`.
- Write errors as what happened plus what to do next.
- Toasts name the specific thing that changed, with no trailing period and no "successfully".
- Empty states point to the first action.
- In-progress states use a present participle and an ellipsis: `Deploying…`.

## Reject these

- Raw hex values or palette classes (`text-gray-500`) in components instead of semantic tokens.
- New tokens named after a value or typeface, such as `--font-outfit` or `--color-dark-navy`.
- Arbitrary font sizes, or weight utilities on headings.
- Glows, gradients, gradient text, or blurs outside marketing heroes.
- Cards nested inside cards, or borders used to repair weak hierarchy.
- Icons in colored tiles, decorative icons, or mixed icon sets.
- Tiny muted body text used to make content fit.
- State communicated by color alone.
- Re-implemented Nuxt UI components.
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
