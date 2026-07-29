---
title: LOLIPOP! Deploy Now
description: 'Deploy your Nuxt Application to LOLIPOP! Deploy Now.'
logoSrc: '/assets/integrations/lolipop-deploy-now.svg'
category: Hosting
nitroPreset: 'node-server'
website: 'https://lolipop.jp/deploy-now/'
---

Nuxt supports deploying on [LOLIPOP! Deploy Now](https://lolipop.jp/deploy-now/) with minimal configuration.

LOLIPOP! Deploy Now is a hosting service by GMO Pepabo.

## Deploy using the CLI

1. Install the CLI.

    ```bash [Terminal]
    npm install -g lolipop
    ```

2. From your Nuxt project root, create the project and deploy it.

    ```bash [Terminal]
    lolipop deploy --name my-app --framework nuxt
    ```

    The first run opens a browser to sign in.

3. Your app is served at `https://<name>.lolipop-now.app`.

Running `lolipop deploy` again from the same directory ships a new version.

## Build settings

Selecting the `nuxt` framework applies the defaults below, so a plain Nuxt project deploys as-is.

| Setting | Default |
| --- | --- |
| Install command | `npm ci --ignore-scripts` |
| Build command | `npm run build` |
| Output directory | `.output` |

Dependencies are installed with `npm ci`, so `package-lock.json` must be committed.

For a monorepo, point the build root at your app.

```bash [Terminal]
lolipop deploy --name my-app --framework nuxt --root apps/web
```

## Notes

- Keep the default Nitro preset. The runtime starts `.output/server/index.mjs`, which the `node-server` preset produces.
- `@nuxt/image` requires v2 or later.
- `useStorage` with the `fs` driver is not supported. Use an external data store for anything that must persist.
- `routeRules` `isr` is not supported. Use `swr` instead.

::read-more{to="https://deploy.lolipop.jp/docs/frameworks/nuxt" target="_blank"}
For more information, refer to the **LOLIPOP! Deploy Now documentation**.
::
