import { comarkContent } from 'comark-content'
import fs from 'comark-content/sources/fs'
import github from 'comark-content/sources/github'
import yaml from 'comark-content/plugins/yaml'
import json from 'comark-content/plugins/json'
import highlight from 'comark/plugins/highlight'
import toc from 'comark/plugins/toc'
import vercelRuntimeCache from 'unstorage/drivers/vercel-runtime-cache'
import { isChildPath } from '../../shared/utils/content'

const SHA_TTL = 60 * 60 * 24 // 1 day

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
    content: contentSource()
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

export async function listChildren(prefix: string) {
  const items = await content.list()
  return items.filter(item => isChildPath(item.path, item.meta.stem, prefix))
}
