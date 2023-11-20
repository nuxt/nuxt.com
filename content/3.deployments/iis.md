---
title: IIS
description: 'Deploy your Nuxt Application to IIS infrastructure.'
logoSrc: '/assets/integrations/microsoft.webp'
category: Hosting
nitroPreset: 'iis'
website: 'https://www.iis.net/'
---

## Using IISnode

1. Install the latest LTS version of [Node.js](https://nodejs.org/en/) on your Windows Server.
2. Install [IISnode](https://github.com/azure/iisnode/releases)
3. Install [IIS `URLRewrite` Module](https://www.iis.net/downloads/microsoft/url-rewrite).
4. In IIS, add `.mjs` as a new mime type and set its content type to `application/javascript`.
5. Build you application with the following command:
    ```bash [Terminal]
    npx nuxi build --preset=iis_node
    ```
5. Deploy the contents of your `.output` folder to your website in IIS.

## IIS Configuration

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    // IIS options default
    iis: {
      // merges in a pre-exisiting web.config file to the nitro default file
      mergeConfig: true,
      // overrides the default nitro web.config file all together
      overrideConfig: false,
    },
  },
});
```

## More options

::read-more{to="https://nitro.unjs.io/deploy/providers/iss" target="_blank"}
Head over **Nitro documentation** to learn more about the ISS deployment presets.
::
