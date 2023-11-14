---
title: Cloudflare
description: 'Deploy your Nuxt Application to Cloudflare infrastructure.'
logoSrc: '/assets/integrations/cloudflare.svg'
category: Hosting
---

## Cloudflare Pages

::callout
**Zero Configuration ✨**
:br
Integration with Cloudflare Pages is possible with zero configuration, [learn more](https://nitro.unjs.io/deploy/#zero-config-providers).
::

### Git Integration

If you use the GitHub/GitLab integration with Cloudflare Pages, **no configuration is required**. Pushing to your repository will automatically build your project and deploy it.

::callout
Nuxt will detect the environment to set the correct [Server/Nitro preset](https://nitro.unjs.io/deploy/providers/cloudflare).
::

To leverage sever-side rendering on the edge, set the build command to: `nuxt build`

To statically generate your website, set the build command to: `nuxt generate`

### Direct Upload

Alternatively, you can use [wrangler](https://github.com/cloudflare/workers-sdk) to upload your project to Cloudflare.

In this case, you will have to set the preset manually.

1. Build your project for Cloudflare Pages:

    ```bash [Terminal]
    SERVER_PRESET=cloudflare_pages npx nuxi build
    ```

2. Deploy, it will ask you to create a project for the first time:

    ```bash [Terminal]
    wrangler pages deploy dist/
    ```

## Learn more

::read-more{to="https://nitro.unjs.io/deploy/providers/cloudflare" target="_blank"}
Head over **Nitro documentation** to learn more about the Cloudflare deployment preset.
::
::read-more{to="https://developers.cloudflare.com/pages/framework-guides/deploy-a-nuxt-site/#use-bindings-in-your-nuxt-application" target="_blank"}
Head over **CloudFlare Pages** documentation to learn more about it.
::
