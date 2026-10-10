---
title: Pethost
description: 'Deploy your Nuxt Application to Pethost.'
logoSrc: '/assets/integrations/pethost.svg'
category: Hosting
nitroPreset: 'node-server'
website: 'https://pethost.dev/'
---

[Pethost](https://pethost.dev) builds Nuxt applications from source and runs them as a Node.js server, over HTTPS.

## Setup

1. Install the [Pethost CLI](https://pethost.dev/docs/cli/).

2. From the root of your project, run:
    ```bash [Terminal]
    pethost deploy
    ```

The command writes a `Dockerfile` that runs `nuxt build` and starts `.output/server/index.mjs`, deploys your application, and prints its address. No preset has to be set: Nuxt's default Node.js server output is used.

## Learn more

::read-more{to="https://pethost.dev/blog/deploy-nuxt-app/" target="_blank"}
See the **Pethost guide** for environment variables, deployments from GitHub and custom domains.
::
