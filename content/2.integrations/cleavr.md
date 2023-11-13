---
title: Cleavr
description: 'Deploy your Nuxt Application to Cleavr infrastructure.'
image: /assets/blog/default.png
logo: 'i-ph-cloud-duotone'
category: Hosting
---

**Preset:** `cleavr` ([switch to this preset](https://nitro.unjs.io/deploy/#changing-the-deployment-preset))

::callout
**Zero Config Provider**
:br
Integration with this provider is possible with zero configuration. ([Learn More](https://nitro.unjs.io/deploy/#zero-config-providers))
::

Nitro provides a built-in preset to generate output format compatible with [Cleavr.io](https://cleavr.io/).

## Set up your web app

In your project, set Nitro preset to `cleavr`.

```js
export default {
  nitro: {
    preset: 'cleavr'
  }
}
```
Push changes to your code repository.

**In your Cleavr panel:**

1. Provision a new server
2. Add a website, selecting **Nuxt 3** as the app type
3. In web app > settings > Code Repo, point to your project's code repository

You're now all set to deploy your project!
