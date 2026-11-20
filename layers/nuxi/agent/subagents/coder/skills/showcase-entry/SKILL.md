---
description: Add or update a website on the nuxt.com showcase (/showcase) as a complete entry, with its screenshot and logo. Load it before touching `content/showcase.yml` or anything under `public/assets/websites/`.
---

A showcase tile needs three things, and a pull request that has all three is ready to merge. Produce all three yourself.

1. An entry in `websites` in `content/showcase.yml`.
2. A screenshot at `public/assets/websites/<slug>.webp`, shown when the tile is hovered.
3. A logo at `public/assets/websites/logos/<slug>.svg`, shown on the tile.

`<slug>` comes from `name`: drop every character that is not a letter or a digit, then kebab-case what is left, which splits on capitals. `World Triathlon` gives `world-triathlon`, `GitLab` gives `git-lab`, `McDonald's France` gives `mc-donalds-france`. The site finds both files by this slug only, so a wrong slug shows an empty tile. Compare yours with the file names already in `public/assets/websites/`.

## Before you start

- Read `content/showcase.yml`. If the site is already listed, update its entry instead of adding one.
- Confirm the site runs Nuxt: open it with `browser__open` and check for `__NUXT_DATA__`, `window.__NUXT__` or `#__nuxt` with `browser__eval`, or use the nuxt.fyi link from the request. If it does not, stop and reply with what you found.

## The entry

```yaml
  - name: World Triathlon
    url: https://triathlon.org/
    industry: Travel & Leisure
    logo:
      width: 232
      height: 24
```

- Add it at the end of `websites`, and leave the other entries untouched.
- `industry` is one of the values under `wall.filters`. Pick the one that sites of the same kind already use, and name the runner-up in the pull request when it is close.
- `logo.width` and `logo.height` are the two last numbers of the logo's `viewBox`.
- Add `screenshotOptions` only with the options the screenshot needed (see below).

## The screenshot

Call `capture_screenshot` with `name: <slug>`, the site's `url` and the default viewport. It returns the frame: look at it.

The frame is good when it shows the site's own homepage, above the fold, with nothing on top of it. Fix what is in the way and capture again:

- A cookie banner, a chat bubble, an accessibility widget, a newsletter popup: pass their selectors in `hideElements`. Find them with `browser__eval`, for example by listing the fixed-position elements of the page. A consent cookie in `cookies` also works when you can find its name. When a widget is still in the next frame, its children override `visibility`: pass the same selector in `removeElements`.
- A carousel or a video that has not loaded, or an entrance animation caught halfway: raise `delay`.
- A splash screen or a country selector that needs a click: pass the click in `scripts`.
- A bot challenge or an error page instead of the site: you can't capture it. Don't commit that frame.

When the frame is clean, write the options that got you there into the entry's `screenshotOptions`, with the same names (`cookies`, `hideElements`, `removeElements`, `scripts`, `delay`), so a person can regenerate the image later.

Commit it with `commit_assets`, from `/workspace/captures/<slug>.webp` to `public/assets/websites/<slug>.webp`. It takes 1 MB at most: when the capture's `bytes` is higher, capture again with a lower `quality`, such as 60.

## The logo

The tile uses the logo as a mask and paints it in one colour. Only its shape counts: its own colours are ignored, and anything opaque shows as a solid block.

- Take the logo the site publishes. On most sites it is an inline `<svg>` in the header: get its markup with `browser__eval`, such as `document.querySelector('header svg').outerHTML`. When the header uses `<img src="….svg">`, read that file with `web_fetch`. A press or brand page is the next place to look.
- Never draw a logo, trace one from a raster image, or take one from a third-party logo site.
- Clean the markup: keep `xmlns` and `viewBox` on the root, and remove `width`, `height`, scripts and comments. Remove an `id` only when nothing in the file references it, such as `href="#mark"` or `url(#mark)`. Remove a background rectangle. If it has no `viewBox`, build it from its `width` and `height`.
- Remove `class` and `style` last, and first write what they do to the shape as attributes on the same element: `fill="none"`, `stroke`, `stroke-width`, `stroke-linecap`, `stroke-linejoin`, `fill-rule` and `clip-rule`. Without them, a logo drawn as an outline becomes a filled block. Delete an element they hide with `display: none`, `visibility: hidden` or `opacity: 0`. For an inline `<svg>`, a class gets its rules from the site's stylesheet: read the values with `getComputedStyle` in `browser__eval`.
- It can't work as a mask when it has a raster `<image>`, references another file, or relies on two colours to be readable, such as white text on a coloured block. Look for a one-colour version on the site.

Look at the cleaned logo before you commit it. With `browser__eval` on the site's page, cover the page with a dark `position: fixed` box that holds one element with a white background and `mask: url("data:image/svg+xml,…") center/contain no-repeat`, where the URL is the cleaned markup through `encodeURIComponent`. The tile draws the logo the same way. Call `capture_screenshot` without `url` and compare the shape with the logo in the site's header. A solid block, an empty box or a missing part means the cleaning broke the logo: fix the markup and look again. When the box is empty for the site's original markup too, the page refuses `data:` images: do the same on another public page, such as `https://example.com/`.

Commit the SVG with `github__editFiles`; it is text.

## The pull request

- One branch, `nuxi/showcase-<slug>`, and a title such as `feat(showcase): add World Triathlon`.
- In the body: what the site is in one sentence, the Nuxt evidence with its link, why you picked the `industry`, and the screenshot. Show the screenshot by publishing the same capture with `publish_media` and pasting its Markdown.
- Open it ready for review when the three parts are in. Open it as a draft only when you tried and could not produce one of them, and say in the body which one, what you tried, and what a person needs to add. A draft is not the default for a task you did not finish trying.
