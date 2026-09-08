---
title: Koyeb
description: 'Deploy your Nuxt Application to Koyeb infrastructure.'
logoIcon: 'i-simple-icons-koyeb'
category: Hosting
nitroPreset: 'koyeb'
website: 'https://www.koyeb.com/'
---

Nuxt supports deploying on the [Koyeb serverless platform](https://www.koyeb.com/docs) with minimal configuration.

## Setup

1. Create a new Koyeb app for Nuxt following the [guide](https://www.koyeb.com/docs/deploy/nuxt).

2. Set the `engines.node` field in your project's `package.json` file to a [Koyeb-supported version of Node.js](https://www.koyeb.com/docs/build-and-deploy/build-from-git/nodejs#runtime):

    ```json [package.json]
    {
      "engines": {
          "node": "20.x"
      }
    }
    ```

3. Ensure that `build` and `start` scripts are defined within the project's `package.json` file to define how to build and run the application:

    ```json [package.json]
    {
      "scripts": {
          "build": "nuxt build",
          "start": "node .output/server/index.mjs"
      }
    }
    ```

4. During deployment, you'll need to configure environment variables. In your service settings, set the following [environment variable](https://www.koyeb.com/docs/build-and-deploy/environment-variables):

    ```bash
    SERVER_PRESET=koyeb
    ```

5. Click "Deploy" to build and deploy your Nuxt app.

## Learn more

::read-more{to="https://nitro.unjs.io/deploy/providers/koyeb" target="_blank"}
Head over **Nitro documentation** to learn more about the Koyeb deployment preset.
::
