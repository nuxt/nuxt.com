---
title: Firebase
description: 'Deploy your Nuxt Application to Firebase infrastructure.'
logoIcon: 'i-logos-firebase'
category: Hosting
nitroPreset: true
---

## Firebase Functions

To use the more recent and recommended generation of firebase functions, set the `firebase.gen` option to `2`:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    firebase: {
      gen: 2
    }
  }
})
```

::callout
If you cannot use configuration for any reason, alternatively you can use `NITRO_FIREBASE_GEN=2` environment variable.
::

If you already have a deployed version of your website and want to upgrade to 2nd gen, [see the Migration process on Firebase docs](https://firebase.google.com/docs/functions/2nd-gen-upgrade). Namely, the CLI will ask you to delete your existing functions before deploying the new ones.

::callout{to="https://firebase.google.com/docs/functions/version-comparison" target="_blank"}
Comparison between 1st and 2nd generation functions
::

## Project Setup

You may instead prefer to set up your project with the Firebase CLI, which will fetch your project ID for you, add required dependencies (see above) and even set up automated deployments via GitHub Actions (for hosting only). [Learn about installing the firebase CLI](https://firebase.google.com/docs/cli#windows-npm).

1. Install the latest version of the Firebase CLI.

    ```bash [Terminal]
    npm install -g firebase-tools@latest
    ```

2. Initialize your Firebase Project

    ```bash [Terminal]
    firebase login
    firebase init hosting
    ```

::callout
When prompted, you can enter `.output/public` as the public directory. In the next step, **do not** configure your project as a single-page app.
::

Once complete, add the following to your `firebase.json` to enable server rendering in Cloud Functions:

```json [firebase.json]
{
  "functions": { "source": ".output/server" },
  "hosting": [
    {
      "site": "<your_project_id>",
      "public": ".output/public",
      "cleanUrls": true,
      "rewrites": [{ "source": "**", "function": "server" }]
    }
  ]
}
```

## Local Preview

You can preview a local version of your site if you need to test things out without deploying.

```bash
npm run build --preset=firebase
firebase emulators:start
```

## Build and Deploy

Deploy to Firebase Hosting by running a Nitro build and then running the `firebase deploy` command.

```bash
npm run build --preset=firebase
firebase deploy
```

## Options

You can set options for the firebase functions in your `nuxt.config.ts` file:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    firebase: {
      gen: 2,
      httpsOptions: {
        region: 'europe-west1',
        maxInstances: 3,
      },
    },
  },
});
```

### Runtime Node.js Version

You can set custom Node.js version in configuration:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    firebase: {
      nodeVersion: '18' // Can be '16' or '18' or '20'
    },
  },
});
```

Firebase tools use the `engines.node` version in  `package.json` to determine which node version to use for your functions. Nuxt automatically writes to the `.output/server/package.json` with configured Node.js version.

You might also need to add a runtime key to your `firebase.json` file:

```json [firebase.json]
{
  "functions": {
    "source": ".output/server",
    "runtime": "nodejs20"
  }
}
```

::read-more{to="https://firebase.google.com/docs/functions/manage-functions?gen=2nd#set_nodejs_version" target="_blank"}
You can read more about this in **Firebase Docs**.
::

## If your firebase project has other cloud functions

You may be warned that other cloud functions will be deleted when you deploy your Nuxt project. This is because nitro will deploy your entire project to firebase functions. If you want to deploy only your Nuxt project, you can use the `--only` flag:

```bash
firebase deploy --only functions:server,hosting
```

## Advanced

### Renaming Function

When deploying multiple apps within the same Firebase project, you must give your server a unique name in order to avoid overwriting your functions.

You can specify a new name for the deployed Firebase function in your configuration:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    firebase: {
      serverFunctionName: "<new_function_name>"
    }
  }
})
```

## Firebase 1st Generation

::read-more{to="https://nitro.unjs.io/deploy/providers/firebase" target="_blank"}
Head over **Nitro documentation** to learn more about the Firebase 1st generation deployment preset.
::
