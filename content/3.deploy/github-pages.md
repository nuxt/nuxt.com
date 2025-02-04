---
title: GitHub Pages
description: 'Deploy your Nuxt Application to GitHub Pages infrastructure.'
logoIcon: 'i-simple-icons-github'
category: Hosting
nitroPreset: 'github-pages'
website: 'https://pages.github.com/'
---

Nuxt supports deploying to [GitHub Pages](https://pages.github.com/) with minimal configuration.

::caution
GitHub Pages only support static sites, Nuxt will pre-render your application to static HTML files.
::

::caution
If you are **not** using a custom domain, you need to set `NUXT_APP_BASE_URL` to your repository-slug for your build step.
:br
**Example**: `https://<user>.github.io/<repository>/`: `NUXT_APP_BASE_URL=/<repository>/ npx nuxt build --preset github_pages`
::

::tip
**Zero Configuration ✨**
:br
In a **GitHub Workflow** you can make use of the pre-defined env var `GITHUB_REPOSITORY`: `NUXT_APP_BASE_URL="/${GITHUB_REPOSITORY##*/}/" npx nuxt build --preset github_pages`
::

::read-more{to="https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/accessing-contextual-information-about-workflow-runs#github-context" target="_blank"}
Head over **GitHub Actions Context** to learn more about the GitHub Actions context variables.
::

## Setup

Follow the steps to [create a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## Deployment

Here is an example GitHub Actions workflow to deploy your site to GitHub Pages using the `github_pages` preset:

```yaml [.github/workflows/deploy.yml]
# https://github.com/actions/deploy-pages#usage
name: Deploy to GitHub Pages
on:
  workflow_dispatch:
  push:
    branches:
      - main
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: corepack enable
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      # Pick your own package manager and build script
      - run: npm install
      # Use NUXT_APP_BASE_URL="" if your GitHub Pages is configured for a custom domain
      - run: NUXT_APP_BASE_URL="/${GITHUB_REPOSITORY##*/}/" npx nuxt build --preset github_pages
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./.output/public
  # Deployment job
  deploy:
    # Add a dependency to the build job
    needs: build
    # Grant GITHUB_TOKEN the permissions required to make a Pages deployment
    permissions:
      pages: write      # to deploy to Pages
      id-token: write   # to verify the deployment originates from an appropriate source
    # Deploy to the github_pages environment
    environment:
      name: github_pages
      url: ${{ steps.deployment.outputs.page_url }}
    # Specify runner + deployment step
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

::read-more{to="https://nitro.unjs.io/deploy/providers/github-pages" target="_blank"}
Head over **Nitro documentation** to learn more about the github-pages deployment preset.
::

## Favicons

Favicons typically are expected at hosting domain root. In case of a GitHub Pages deployment this does not work.

For this reason favicon URLs should be defined for the pages header starting with the GitHub Pages base URL as absolute path to work for a single page app as well as for a multi-route app.

::note
Favicon files should be maintained within the projects `public/` folder.
::

**Example:** If you have `public/favicon.ico` and `public/favicon-16x16.png` your `nuxt.config.ts` should start as follows:
```ts [nuxt.config.ts]
// Make use of compile time environment var NUXT_APP_BASE_URL
// to make baseURL work for GitHub Pages deployments as well.
// See https://vite.dev/guide/env-and-mode.html for details.
const baseURL = import.meta.env.NUXT_APP_BASE_URL
  ? import.meta.env.NUXT_APP_BASE_URL
  : "/";
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: "My Nuxt App",
      link: [
        {
          rel: "icon",
          type: "image/x-icon",
          href: baseURL + "favicon.ico?x=2",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: baseURL + "favicon-16x16.png",
        },
        // Add more favicons if wanted ...
      ],
    },
    // probale other app content ...
  },
  // other config ...
)};
```
