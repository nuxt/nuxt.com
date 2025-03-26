---
title: Clever Cloud
description: 'Deploy your Nuxt Application to Clever Cloud infrastructure.'
logoSrc: '/assets/integrations/clever-cloud.svg'
category: Hosting
nitroPreset: 'node_server'
website: 'https://www.clever-cloud.com/'
---

Nuxt supports deploying on [Clever Cloud](https://www.clever-cloud.com/) with minimal configuration.

## Deploy Clever Cloud from the Console

To deploy your Nuxt project to Clever Cloud, you will need to create a **new application**. The application wizard will walk you through the necessary configuration steps.

1. From the lateral menubar, click **Create > An application**
2. Choose how to deploy: **Create an application from a local repository** or **Create an application from a GitHub repository**
3. Select a **Node.js** application, or a **static one**.
4. Set up the minimal size for your instance and scalability options. Nuxt app must be deployed with a minimum size of **XS** instance for **Node.js** application and **nano** instance for **static one**. The build process, however, will need to be configured later with at least an M instance size to ensure it can handle the resource requirements. Depending on your project’s specifications and dependencies, you may need to adjust further as you monitor the metrics from the **Overview** page.
5. Select a **region** to deploy your instance.
6. Skip connecting **Add-ons** to your Clever application unless you’re using a database.
7. Inject **environment variables**:
  - For **Node.js**

::package-managers

```ini [npm]
CC_PRE_BUILD_HOOK="npm run build"
CC_RUN_COMMAND="node .output/server/index.mjs"
```

```ini [yarn]
CC_NODE_BUILD_TOOL="yarn"
CC_PRE_BUILD_HOOK="yarn install --frozen-lockfile && yarn build"
CC_RUN_COMMAND="node .output/server/index.mjs"
```

```ini [pnpm]
CC_CUSTOM_BUILD_TOOL="pnpm build"
CC_NODE_BUILD_TOOL="custom"
CC_PRE_BUILD_HOOK="npm i -g pnpm && pnpm install --frozen-lockfile && pnpm run build"
CC_RUN_COMMAND="node .output/server/index.mjs"
```

```ini [bun]
CC_CUSTOM_BUILD_TOOL="bun build"
CC_NODE_BUILD_TOOL="custom"
CC_PRE_BUILD_HOOK="npm i -g bun && bun install && bun run build "
CC_RUN_COMMAND="node .output/server/index.mjs"
```

::

  - For a **static application**

::package-managers

```ini [npm]
CC_NODE_VERSION=20
CC_WEBROOT=/.output/public
CC_OVERRIDE_BUILDCACHE=/.output/public
CC_PRE_BUILD_HOOK=npm install
CC_POST_BUILD_HOOK=npx nuxi generate
```

```ini [yarn]
CC_NODE_VERSION=20
CC_WEBROOT=/.output/public
CC_OVERRIDE_BUILDCACHE=/.output/public
CC_PRE_BUILD_HOOK="yarn install --frozen-lockfile"
CC_POST_BUILD_HOOK=npx nuxi generate
```

```ini [pnpm]
CC_NODE_VERSION=20
CC_WEBROOT=/.output/public
CC_OVERRIDE_BUILDCACHE=/.output/public
CC_PRE_BUILD_HOOK="npm i -g pnpm && pnpm install --frozen-lockfile"
CC_POST_BUILD_HOOK=npx nuxi generate
```

```ini [bun]
CC_NODE_VERSION=20
CC_WEBROOT=/.output/public
CC_OVERRIDE_BUILDCACHE=/.output/public
CC_PRE_BUILD_HOOK="npm i -g bun && bun install"
CC_POST_BUILD_HOOK=npx nuxi generate
```

::

8. Navigate to the application **Information** menu and enable the **enable dedicated build instance** option on a minimal instance of type **M**.
9. **Deploy!** If you’re deploying from **GitHub**, your deployment should start automatically. If you’re using **Git**, show [this docs](https://www.clever-cloud.com/developers/doc/quickstart/#choose-how-to-deploy).

## Learn more

::read-more{to="https://developers.clever-cloud.com/guides/nuxt" target="_blank"}
Clever Cloud documentation for deploying Nuxt
::
