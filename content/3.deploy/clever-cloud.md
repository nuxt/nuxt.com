---
title: Clever Cloud
description: 'Deploy your Nuxt Application to Clever Cloud infrastructure.'
logoSrc: '/assets/integrations/clever-cloud.svg'
category: Hosting
nitroPreset: 'node_server'
website: 'https://www.clever-cloud.com/'
---

Nuxt supports deploying on [Clever Cloud](https://www.clever-cloud.com/) with minimal configuration.

## Install CLI and login.

    ```bash [Terminal]
    npm i -g clever-tools
    clever login
    ```

## Deploy a static application

1. Create a new Clever Cloud Node app.

    ```bash [Terminal]
    clever create -t node myNuxtApp
    ```

2. Configure your app.

    ```bash [Terminal]
    clever env set CC_NODE_BUILD_TOOL "custom"
    clever env set CC_PRE_BUILD_HOOK "npm install -g pnpm && pnpm install"
    clever env set CC_CUSTOM_BUILD_TOOL "pnpm build"
    clever env set CC_RUN_COMMAND "node .output/server/index.mjs"
    ```


## Deploy a static application

1. Create a new Clever Cloud static app.

    ```bash [Terminal]
    clever create -t static-apache myStaticNuxtApp
    ```

2. Configure your app

    ```bash [Terminal]
    clever env set CC_NODE_BUILD_TOOL "custom"
    clever env set CC_PRE_BUILD_HOOK "npm install -g pnpm && pnpm install"
    clever env set CC_CUSTOM_BUILD_TOOL "pnpm build"
    clever env set CC_POST_BUILD_HOOK "pnpm generate"
    clever env set CC_WEBROOT "/.output/public"
    clever env set CC_OVERRIDE_BUILDCACHE "/.output/public"
    ```

## Learn more

::read-more{to="https://developers.clever-cloud.com/doc/applications/javascript/nodejs" target="_blank"}
Clever Cloud documentation for deploying a Node.js application
::

::read-more{to="https://developers.clever-cloud.com/guides/nuxt" target="_blank"}
Clever Cloud documentation for deploying Nuxt as a static application
::
