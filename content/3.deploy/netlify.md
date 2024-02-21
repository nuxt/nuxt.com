---
title: Netlify
description: 'Deploy your Nuxt Application to Netlify infrastructure.'
componentImg: Netlify
logoIcon: 'i-logos-netlify-icon'
category: Hosting
featured: true
nitroPreset: 'netlify'
website: https://www.netlify.com/
---

::tip
**Zero Configuration ✨**
:br
Integration with Netlify is possible with zero configuration.
::

## Setup

Nuxt will auto-detect that you are in a [Netlify](https://www.netlify.com) build environment and build an optimized version of your server.

For new sites, Netlify will detect that you are using Nuxt 3 and set the publish directory to `dist` and build command to `npm run build`.

::note
If you are upgrading an existing site from Nuxt 2 you should check these and update them if needed.
::

If you want to add custom redirects, you can do so with [`routeRules`](/docs/guide/concepts/rendering#hybrid-rendering) or by adding a [`_redirects`](https://docs.netlify.com/routing/redirects/#syntax-for-the-redirects-file) file to your `public` directory.

::tip{color="green" icon="i-ph-check-circle-duotone"}
For deployment, just push to your git repository [as you would normally do for Netlify](https://docs.netlify.com/configure-builds/get-started/).
::

## Netlify Edge Functions

::read-more{to="https://www.netlify.com/blog/announcing-serverless-compute-with-edge-functions" target="_blank"}
Netlify Edge Functions use Deno and the powerful V8 JavaScript runtime to let you run globally distributed functions for the fastest possible response times.
::

Set the following environment variable to run Nuxt on Edge Functions:

```bash
SERVER_PRESET=netlify_edge
```

## On-demand Builders

On-demand Builders are serverless functions used to generate web content as needed that’s automatically cached on Netlify’s Edge CDN.

They enable you to build pages for your site when a user visits them for the first time and then cache them at the edge for subsequent visits until the next deployment.

::read-more{to="https://docs.netlify.com/configure-builds/on-demand-builders/" target="_blank"}
Read More about Netlify on-demand builders
::

Set the following environment variable to enable on-demand builders:

```bash
SERVER_PRESET=netlify_builder
```

::read-more{to="https://nitro.unjs.io/deploy/providers/netlify" target="_blank"}
Head over **Nitro documentation** to learn more about the netlify deployment preset.
::
