---
title: Lizard
description: 'Deploy your Nuxt application to Lizard with the Node.js server preset.'
logoSrc: '/assets/integrations/lizard.svg'
category: Hosting
nitroPreset: 'node'
website: 'https://lizard.build/'
---

[Lizard (lizard.build)](https://lizard.build/) builds and runs Nuxt applications from uploaded source code. This guide uses Nitro's Node.js server preset.

## Configure the application

Set the preset in `nuxt.config.ts`:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: { preset: 'node-server' }
})
```

Add production build and start scripts to your existing `package.json`:

```json [package.json]
{
  "scripts": {
    "build": "nuxt build",
    "start": "HOST=0.0.0.0 PORT=3000 node .output/server/index.mjs"
  }
}
```

The start command runs in the Linux deployment container. It serves the generated Node.js application on port `3000`.

## Deploy

Install the CLI and sign in:

```bash
npm install -g @lizard-build/cli
lizard login
```

From the application directory, create a project and service, then upload the source:

```bash
lizard init --name nuxt-app
lizard add --service web
lizard up --service web --port 3000
```

Include the package lockfile. Exclude `node_modules/`, `.nuxt/`, `.output/`, and `.env` files from the upload. Lizard installs the dependencies, runs the build script, and starts the server.

Open the returned HTTPS URL. Request an inner page directly and check a server API route, if your app has one. Read the build and runtime logs with `lizard logs --build --service web` and `lizard logs --service web`.

::read-more{to="https://lizard.build/docs/framework-guides/nuxt/" target="_blank"}
See the **Lizard Nuxt guide** for runtime configuration, generated static sites, and troubleshooting.
::
