---
title: Render
description: 'Deploy your Nuxt Application to Render infrastructure.'
logoSrc: '/assets/integrations/render.png'
category: Hosting
nitroPreset: true
---

Nuxt supports deploying on [Render](https://render.com/) with minimal configuration.

## Set up application

1. [Create a new Web Service](https://dashboard.render.com/select-repo?type=web) and select the repository that contains your code.
2. Ensure the 'Node' environment is selected.
3. Depending on your package manager, set the build command to `yarn && yarn build`, `npm install && npm run build`, or `pnpm i --shamefully-hoist && pnpm build`.
4. Update the start command to `node .output/server/index.mjs`
5. Click 'Advanced' and add the following environment variables
    ```bash
    SERVER_PRESET=render_com
    NODE_VERSION=20
    ```
6. Click on `Create Web Service`.

## More options

::read-more{to="https://nitro.unjs.io/deploy/providers/render" target="_blank"}
Head over **Nitro documentation** to learn more about the Render deployment presets.
::
