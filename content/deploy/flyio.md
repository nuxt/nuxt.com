---
title: Fly.io
description: 'Deploy your Nuxt Application to Fly.io infrastructure.'
logoIcon: 'i-simple-icons-flydotio'
category: Hosting
nitroPreset: 'node'
website: 'https://fly.io/'
---

Nuxt supports deploying on [Fly.io](https://fly.io/) with minimal configuration.

## Using the Fly CLI

1. Install [flyctl](https://docs.fly.io/flyctl/install) and sign in.

    ```bash [Terminal]
    fly auth login
    ```

2. From your project's root directory, create and deploy a new Fly app. `fly launch` detects Nuxt and generates a `Dockerfile` and `fly.toml` for you.

    ```bash [Terminal]
    fly launch
    ```

3. Deploy subsequent changes.

    ```bash [Terminal]
    fly deploy
    ```

## Learn more

::read-more{to="https://docs.fly.io/js/frameworks/nuxtjs" target="_blank"}
Head over **Fly.io documentation** to learn more about running Nuxt on Fly.io.
::
