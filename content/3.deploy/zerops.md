---
title: Zerops
description: "Deploy your Nuxt Application to Zerops infrastructure."
componentImg: Zerops
logoSrc: "/assets/integrations/zerops.svg"
category: Hosting
NuxtPreset: "zerops"
website: "https://zerops.io"
---

**Nodejs Preset**: `SERVER_PRESET: zerops`
**Static Preset**: `SERVER_PRESET: zerops-static`

:read-more{title="Zerops" to="https://zerops.io"}

::tip
**Nuxt x Zerops Quickrun ✨**
:br
 Want to test running Nuxt on Zerops without installing or setting up anything? Using repositories [Zerops x Nuxt - Static](https://github.com/zeropsio/recipe-nuxt-static) or [Zerops x Nuxt - SSR on Node.js](https://github.com/zeropsio/recipe-nuxt-nodejs) you can deploy example Nuxt app with a single click.
::


Zerops supports deploying both static and server-side rendered apps with a simple configuration file in your project root.                     

## Static 

Projects and services can be added either through a [Project add wizard](https://app.zerops.io/dashboard/project-add) or imported using a YAML structure:

### Creating a Project

```yml [zerops-project-import.yml]
project:
  name: recipe-nuxt

services:
  - hostname: app
    type: static
```
This will create a project called `recipe-nuxt` with a Zerops Static service called `app`.

### Setting up Zerops YAML

To tell Zerops how to build and run your app, add a `zerops.yml` to your root:

```yml [zerops.yml]
zerops:
  - setup: app
    build:
      base: nodejs@20
      buildCommands:
        - yarn
        - yarn nuxi generate
      deployFiles:
        - .output/public/~
    run:
      base: static
```

Now you can trigger the [build & deploy pipeline using the Zerops CLI](#building-deploying-your-app) or by connecting the app service with your [GitHub](https://docs.zerops.io/references/github-integration/) / [GitLab](https://docs.zerops.io/references/gitlab-integration) repository from inside the service detail.

## SSR Node.js

Projects and services can be added either through a [Project add wizard](https://app.zerops.io/dashboard/project-add) or imported using a YAML structure:

```yml [zerops-project-import.yml]
project:
  name: recipe-nuxt

services:
  - hostname: app
    type: nodejs@20
```

This will create a project called `recipe-nuxt` with a Zerops Static service called `app`.

### Setting up Zerops YAML

To tell Zerops how to build and run your app, add a `zerops.yml` to your root:

```yml [zerops.yml]
zerops:
  - setup: nuxt
    build:
      base: nodejs@18
      prepareCommands:
        - node -v
      buildCommands:
        - yarn
        - yarn build
      deployFiles:
        - .output/~
    run:
      base: nodejs@18
      ports:
        - port: 3000
          httpSupport: true
      start: node server/index.mjs
```

Now you can trigger the [build & deploy pipeline using the Zerops CLI](#building-deploying-your-app) or by connecting the app service with your [GitHub](https://docs.zerops.io/references/github-integration/) / [GitLab](https://docs.zerops.io/references/gitlab-integration) repository from inside the service detail.


## Building & Deploying your App

- Install the [Zerops CLI](https://github.com/zeropsio/zcli).
```sh
npm i -g @zerops/zcli
```

- Open [Settings > Access Token Management](https://app.zerops.io/settings/token-management) in the Zerops app and generate a new access token.

- Log in using your access token with the following command:

```sh
zcli login <token>
```

- Navigate to the root of your app (where `zerops.yml` is located) and run the following command to trigger the deploy:

```sh
zcli push
```

Your code can be deployed automatically on each commit or a new tag by connecting the service with your [GitHub](https://docs.zerops.io/references/gitlab-integration) / [GitLab](https://docs.zerops.io/references/gitlab-integration) repository. This connection can be set up in the service detail.


:read-more{title="Zerops Documentation" to="https://docs.zerops.io/"}
