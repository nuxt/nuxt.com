import { join } from 'pathe'
import type { Source } from 'comark-content'
import fs from 'comark-content/sources/fs'
import github from 'comark-content/sources/github'
import { injectGeneratedConfigDocs } from './config-docs'

export const SHA_TTL = 60 * 60 * 24

const DOCS_EXCLUDE = ['**/*.json']

const V5_ONLY_PATHS = [
  'guide/modules/module-dependencies',
  'guide/best-practices/accessibility',
  'guide/concepts/server-components',
  'guide/recipes/mostly-static-sites'
]

export type DocsVersion = '3.x' | '4.x' | '5.x'

function githubToken() {
  return process.env.NUXT_GITHUB_TOKEN || process.env.GITHUB_TOKEN
}

function rewriteDocsLinks(body: string, version: DocsVersion) {
  let next = body.replaceAll(/\(\/docs\/(?!\d\.x)/g, `(/docs/${version}/`)
  if (version === '5.x') {
    for (const path of V5_ONLY_PATHS) {
      next = next.replaceAll(`/docs/4.x/${path}`, `/docs/5.x/${path}`)
    }
  }
  return next
}

async function transformDocsMarkdown(key: string, body: string, version: DocsVersion) {
  if (key === 'README.md' || key.endsWith('/README.md')) {
    return '---\nnavigation: false\n---'
  }

  let next = rewriteDocsLinks(body, version)
  if (version === '3.x') {
    next = await injectGeneratedConfigDocs(next, key)
  }
  return next
}

function withDocsTransforms(source: Source, version: DocsVersion): Source {
  const getItem = source.getItem.bind(source)
  return {
    ...source,
    async getItem(key: string) {
      const raw = await getItem(key)
      if (typeof raw !== 'string') return raw
      return transformDocsMarkdown(key, raw, version)
    }
  }
}

export function docsSource(opts: {
  version: DocsVersion
  branch: string
  localEnv: string
}) {
  const prefix = `/docs/${opts.version}`
  const local = process.env[opts.localEnv]
  const source = local
    ? fs(join(local, 'docs'), { prefix, exclude: DOCS_EXCLUDE })
    : github({
        repo: 'nuxt/nuxt',
        branch: opts.branch,
        path: 'docs',
        prefix,
        exclude: DOCS_EXCLUDE,
        token: githubToken(),
        ttl: SHA_TTL
      })

  return withDocsTransforms(source, opts.version)
}

export function examplesSource(version: DocsVersion) {
  const prefix = `/docs/${version}/examples`
  const local = process.env.NUXT_EXAMPLES_PATH
  if (local) {
    return fs(join(local, '.docs'), { prefix })
  }
  return github({
    repo: 'nuxt/examples',
    branch: 'main',
    path: '.docs',
    prefix,
    token: githubToken(),
    ttl: SHA_TTL
  })
}
