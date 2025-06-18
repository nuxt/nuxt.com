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

**Example**: `https://<user>.github.io/<repository>/`: `NUXT_APP_BASE_URL=/<repository>/ npx nuxt build --preset github_pages`
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
      - run: npx nuxt build --preset github_pages
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
      name: github-pages
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
