---
title: NuxtHub
description: 'Deploy Nuxt applications globally on your Cloudflare account with zero configuration.'
componentImg: NuxtHub
logoSrc: '/assets/integrations/nuxthub-logo.svg'
category: Hosting
featured: true
nitroPreset: 'cloudflare-pages'
website: 'https://hub.nuxt.com/?utm_source=nuxt-website&utm_medium=deploy-page'
---

::tip
**Zero Configuration ✨**
:br
Integration with NuxtHub is possible with zero configuration, [learn more](https://nitro.unjs.io/deploy#zero-config-providers).
::

## Introduction

NuxtHub is a deployment and administration platform for Nuxt, powered by Cloudflare.

The main difference with the [Cloudflare](/deploy/cloudflare) deployment is that NuxtHub provides a zero-configuration deployment experience (provisioning, deployment, and administration).

It also provides a powerful admin interface to manage your Nuxt projects (database, blob, KV, ...) as well as [remote storage](https://hub.nuxt.com/docs/getting-started/remote-storage?utm_source=nuxt-website&utm_medium=deploy-page).

Read more on [hub.nuxt.com](https://hub.nuxt.com/?utm_source=nuxt-website&utm_medium=deploy-page).

## NuxtHub CLI

You can deploy your local project with a single command:

```bash [Terminal]
npx nuxthub deploy
```

The command will:
1. Ensure you are logged in on [admin.hub.nuxt.com](https://admin.hub.nuxt.com/?utm_source=nuxt-website&utm_medium=deploy-page)
2. Link your local project with a NuxtHub project or help you create a new one
3. Build your Nuxt project with the correct preset
4. Deploy it to your Cloudflare account with all the necessary resources
4. Provide you with a URL to access your project

See an example in video:

::video{poster="https://res.cloudinary.com/nuxt/video/upload/v1723569534/nuxthub/nuxthub-deploy_xxs5s8.jpg" controls class="rounded dark:border dark:border-gray-700 md:w-2/3"}
  :source{src="https://res.cloudinary.com/nuxt/video/upload/v1723569534/nuxthub/nuxthub-deploy_xxs5s8.webm" type="video/webm"}
  :source{src="https://res.cloudinary.com/nuxt/video/upload/v1723569534/nuxthub/nuxthub-deploy_xxs5s8.mp4" type="video/mp4"}
  :source{src="https://res.cloudinary.com/nuxt/video/upload/v1723569534/nuxthub/nuxthub-deploy_xxs5s8.ogg" type="video/ogg"}
::

::note
You can also install the [NuxtHub CLI](https://github.com/nuxt-hub/cli) globally with: `npm i -g nuxthub`.
::

## Deploy using Git

1. Push your code to your git repository (GitHub)
2. Click on `New Project` then `Import a Git repository`
3. Select your repository and click on `Import repository`
4. NuxtHub will configure a GitHub Action workflow to deploy your project
5. Your application is deployed with a `.nuxt.dev` domain

After your project has been imported and deployed, all subsequent pushes to branches will generate preview deployments and all changes made to the production branch (commonly “main”) will result in a production deployment.

## Templates

::card-group
  ::card
  ---
  icon: i-simple-icons-github
  title: Hello Edge
  to: https://github.com/nuxt-hub/hello-edge
  target: _blank
  ui.icon.base: text-black dark:text-white
  ---
  A minimal Nuxt starter running on the edge.
  ::
  ::card
  ---
  icon: i-simple-icons-github
  title: NuxtHub Starter
  to: https://github.com/nuxt-hub/starter
  target: _blank
  ui.icon.base: text-black dark:text-white
  ---
  A starter to get started with NuxtHub features (Database, Blob, KV, ...).
  ::
  ::card
  ---
  icon: i-simple-icons-github
  title: Atidone
  to: https://github.com/atinux/atidone
  target: _blank
  ui.icon.base: text-black dark:text-white
  ---
  A full-stack application with authentication and a database to manage your Todos.
  ::
  ::card
  ---
  icon: i-simple-icons-github
  title: Nuxt Image Gallery
  to: https://github.com/flosciante/nuxt-image-gallery
  target: _blank
  ui.icon.base: text-black dark:text-white
  ---
  An image gallery to upload, edit and share your images to the world.
  ::
  ::card
  ---
  icon: i-simple-icons-github
  title: Atinotes
  to: https://github.com/atinux/atinotes
  target: _blank
  ui.icon.base: text-black dark:text-white
  ---
  An editable website powered by Markdown & Vue components with dynamic OG image generation.
  ::
  ::card
  ---
  icon: i-simple-icons-github
  title: Atidraw
  to: https://github.com/atinux/atidraw
  target: _blank
  ui.icon.base: text-black dark:text-white
  ---
  Web application that lets you to draw and share your drawings with the world, with Cloudflare R2 & AI.
  ::
::

::callout
See the whole list of templates on https://hub.nuxt.com/templates
::
