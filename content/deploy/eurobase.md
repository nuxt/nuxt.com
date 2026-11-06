---
title: Eurobase
description: 'Deploy your Nuxt Application to Eurobase infrastructure.'
logoSrc: '/assets/integrations/eurobase.png'
category: Hosting
website: 'https://eurobase.dev/'
---

Nuxt supports deploying on [Eurobase](https://eurobase.dev), a platform that runs apps on European infrastructure, with zero configuration.

## Setup

1. Push your Nuxt project to a GitHub repository.

2. [Create a Eurobase account](https://eurobase.dev/signup), connect GitHub and install the Eurobase GitHub App on the repository.

3. In **Projects**, select **New project** and choose the repository. Eurobase detects Nuxt and builds it with the Nitro Cloudflare preset, so there is no build or start command to set.

4. Select **Save and Deploy**. Every push to the project's branch deploys again.

::tip
Eurobase runs Nuxt 3.21.0 or later on V8 isolates. Environment variables added as project secrets are available when your app runs, not during the build.
::

::read-more{to="https://eurobase.dev/docs/guides/nuxt" target="_blank"}
For more information, refer to the **Eurobase Nuxt guide**.
::
