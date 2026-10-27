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
If you are deploying a **project site** without a custom domain, you need to set `NUXT_APP_BASE_URL` to your repository slug for your build step.
:br
**Project-site example**: `https://<user>.github.io/<repository>/`: `NUXT_APP_BASE_URL=/<repository>/ npx nuxt build --preset github_pages`
::

::tip
**Generic GitHub Action Configuration ✨**
:br
For a project site without a custom domain, you can pass the GitHub Actions context variable `github.event.repository.name` as `NUXT_APP_BASE_URL: /${{ github.event.repository.name }}/` - see [Deployment](/deploy/github-pages#deployment) below.
:br
For a user or organization site named `<owner>.github.io`, or for a custom domain, omit `NUXT_APP_BASE_URL` or set it to `/`.
::

::read-more{to="https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/accessing-contextual-information-about-workflow-runs#github-context" target="_blank"}
Head over **GitHub Actions Context** to learn more about the GitHub Actions context variables.
::

## Setup

Follow the steps to [create a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## Deployment

Here is an example GitHub Actions workflow to deploy your site to GitHub Pages using the `github_pages` preset:

<!-- Supported Node versions: https://github.com/actions/setup-node#supported-version-syntax -->

```yaml [.github/workflows/deploy.yml]
# https://github.com/actions/deploy-pages#usage
name: Deploy Nuxt App to GitHub Pages
on:
  workflow_dispatch:
  push:
    branches:
      - main
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - run: corepack enable
      - uses: actions/setup-node@v7
        with:
          node-version: "24"
      # Pick your own package manager and build script
      - run: npm install
      # Drop the env var below if your GitHub Pages is configured for a custom domain
      - run: npx nuxt build --preset github_pages
        env:
          NUXT_APP_BASE_URL: /${{ github.event.repository.name }}/
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v5
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
        uses: actions/deploy-pages@v5
```

::read-more{to="https://nitro.unjs.io/deploy/providers/github-pages" target="_blank"}
Head over **Nitro documentation** to learn more about the github-pages deployment preset.
::

## Favicons

Favicons typically are expected at hosting domain root. In case of a GitHub Pages deployment this does not work.
For this reason favicon URLs should be defined for the page header starting with the GitHub Page's base URL as absolute path to work for a single page app as well as for a multi-route app.

::note
Favicon files should be maintained within the project's `public/` folder and your `app/app.vue` file must be configured according to [SEO and Meta](/docs/getting-started/seo-meta#nuxt-config) to make use of the base URL defined by `NUXT_APP_BASE_URL`.
::
