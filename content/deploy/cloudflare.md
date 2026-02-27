---
title: Cloudflare
description: 'Deploy your Nuxt Application to Cloudflare infrastructure.'
logoSrc: '/assets/integrations/cloudflare.svg'
category: Hosting
nitroPreset: 'cloudflare'
website: 'https://pages.cloudflare.com/'
---

## Cloudflare Workers

::tip
**Zero Configuration ✨**
:br
Integration with Cloudflare Pages is possible with zero configuration, [learn more](https://nitro.unjs.io/deploy#zero-config-providers).
::

Cloudflare Workers supports [static assets](https://developers.cloudflare.com/workers/static-assets/), making it easy to deploy a Nuxt application. You can learn more about it on the [Cloudflare documentation](https://developers.cloudflare.com/workers/frameworks/framework-guides/nuxt/).

::note
You must set a compatibility date to `2024-09-19` or later in both `nuxt.config.ts` and `wrangler.toml`/`wrangler.json`.
Checkout the [Nitro documentation](https://nitro.build/deploy/providers/cloudflare#cloudflare-module-workers) for the `cloudflare_module` preset.
:: 

### Deploy With Wrangler

You can use [Wrangler](https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler) to deploy your project to Cloudflare.

1. Configure Nitro in `nuxt.config.ts` with the following configuration :

```ts
export default defineNuxtConfig({
  compatibilityDate: "2025-03-01",
  nitro: { cloudflare: { nodeCompat: true, deployConfig: true } }
});
```

By setting `deployConfig: true`, Nitro will automatically generate a `wrangler.json` that points to the correct build outputs.
If you need to add [Cloudflare Workers configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), such as bindings, you can either:

- Set these in your Nuxt config under the `cloudflare: { wrangler : ... }` key. This has the same type as `wrangler.json`.
- Provide your own `wrangler.jsonc`. Nitro will automatically set the `main` and `assets.directory` keys to the correct build output.

```json [wrangler.jsonc]
{
	"$schema": "https://unpkg.com/wrangler@latest/config-schema.json",
  // Add your workers configuration here.
  "observability": {
    "enabled": true,
    "head_sampling_rate": 0.1
  }
}
```

2. Build your project for Cloudflare Workers:

    ```bash [Terminal]
    npx nuxi build --preset=cloudflare_module
    ```

3. Deploy with Wrangler:

    ```bash [Terminal]
    wrangler deploy
    ```

::tip 
While developing your project with `nuxi dev`, [nitro-cloudflare-dev](https://github.com/nitrojs/nitro-cloudflare-dev) will provide access to local simulators of Cloudflare bindings. It is an experimental module.
You can use it by adding `modules: ["nitro-cloudflare-dev"]` to your nuxt config.
::
### Automatic Deploy With Git

If you're using GitHub or GitLab, Cloudflare workers has an integration to automatically deploy your project. 

::note
Checkout the [Workers Build](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/) documentation for the Git Integration.
::

::important
[Workers Build](https://developers.cloudflare.com/workers/ci-cd/builds/) is in Beta.
::


### Advanced Configuration 

While the default configuration should work for most usecases, we provide ways to tailor the deployment to your needs.

#### Custom Wrangler Configuration

It is recommended to provide a cloudflare option to nitro, but not strictly necessary.
You might have some advanced usecase where you want to process the Nitro output further before deploying it, or you might prefer manually manage the wrangler configuration.

In this case, you can write your own `wrangler.jsonc` entirely.
You will have to set the `main` and `assets` keys manually, based on Nitro output and your own processing.

::important
However, Nitro output format must be respected. It is possible that these will change in future versions, so be careful when upgrading Nitro or Nuxt.
::

#### Custom Entry Point

In some (rare) cases, you might want to customize the worker entry point. For instance, there might be some new Cloudflare Workers features that you want to use, or you might want to deviate from the default behavior.
You can even go further and completely customize the worker entry point. Refer to Nitro documentation on [how to create a custom preset](https://nitro.build/deploy/custom-presets).

## Cloudflare Pages

::tip
**Zero Configuration ✨**
:br
Integration with Cloudflare Pages is possible with zero configuration, [learn more](https://nitro.unjs.io/deploy#zero-config-providers).
::

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

### Git Integration

If you use the GitHub/GitLab integration with Cloudflare Pages, **no configuration is required**. Pushing to your repository will automatically build your project and deploy it.

::note
Nuxt will detect the environment to set the correct [Server/Nitro preset](https://nitro.unjs.io/deploy/providers/cloudflare).
::

To leverage server-side rendering on the edge, set the build command to: `nuxt build`

To statically generate your website, set the build command to: `nuxt generate`

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

::important
Checkout the [@nuxthub/core](/modules/hub) module to build full-stack Nuxt applications with Cloudflare, learn more on [hub.nuxt.com](https://hub.nuxt.com).
::

::read-more{to="https://nitro.unjs.io/deploy/providers/cloudflare" target="_blank"}
Head over **Nitro documentation** to learn more about the Cloudflare deployment preset.
::

::read-more{to="https://developers.cloudflare.com/workers/static-assets/compatibility-matrix/" target="_blank"}
To chose between Workers and Pages, look at the compatibility matrix. In the future Workers will be the preferred way to deploy application on cloudflare.
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
