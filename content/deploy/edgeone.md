---
title: EdgeOne Pages
description: 'Deploy your Nuxt Application to EdgeOne Pages.'
logoSrc: '/assets/integrations/edgeone.png'
category: Hosting
nitroPreset: 'edgeone'
website: 'https://pages.edgeone.ai/'
---

Nuxt supports deploying on [EdgeOne Pages](https://pages.edgeone.ai/) with the `edgeone-pages` Nitro preset. EdgeOne Pages supports Nuxt 3.16.0 and later (Nuxt 4 recommended).

## Setup

1. In the [EdgeOne Pages console](https://console.tencentcloud.com/edgeone/pages), click **Create project**.
2. Choose **Import Git repository** (GitHub, GitLab, Gitee, or CNB).
3. Select the repository and branch for your Nuxt app.
4. Add the `NITRO_PRESET` environment variable with the value `edgeone-pages`.
5. Click **Deploy**.

## EdgeOne CLI

Install the [EdgeOne CLI](https://pages.edgeone.ai/document/edgeone-cli) (version 1.2.4 or later), then deploy with:

```bash [Terminal]
edgeone pages deploy
```

The CLI builds the project, then uploads and publishes the build output.

## Learn more

::read-more{to="https://pages.edgeone.ai/document/framework-nuxt" target="_blank"}
See the **EdgeOne Nuxt framework guide** for SSR, SSG, and ISR support details.
::

::read-more{to="https://nitro.unjs.io/deploy/providers/edgeone" target="_blank"}
Head over to the **Nitro documentation** to learn more about the EdgeOne Pages deployment preset.
::
