---
title: Sevalla
description: 'Deploy your Nuxt Application to Sevalla infrastructure.'
logoSrc: '/assets/integrations/sevalla.svg'
category: Hosting
nitroPreset: 'sevalla'
website: 'https://sevalla.com/'
---

Nuxt supports deploying on [Sevalla](https://sevalla.com/) with minimal configuration.

## Setup

1. Create a new Sevalla app following [this guide](https://docs.sevalla.com/applications/get-started/add-an-application).  
2. Set the `engines.node` field in your project's `package.json` file to ensure Sevalla uses a supported version of Node.js:

    ```json [package.json]
    {
      "engines": {
          "node": "22.x"
      }
    }
    ```

3. Add a run command to your `package.json` so Sevalla knows what command to run after a build:

    ```json [package.json]
    {
      "scripts": {
          "start": "node .output/server/index.mjs"
      }
    }
    ```

4. Click on the **Create and Deploy** button. Sevalla will automatically build and deploy your Nuxt.js application.

Your app will be live at a Sevalla generated URL. You can also learn more about [Sevalla’s other services](https://docs.sevalla.com/), including our free [static site hosting](https://sevalla.com/static-site-hosting/).

## More options

::read-more{to="https://nitro.unjs.io/deploy/providers/sevalla" target="_blank"}
Head over **Nitro documentation** to learn more about the Sevalla deployment presets.
::