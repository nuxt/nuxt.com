---
title: Zeabur
description: 'Deploy your Nuxt Application to Zeabur.'
logoSrc: '/assets/integrations/zeabur.svg'
category: Hosting
nitroPreset: 'zeabur'
website: 'https://zeabur.com/'
---

Nuxt supports deploying on [Zeabur](https://zeabur.com) with minimal configuration.

## Setup

1. Create a new Zeabur app for Nuxt following the [guide](https://zeabur.com/docs/guides/nodejs/nuxt).

2. During the deployment process, you can configure environment variables in Zeabur dashboard. In your service page, open the variables tab set the following [environment variable](https://zeabur.com/docs/deploy/variables):
    ```bash
    SERVER_PRESET=zeabur
    ```

## Learn more

::read-more{to="https://nitro.unjs.io/deploy/providers/zeabur" target="_blank"}
Head over **Nitro documentation** to learn more about the Zeabur deployment preset.
::
