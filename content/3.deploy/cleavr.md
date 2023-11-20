---
title: Cleavr
description: 'Deploy your Nuxt Application to Cleavr infrastructure.'
logoSrc: '/assets/integrations/cleavr.svg'
category: Hosting
nitroPreset: 'cleavr'
website: 'https://cleavr.io/'
---

::callout
**Zero Configuration ✨**
:br
Integration with this provider is possible with zero configuration.
::

## Setup

**In your [Cleavr.io](https://cleavr.io/) panel:**

1. Provision a new server
2. Add a website, selecting **Nuxt 3** as the app type
3. In web app > settings > Code Repo, point to your project's code repository
4. In web app > settings > Environment variables, set `SERVER_PRESET=cleavr`

You're now all set to deploy your project!

## Learn more

::read-more{to="https://nitro.unjs.io/deploy/providers/cleavr" target="_blank"}
Head over **Nitro documentation** to learn more about the cleavr deployment preset.
::
