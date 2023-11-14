---
title: IIS
description: 'Deploy your Nuxt Application to IIS infrastructure.'
logoSrc: '/assets/integrations/microsoft.webp'
category: Hosting
---

::callout{color="red" icon="i-ph-warning"}
This is an experimental preset.
::

## Using [IISnode](https://github.com/Azure/iisnode)

**Preset:** `iis_node` ([switch to this preset](https://nitro.unjs.io/deploy/#changing-the-deployment-preset))

1. Install the latest LTS version of [Node.js](https://nodejs.org/en/) on your Windows Server.
1. Install [IISnode](https://github.com/azure/iisnode/releases)
2. Install [IIS `URLRewrite` Module](https://www.iis.net/downloads/microsoft/url-rewrite).
3. In IIS, add `.mjs` as a new mime type and set its content type to `application/javascript`.
4. Deploy the contents of your `.output` folder to your website in IIS.

## Using IIS Handler

**Preset:** `iis_handler` / `iis` ([switch to this preset](https://nitro.unjs.io/deploy/#changing-the-deployment-preset))

You can use IIS http handler directly.

1. Install the latest LTS version of [Node.js](https://nodejs.org/en/) on your Windows Server.
2. Install [IIS `HttpPlatformHandler` Module](https://www.iis.net/downloads/microsoft/httpplatformhandler)
3. Copy your `.output` directory into the Windows Server, and create a website on IIS pointing to that exact directory.

## IIS Config options

::code-group

```ts [nitro.config.ts]
export default defineNitroConfig({
  // IIS options default
  iis: {
    // merges in a pre-exisiting web.config file to the nitro default file
    mergeConfig: true,
    // overrides the default nitro web.config file all together
    overrideConfig: false,
  },
});
```

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

::
