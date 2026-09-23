---
title: DeployHQ
description: 'Deploy your Nuxt application to your own server with DeployHQ build pipelines.'
logoSrc: '/assets/integrations/deployhq.svg'
category: Hosting
nitroPreset: 'node-server'
website: 'https://www.deployhq.com/'
---

[DeployHQ](https://www.deployhq.com/) is a Git-based deployment automation platform. It connects to your GitHub, GitLab, or Bitbucket repository, runs your Nuxt build on its build pipeline servers, and transfers the resulting `.output/` directory to a server you provision yourself over SSH/SFTP/FTP — or to S3, Azure Blob Storage, or Rackspace Cloud Files.

::tip
DeployHQ builds and delivers your application; it does not host the running Node.js process. You deploy the artifact to a server (VPS, dedicated box, or cloud instance) where Node runs the Nitro `node-server` output.
::

## Setup

1. Sign up at [deployhq.com/signup](https://www.deployhq.com/signup) and create a new project, connecting it to your Nuxt repository.

2. Add a deployment server (SSH/SFTP recommended) and point it at the directory on your host where the built application should land — for example `/var/www/my-nuxt-app/releases`.

3. Configure the **build pipeline** to install dependencies and produce the Nitro output. In your project's **Build Pipeline** settings, add the following commands:

    ```bash [Build pipeline]
    npm install
    npm run build
    ```

    DeployHQ will execute these on its build servers and ship the resulting `.output/` directory to your server.

4. Ensure your `package.json` declares a Node version compatible with Nitro and exposes a start script:

    ```json [package.json]
    {
      "engines": {
        "node": ">=20.19"
      },
      "scripts": {
        "build": "nuxt build",
        "start": "node .output/server/index.mjs"
      }
    }
    ```

5. On your server, run the application as a long-running process (using `pm2`, `systemd`, or your process manager of choice):

    ```bash [Terminal]
    node .output/server/index.mjs
    ```

6. Optionally use **deploy hooks** (pre-/post-deployment commands) to restart your process manager after each release, for example `pm2 reload my-nuxt-app` as a post-deploy SSH command.

For static deployments, replace step 3 with `npm run generate` and configure your server to serve the contents of `.output/public/` from a web server such as Nginx or Caddy.

::tip
DeployHQ supports multiple environments per project — map your `main` branch to production and a `staging` branch to a separate staging server. Encrypted config files (e.g. `.env`) can be injected at deploy time per environment, and atomic releases with a symlinked `current` directory enable one-click rollback to any previous deployment.
::

## Learn more

::read-more{to="https://www.deployhq.com/support" target="_blank"}
Read the **DeployHQ support docs** for full coverage of build pipelines, environments, and deploy hooks.
::

::read-more{to="https://nitro.build/deploy/runtimes/node" target="_blank"}
Head over to **Nitro documentation** to learn more about the `node-server` preset.
::
