import { comarkContent } from 'comark-content'
import fs from 'comark-content/sources/fs'
import github from 'comark-content/sources/github'
import yaml from 'comark-content/plugins/yaml'
import json from 'comark-content/plugins/json'
import highlight from 'comark/plugins/highlight'
import toc from 'comark/plugins/toc'
import vercelRuntimeCache from 'unstorage/drivers/vercel-runtime-cache'
import { isChildPath } from '../../shared/utils/content'
import { SHA_TTL, docsSource, examplesSource } from './docs-source'

function contentSource() {
  if (import.meta.dev || !process.env.VERCEL) {
    return fs('./content')
  }

  return github({
    repo: 'nuxt/nuxt.com',
    branch: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_REF || 'main',
    path: 'content',
    token: process.env.NUXT_GITHUB_TOKEN || process.env.GITHUB_TOKEN,
    ttl: SHA_TTL
  })
}

function cacheOptions() {
  if (import.meta.dev || !process.env.VERCEL) return undefined
  return {
    driver: vercelRuntimeCache({
      base: `content:${process.env.VERCEL_GIT_COMMIT_SHA || 'main'}`,
      ttl: SHA_TTL
    })
  }
}

export const content = comarkContent({
  sources: {
    content: contentSource(),
    docsv3: docsSource({ version: '3.x', branch: '3.x', localEnv: 'NUXT_V3_PATH' }),
    examplesv3: examplesSource('3.x'),
    docsv4: docsSource({ version: '4.x', branch: '4.x', localEnv: 'NUXT_V4_PATH' }),
    examplesv4: examplesSource('4.x'),
    docsv5: docsSource({ version: '5.x', branch: 'main', localEnv: 'NUXT_V5_PATH' }),
    examplesv5: examplesSource('5.x')
  },
  cache: cacheOptions(),
  plugins: [
    yaml(),
    json()
  ],
  markdown: {
    plugins: [
      highlight(),
      toc()
    ]
  }
})

content.hooks.hook('file:parsed', (ctx) => {
  const file = ctx.file
  if (!file) return

  if (file.meta.stem.split('/').pop() === '.navigation') {
    const current = file.data.navigation
    if (current === false) return
    const navigation: Record<string, unknown> = current && typeof current === 'object' ? { ...current } : {}
    for (const key of ['title', 'titleTemplate', 'icon', 'description'] as const) {
      if (file.data[key] != null && navigation[key] == null) {
        navigation[key] = file.data[key]
      }
    }
    file.data.navigation = navigation
  }

  if (ctx.sourceName.startsWith('examples') && !file.meta.stem.startsWith('4.examples/')) {
    file.meta.stem = `4.examples/${file.meta.stem}`
  }
})

export async function listChildren(prefix: string) {
  const items = await content.list('content')
  return items.filter(item => isChildPath(item.path, item.meta.stem, prefix))
}
