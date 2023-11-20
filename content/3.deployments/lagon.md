---
title: Lagon
description: 'Deploy your Nuxt Application to Lagon infrastructure.'
logoSrc: '/assets/integrations/lagon.webp'
category: Hosting
nitroPreset: 'lagon'
website: 'https://lagon.app/'
---

[Lagon](https://lagon.app/) is an open-source runtime and platform that allows developers to run TypeScript and JavaScript Serverless Functions close to users.

Nuxt supports deploying on [Lagon](https://lagon.app/) with minimal configuration ([documentation](https://docs.lagon.app/))

::callout{color="amber" icon="i-ph-warning"}
Lagon is not yet ready for production workloads
::


::callout
Install the [Lagon CLI](https://docs.lagon.app/cli#installation) and login with `lagon login` before proceeding.
```bash [Terminal]
npm install --global @lagon/cli esbuild
```
::

## Testing Locally

1. Build your Nuxt app

    ```bash [Terminal]
    npx nuxt build --preset lagon
    ```

2. Launch a local dev server and open [localhost:1234](http://localhost:1234):

    ```bash [Terminal]
    lagon dev ./.output
    ```

## Deploy from your local machine

1. Build your Nuxt app

    ```bash [Terminal]
    npx nuxt build --preset lagon
    ```


2. Run the deploy command. Lagon will ask if you want to link to an existing function or create a new one:

    ```bash [Terminal]
    lagon deploy .output
    ```

**Deploy to preview:**

```bash [Terminal]
lagon deploy .output
```

**Deploy to production:**

```bash [Terminal]
lagon deploy .output --prod
```

## Deploy within CI/CD using GitHub Actions

Add a new environment variable named `LAGON_TOKEN`, and copy the value from the [Tokens section of Lagon's dashboard](https://dash.lagon.app/profile).

Create a new GitHub Workflow at `.github/workflows/lagon.yml`:

```yaml [.github/workflows/lagon.yml]
name: Lagon
on:
  push:
    branches:
      - main
jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm build
        env:
          NITRO_PRESET: lagon
      - uses: lagonapp/github-action@latest
        with:
          lagon_token: ${{ secrets.LAGON_TOKEN }}
```

### If you have committed the `.lagon` folder

Trigger a deployment locally first, and commit the updated `.lagon/config.json` file. The GitHub Action will automatically pick the configuration file.

### If you haven't committed the `.lagon` folder

Trigger a deployment locally first, and copy the content of `.lagon/config.json`. Then, update the workflow configuration:

```yaml [.github/workflows/lagon.yml]
with:
  lagon_token: ${{ secrets.LAGON_TOKEN }}
  config: |
    {
      "function_id": "${{ vars.lagon_function_id }}",
      "organization_id": "${{ vars.lagon_org_id }}",
      "index": ".output/index.mjs",
      "client": null,
      "assets": ".output/public"
    }
```
