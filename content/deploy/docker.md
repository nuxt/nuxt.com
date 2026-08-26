---
title: Docker
description: 'Deploy your Nuxt Application with Docker.'
logoIcon: 'i-simple-icons-docker'
category: Hosting
website: 'https://www.docker.com/'
---

Nuxt builds to a standalone Node.js server by default, which makes it a natural fit for a container image. Running `nuxt build` produces a self-contained `.output` directory that only needs a Node.js runtime to start, so the final image does not have to ship your source code, your `node_modules` or your package manager.

::note
No extra configuration is required. `nuxt build` uses the `node-server` preset unless another one is detected or set.
::

## Dockerfile

Use a multi-stage build: install dependencies and build in the first stage, then copy only `.output` into a clean runtime stage.

::code-group{sync="pm"}

```dockerfile [pnpm]
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

```dockerfile [yarn]
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock ./
RUN yarn install --immutable
COPY . .
RUN yarn build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

```dockerfile [npm]
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

```dockerfile [bun]
FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

::

::tip
Pick a base image that satisfies the `engines.node` range of the Nuxt version you are using. The build output itself is plain JavaScript, so the runtime stage can use Node.js even when you build with another package manager or runtime.
::

## Ignore files

Add a `.dockerignore` file next to your `Dockerfile` so local artifacts and secrets never reach the build context. Copying a host `node_modules` into the image is a common source of native-module errors, and a stale `.nuxt` or `.output` can silently override the freshly built one.

```bash [.dockerignore]
.git
.gitignore
.nuxt
.output
.data
node_modules
dist
Dockerfile
.dockerignore
.env
.env.*
*.log
```

## Build and run

```bash [Terminal]
docker build -t my-nuxt-app .
docker run --rm -p 3000:3000 my-nuxt-app
```

Your application is now available on `http://localhost:3000`.

## Environment variables

The server reads the following variables at startup:

- `NITRO_PORT` or `PORT` (defaults to `3000`)
- `NITRO_HOST` or `HOST` (defaults to `0.0.0.0`)

Values under [`runtimeConfig`](/docs/api/nuxt-config#runtimeconfig) are overridden by matching `NUXT_`-prefixed variables, so a single image can be promoted across environments:

```bash [Terminal]
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e NUXT_API_SECRET=your-secret \
  -e NUXT_PUBLIC_SITE_URL=https://example.com \
  my-nuxt-app
```

::important
Only `runtimeConfig` values can be changed after the image is built. Anything read during the build, such as `import.meta.env` in client code or a `.env` file present in the build context, is baked into the image. Pass those with `--build-arg` and rebuild when they change.
::

## Docker Compose

```yaml [compose.yml]
services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      NUXT_PUBLIC_SITE_URL: https://example.com
    restart: unless-stopped
```

```bash [Terminal]
docker compose up --build
```

## Static site

If your application is fully pre-rendered, build it with `nuxt generate` and serve `.output/public` from any static web server.

```dockerfile [Dockerfile]
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm generate

FROM nginx:alpine AS runtime
COPY --from=build /app/.output/public /usr/share/nginx/html
EXPOSE 80
```

::caution
A static build relies on the `200.html` and `404.html` fallback pages to resolve routes that were not pre-rendered. Configure your web server to serve them, otherwise unmatched URLs return the server's own error page.
::

::read-more{to="/docs/getting-started/deployment#static-hosting"}
Learn more about **static hosting** and fallback pages.
::

## Learn more

::read-more{to="https://nitro.build/deploy/runtimes/node" target="_blank"}
Head over **Nitro documentation** to learn more about the Node.js runtime.
::
