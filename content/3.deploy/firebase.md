---
title: Firebase
description: "Deploy your Nuxt Application to Firebase infrastructure."
logoIcon: "i-logos-firebase"
category: Hosting
nitroPreset: "firebase"
website: "https://firebase.google.com/"
---

## Firebase Functions

To use the more recent and recommended generation of firebase functions, set the `firebase.gen` option to `2`:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    firebase: {
      gen: 2,
    },
  },
});
```

::note
If you cannot use configuration for any reason, alternatively you can use `NITRO_FIREBASE_GEN=2` environment variable.
::

If you already have a deployed version of your website and want to upgrade to 2nd gen, [see the Migration process on Firebase docs](https://firebase.google.com/docs/functions/2nd-gen-upgrade). Namely, the CLI will ask you to delete your existing functions before deploying the new ones.

::tip{to="https://firebase.google.com/docs/functions/version-comparison" target="\_blank"}
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

::note
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
npm run build -- --preset=firebase
firebase emulators:start
```

## Build and Deploy

Deploy to Firebase Hosting by running a Nitro build and then running the `firebase deploy` command.

```bash
npm run build -- --preset=firebase
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
        region: "europe-west1",
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
      nodeVersion: "18", // Can be '16' or '18' or '20'
    },
  },
});
```

Firebase tools use the `engines.node` version in `package.json` to determine which node version to use for your functions. Nuxt automatically writes to the `.output/server/package.json` with configured Node.js version.

You might also need to add a runtime key to your `firebase.json` file:

```json [firebase.json]
{
  "functions": {
    "source": ".output/server",
    "runtime": "nodejs20"
  }
}
```

::read-more{to="https://firebase.google.com/docs/functions/manage-functions?gen=2nd#set_nodejs_version" target="\_blank"}
You can read more about this in **Firebase Docs**.
::

## If your firebase project has other cloud functions

You may be warned that other cloud functions will be deleted when you deploy your Nuxt project. This is because nitro will deploy your entire project to firebase functions. If you want to deploy only your Nuxt project, you can use the `--only` flag:

```bash
firebase deploy --only functions:server,hosting
```

::read-more{to="https://nitro.unjs.io/deploy/providers/firebase" target="\_blank"}
Head over **Nitro documentation** to learn more about the Firebase deployment preset.
::

## Using Cookies in production

When using Firebase Hosting together with Cloud Functions or Cloud Run, cookies are generally stripped from incoming requests to allow for efficient CDN cache behavior. Only the specially-named `__session` cookie is permitted to pass through to your app.

Example of how to set the idToken in the cookies to facilitate making calls to the api with the idToken in the headers:

```ts
const sessionCookie = useCookie("__session", {
  default: () => ({ idToken: "" }),
});

const setIdToken = function (idToken) {
  sessionCookie.value.idToken = idToken;
};

const callApi = async function () {
  await useFetch("/api/functionThatWillDecodeTheIdTokenToVerifyLoggedInUser", {
    headers: {
      Authorization: `Bearer ${sessionCookie.value.idToken}`,
    },
  });
};
```

::read-more{to="https://firebase.google.com/docs/hosting/manage-cache#using_cookies" target="\_blank"}
For more information, refer to the **Firebase documentation**.
::
