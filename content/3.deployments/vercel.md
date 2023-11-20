---
title: Vercel
description: 'Deploy your Nuxt Application to Vercel infrastructure.'
componentImg: Vercel
logoSrc: '/assets/integrations/vercel.svg'
category: Hosting
featured: true
nitroPreset: 'vercel'
website: 'https://vercel.com/'
---

::callout
**Zero Configuration ✨**
:br
Integration with Vercel is possible with zero configuration.
::

## Deploy using Git

1. Push your code to your git repository (GitHub, GitLab, Bitbucket).
2. [Import your project](https://vercel.com/new) into Vercel.
3. Vercel will detect that you are using Nitro and will enable the correct settings for your deployment.
4. Your application is deployed!

After your project has been imported and deployed, all subsequent pushes to branches will generate [Preview Deployments](https://vercel.com/docs/concepts/deployments/environments#preview), and all changes made to the Production Branch (commonly “main”) will result in a [Production Deployment](https://vercel.com/docs/concepts/deployments/environments#production).

Learn more about Vercel’s [Git Integration](https://vercel.com/docs/concepts/git).

## Vercel Edge Functions

It is possible to deploy your Nuxt applications directly on [Vercel Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions).

> Vercel Edge Functions allow you to deliver content to your site's visitors with speed and personalization.
> They are deployed globally by default on Vercel's Edge Network and enable you to move server-side logic to the Edge, close to your visitor's origin.
> Edge Functions use the Vercel Edge Runtime, which is built on the same high-performance V8 JavaScript and WebAssembly engine that is used by the Chrome browser.
> By taking advantage of this small runtime, Edge Functions can have faster cold boots and higher scalability than Serverless Functions.
> Edge Functions run after the cache, and can both cache and return responses. [Read More](https://vercel.com/docs/concepts/functions/edge-functions)

In order to enable this target, set the following environment variable:

```bash
SERVER_PRESET=vercel_edge
```

Or update the build command to `nuxt build --preset=vercel_edge`.

## Vercel KV Storage

You can easily use [Vercel KV Storage](https://vercel.com/docs/storage/vercel-kv) with [Nuxt Server Storage](/docs/guide/directory-structure/server#server-storage).

::read-more{to="https://unstorage.unjs.io/drivers/vercel-kv" target="_blank"}
Read more about the Vercel KV driver on Unstorage documentation.
::

1. Install `@vercel/kv` dependency:

    ```bash [Terminal]
    npm i @vercel/kv
    ```

2. Update your `nuxt.config`:

    ```ts [nuxt.config.ts]
    export default defineNuxtConfig({
      nitro: {
        storage: {
          data: {
            driver: 'vercelKV'
            /* Vercel KV driver options */
          }
        }
      }
    })
    ```

::callout
You need to either set `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables or pass `url` and `token` to driver options. Check [driver docs](https://unstorage.unjs.io/drivers/vercel-kv) for more information about usage.
::

You can now access your data store anywhere in your `server/` directory:

```ts [server/routes/hello.ts]
export default defineEventHandler(async (event) => {
  const dataStorage = useStorage('data');
  await dataStorage.setItem('hello', 'world');

  return {
    hello: await dataStorage.getItem("hello"),
  }
})
```

## Custom Build Output Configuration

You can provide additional [build output configuration](https://vercel.com/docs/build-output-api/v3) using `nitro.vercel.config` key inside `nuxt.config`. It will be merged with built-in auto generated config.

## Templates

::card-group
  ::card
  ---
  icon: i-simple-icons-github
  title: Nuxt Vercel ISR
  to: https://github.com/danielroe/nuxt-vercel-isr
  target: _blank
  ui.icon.base: text-black dark:text-white
  ---
  Example of a Nuxt application with hybrid rendering deployed on Vercel.
  ::
  ::card
  ---
  icon: i-simple-icons-github
  title: Nuxt on the Edge on Vercel
  to: https://github.com/pi0/nuxt-on-the-edge
  target: _blank
  ui.icon.base: text-black dark:text-white
  ---
  Example of a Nuxt application running on Vercel Edge Functions.
  ::
::

## Learn More

::read-more{to="https://nitro.unjs.io/deploy/providers/vercel" target="_blank"}
Head over **Nitro documentation** to learn more about On-Demand Incremental Static Regeneration or more advanced options.
::
