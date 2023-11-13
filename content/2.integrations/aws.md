---
title: AWS Lambda
description: 'Deploy your Nuxt Application to AWS Lanmbda infrastructure.'
image: /assets/blog/default.png
logo: 'i-simple-icons-amazonaws'
category: Hosting
to: https://nitro.unjs.io/deploy/providers/aws
---

Nitro provides a built-in preset to generate output format compatible with [AWS Lambda](https://aws.amazon.com/lambda/).

The output entrypoint in `.output/server/index.mjs` is compatible with [AWS Lambda format](https://docs.aws.amazon.com/lex/latest/dg/lambda-input-response-format.html).

It can be used programmatically or as part of a deployment.

```ts
import { handler } from './.output/server'

// Use programmatically
const { statusCode, headers, body } = handler({ rawPath: '/' })
```

## Inlining chunks

Nitro output, by default uses dynamic chunks for lazy loading code only when needed. However this sometimes can not be ideal for performance. (See discussions in [unjs/nitro#650](https://github.com/unjs/nitro/pull/650)). You can enabling chunk inlining behavior using [`inlineDynamicImports`](https://nitro.unjs.io/config#inlinedynamicimports) config.

::code-group
```ts [nitro.config.ts]
export default defineNitroConfig({
  inlineDynamicImports: true
});
```
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    inlineDynamicImports: true
  }
})
```
::
