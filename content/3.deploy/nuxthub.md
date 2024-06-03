---
title: NuxtHub
description: 'Deploy your full-stack Nuxt application globally on your Cloudflare account.'
componentImg: NuxtHub
logoSrc: '/assets/integrations/nuxthub.svg'
category: Hosting
featured: true
nitroPreset: 'cloudflare-pages'
website: 'https://hub.nuxt.com'
---

::tip
**Zero Configuration ✨**
:br
Integration with NuxtHub is possible with zero configuration, [learn more](https://nitro.unjs.io/deploy#zero-config-providers).
::

::note
NuxtHub is a deployment and administration platform for Nuxt, powered by Cloudflare. :br The main difference with the [Cloudflare](/deploy/cloudflare) deployment is that NuxtHub provides a zero-configuration deployment experience (provisioning, deployment, and administration). :br It also provides a powerful admin interface to manage your Nuxt projects (database, blob, KV, ...) as well as [remote storage](https://hub.nuxt.com/docs/getting-started/remote-storage).
::

## Quick Start

- Login to [admin.hub.nuxt.com](https://admin.hub.nuxt.com)
- Connect your Cloudflare account by clicking on `Create a new token with required permissions` and follow the instructions
- You are now ready to deploy your Nuxt project to your Cloudflare account!

## Deploy using Git

1. Push your code to your git repository (GitHub or GitLab)
2. Click on `New Project` then `Import a Git repository`
3. Select your repository and click on `Import repository`
4. NuxtHub will configure your project on Cloudflare Pages and deploy it
5. Your application is deployed with a `.nuxt.dev` domain

After your project has been imported and deployed, all subsequent pushes to branches will generate preview deployments and all changes made to the production branch (commonly “main”) will result in a production deployment.

### NuxtHub CLI

::warning
If you do your first deployment with the NuxtHub CLI, you won't be able to attach your GitHub/GitLab repository later on due to a Cloudflare limitation.
::

You can deploy your local project with a single command:

```bash [Terminal]
npx nuxthub deploy
```

The command will:
1. Ensure you are logged in on [admin.hub.nuxt.com](https://admin.hub.nuxt.com)
2. Link your local project with a NuxtHub project or help you create a new one
3. Build your Nuxt project with the correct preset
4. Deploy it to your Cloudflare account with all the necessary resources
4. Provide you with a URL to access your project

::note
You can also install the [NuxtHub CLI](https://github.com/nuxt-hub/cli) globally with: `npm i -g nuxthub`.
::

## Templates

::card-group
  ::card
  ---
  icon: i-simple-icons-github
  title: NuxtHub Starter
  to: https://github.com/nuxt-hub/starter
  target: _blank
  ui.icon.base: text-black dark:text-white
  ---
  A minimal starter to get started with NuxtHub storage and features.
  ::
  ::card
  ---
  icon: i-simple-icons-github
  title: Nuxt Todos
  to: https://github.com/atinux/nuxt-todos-edge
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
::

::callout
See the whole list of templates on https://hub.nuxt.com/templates
::
