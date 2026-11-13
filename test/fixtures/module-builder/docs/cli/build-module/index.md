---
title: 'nuxt build-module'
description: 'Nuxt command to build your Nuxt module before publishing.'
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/nuxt/module-builder/blob/main/src/cli.ts
    size: xs
---

```bash [Terminal]
npx nuxt build-module [ROOTDIR] [--stub]
```

## `build`

Builds the module, as described in [Commands](/docs/guide/modules/module-builder/commands#build). Use [`--stub`](/docs/guide/modules/module-builder/commands#build-stub) while developing.

### Arguments

| Argument | Description |
| --- | --- |
| `ROOTDIR="."` | Specifies the working directory |

### Options

| Option | Default | Description |
| --- | --- | --- |
| `--stub` | | Stub the dist instead of building it |

## `prepare`

Prepares the module for development, see [Commands](/docs/guide/modules/module-builder/commands#prepare) and the [Module Builder](/docs/guide/modules/module-builder).

### Arguments

| Argument | Description |
| --- | --- |
| `ROOTDIR="."` | Specifies the working directory |

### Options

| Option | Default | Description |
| --- | --- | --- |
| `--cwd=<directory>` | | Specify the working directory |
