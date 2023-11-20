---
title: Heroku
description: 'Deploy your Nuxt Application to Heroku infrastructure.'
logoSrc: '/assets/integrations/heroku.svg'
category: Hosting
nitroPreset: 'heroku'
---

Nuxt supports deploying on [Heroku](https://heroku.com/) with minimal configuration.

## Using the Heroku CLI

1. Create a new Heroku app.

    ```bash [Terminal]
    heroku create myapp
    ```

2. Configure Heroku to use the nodejs buildpack.

    ```bash [Terminal]
    heroku buildpacks:set heroku/nodejs
    ```

3. Configure your app.

    ```bash [Terminal]
    heroku config:set SERVER_PRESET=heroku
    ```

4. Ensure you have `start` and `build` commands in your `package.json` file.

    ```json [package.json]
    {
      "scripts": {
        "build": "nuxt build",
        "start": "node .output/server/index.mjs"
      }
    }
    ```

## Learn more

::read-more{to="https://nitro.unjs.io/deploy/providers/heroku" target="_blank"}
Head over **Nitro documentation** to learn more about the Heroku deployment preset.
::
