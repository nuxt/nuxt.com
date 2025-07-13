---
title: Cloudflare
description: 'Deploy your Nuxt Application to Cloudflare infrastructure.'
logoSrc: '/assets/integrations/cloudflare.svg'
category: Hosting
nitroPreset: 'cloudflare'
website: 'https://pages.cloudflare.com/'
---

## Cloudflare Pages

::tip
**Zero Configuration ✨**
:br
Integration with Cloudflare Pages is possible with zero configuration, [learn more](https://nitro.unjs.io/deploy#zero-config-providers).
::

::important
Checkout the [@nuxthub/core](/modules/hub) module to build full-stack Nuxt applications with Cloudflare, learn more on [hub.nuxt.com](https://hub.nuxt.com).
::

### Git Integration

If you use the GitHub/GitLab integration with Cloudflare Pages, **no configuration is required**. Pushing to your repository will automatically build your project and deploy it.

::note
Nuxt will detect the environment to set the correct [Server/Nitro preset](https://nitro.unjs.io/deploy/providers/cloudflare).
::

To leverage server-side rendering on the edge, set the build command to: `nuxt build`

To statically generate your website, set the build command to: `nuxt generate`

### Route matching

On CloudFlare Pages, if an HTML file is found with a matching path to the current route requested, it will serve it. It will also redirect HTML pages to their extension-less counterparts: for instance, `/contact.html` will be redirected to `/contact`, and `/about/index.html` will be redirected to `/about/`.

To match Cloudflare [route matching](https://developers.cloudflare.com/pages/configuration/serving-pages/#route-matching) rules, set the nitro option `autoSubfolderIndex` to `false`.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    prerender: {
      autoSubfolderIndex: false
    }
  }
})
```

### Direct Upload

Alternatively, you can use [wrangler](https://github.com/cloudflare/workers-sdk) to upload your project to Cloudflare.

In this case, you will have to set the preset manually.

1. Build your project for Cloudflare Pages:

    ```bash [Terminal]
    npx nuxi build --preset=cloudflare_pages
    ```

2. Deploy, it will ask you to create a project for the first time:

    ```bash [Terminal]
    npx wrangler pages deploy dist/
    ```

## Learn more

::read-more{to="https://nitro.unjs.io/deploy/providers/cloudflare" target="_blank"}
Head over **Nitro documentation** to learn more about the Cloudflare deployment preset.
::

::read-more{to="https://developers.cloudflare.com/pages/framework-guides/deploy-a-nuxt-site/#use-bindings-in-your-nuxt-application" target="_blank"}
Head over **CloudFlare Pages** documentation to learn more about it.
::

## Templates

::card-group
  ::card
  ---
  icon: i-simple-icons-github
  title: Atidone
  to: https://github.com/atinux/atidone
  target: _blank
  ui.icon.base: text-black dark:text-white
  ---
  A todos application with user authentication, SSR and Cloudflare D1.
  ::
  ::card
  ---
  icon: i-simple-icons-github
  title: Atinotes
  to: https://github.com/atinux/atinotes
  target: _blank
  ui.icon.base: text-black dark:text-white
  ---
  An editable website with universal rendering based on Cloudflare KV.
  ::
  ::card
  ---
  icon: i-simple-icons-github
  title: Atidraw
  to: https://github.com/atinux/atidraw
  target: _blank
  ui.icon.base: text-black dark:text-white
  ---
  Web application that lets you to draw and share your drawings with the world, with Cloudflare R2 & AI.
  ::
  ::card
  ---
  icon: i-simple-icons-github
  title: Nuxt Image Gallery
  to: https://github.com/flosciante/nuxt-image-gallery
  target: _blank
  ui.icon.base: text-black dark:text-white
  ---
  An image gallery to upload, edit and share your images to the world, with Cloudflare R2.
  ::
::

## Learn more

::read-more{to="https://nitro.unjs.io/deploy/providers/cloudflare" target="_blank"}
Head over **Nitro documentation** to learn more about the cloudflare deployment preset.
::
