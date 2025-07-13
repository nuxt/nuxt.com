---
title: Deno Deploy
description: 'Deploy your Nuxt Application to Deno Deploy infrastructure.'
logoIcon: 'i-logos-deno'
category: Hosting
nitroPreset: 'deno-deploy'
website: 'https://deno.com/deploy'
---

::important
Deno deploy preset is experimental.
::

## Deploy with the CLI

You can use [deployctl](https://deno.com/deploy/docs/deployctl) to deploy your app.

Login to [Deno Deploy](https://dash.deno.com/account#access-tokens) to obtain a `DENO_DEPLOY_TOKEN` access token, and set it as an environment variable.

```bash
# Build with the deno_deploy preset
npm run build --preset=deno_deploy

# Make sure to run the deployctl command from the output directory
cd .output
deployctl deploy --project=my-project server/index.ts --token=<DENO_DEPLOY_TOKEN>
```

## Deploy within CI/CD using GitHub Actions

Link your GitHub repository to your Deno Deploy project and choose the "GitHub Actions" deployment mode. You can do this in your project settings on https://dash.deno.com.

Create a GitHub action file in your repository:

```yaml [.github/workflows/deno_deploy.yml]
name: deno-deploy
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
jobs:
  deploy:
    steps:
      - uses: actions/checkout@v3
      - run: corepack enable
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: pnpm
      - run: pnpm install
      - run: pnpm build
        env:
          NITRO_PRESET: deno_deploy
      - name: Deploy to Deno Deploy
        uses: denoland/deployctl@v1
        with:
          project: <my-project>
          entrypoint: server/index.ts
          root: .output
```

::important
Make sure to rename `<my-project>` with your project name.
::

## Templates

::card-group
  ::card
  ---
  icon: i-simple-icons-github
  title: Nuxt Deno KV
  to: https://github.com/Atinux/nuxt-deno-kv
  target: _blank
  ui.icon.base: text-black dark:text-white
  ---
  A collaborative todo-list app built with Deno KV and Nuxt.
  ::
::

## Learn more

::read-more{to="https://nitro.unjs.io/deploy/providers/deno-deploy" target="_blank"}
Head over **Nitro documentation** to learn more about the deno-deploy deployment preset.
::
