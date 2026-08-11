import { comarkContent } from 'comark-content'
import fs from 'comark-content/sources/fs'
import github from 'comark-content/sources/github'
import yaml from 'comark-content/plugins/yaml'
import sqlQuery from 'comark-content/plugins/sql-query'
import sqliteFullTextSearch from 'comark-content/plugins/sqlite-full-text-search'
import sqlite from 'comark-content/database/sqlite-node'
import toc from 'comark/plugins/toc'
import shiki from 'comark/plugins/shiki'
import type { Source } from 'comark-content'
import type { Node } from 'comark'

/** Prefer the Nuxt-specific token; a generic GITHUB_TOKEN may be invalid for api.github.com. */
const githubToken = process.env.NUXT_GITHUB_TOKEN || undefined

/**
 * Wrap a remote source so a failed GitHub fetch returns an empty keyset
 * instead of failing Content.init() for every source (including local).
 */
function resilient(source: Source, label: string): Source {
  const warn = (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[comark-content] source "${label}" unavailable: ${message}`)
  }

  return {
    prefix: source.prefix,
    schema: source.schema,
    async keys() {
      try {
        return await source.keys()
      } catch (err) {
        warn(err)
        return []
      }
    },
    async getItem(key: string) {
      try {
        return await source.getItem(key)
      } catch (err) {
        warn(err)
        return ''
      }
    },
    async getItemRaw(key: string) {
      try {
        return await source.getItemRaw(key)
      } catch (err) {
        warn(err)
        return undefined
      }
    },
    watch: source.watch
  }
}

function remoteOrLocalDocs(options: {
  envPath: string | undefined
  branch: string
  prefix: string
  label: string
}): Source {
  if (options.envPath) {
    return fs('docs', {
      cwd: options.envPath,
      prefix: options.prefix,
      exclude: ['**/*.json']
    })
  }

  return resilient(github({
    repo: 'nuxt/nuxt',
    branch: options.branch,
    path: 'docs',
    prefix: options.prefix,
    exclude: ['**/*.json'],
    token: githubToken
  }), options.label)
}

/**
 * Nest a source's keys under a directory (e.g. `4.examples/`): the numeric
 * prefix is stripped from URLs by comark's path generation but kept in stems,
 * which drive navigation ordering — so examples sort as section 4 of the docs.
 */
function nested(source: Source, dir: string): Source {
  const outer = (key: string) => `${dir}/${key}`
  const inner = (key: string) => key.startsWith(`${dir}/`) ? key.slice(dir.length + 1) : key
  return {
    prefix: source.prefix,
    schema: source.schema,
    async keys() {
      const keys = await source.keys()
      return keys.map(outer)
    },
    getItem: key => source.getItem(inner(key)),
    getItemRaw: key => source.getItemRaw(inner(key)),
    watch: source.watch
  }
}

function remoteOrLocalExamples(prefix: string, label: string): Source {
  if (process.env.NUXT_EXAMPLES_PATH) {
    return nested(fs('.docs', {
      cwd: process.env.NUXT_EXAMPLES_PATH,
      prefix
    }), '4.examples')
  }

  return nested(resilient(github({
    repo: 'nuxt/examples',
    path: '.docs',
    prefix,
    token: githubToken
  }), label), '4.examples')
}

const database = sqlite({
  filename: process.env.COMARK_CONTENT_DB || '/tmp/comark-content.db'
})

/**
 * Site-wide Comark Content instance.
 *
 * Docs and examples are separate sources (not merge()) so each keeps its own
 * `prefix` — merge() drops child prefixes and caused cross-version path collisions.
 */
export const content = comarkContent({
  sources: {
    local: fs('./content'),
    docsv3: remoteOrLocalDocs({
      envPath: process.env.NUXT_V3_PATH,
      branch: '3.x',
      prefix: '/docs/3.x',
      label: 'docsv3'
    }),
    examplesv3: remoteOrLocalExamples('/docs/3.x', 'examplesv3'),
    docsv4: remoteOrLocalDocs({
      envPath: process.env.NUXT_V4_PATH,
      branch: '4.x',
      prefix: '/docs/4.x',
      label: 'docsv4'
    }),
    examplesv4: remoteOrLocalExamples('/docs/4.x', 'examplesv4'),
    docsv5: remoteOrLocalDocs({
      envPath: process.env.NUXT_V5_PATH,
      branch: 'main',
      prefix: '/docs/5.x',
      label: 'docsv5'
    }),
    examplesv5: remoteOrLocalExamples('/docs/5.x', 'examplesv5')
  },
  markdown: {
    plugins: [
      toc({ depth: 3, searchDepth: 6 }),
      shiki()
    ]
  },
  plugins: [
    yaml(),
    sqlQuery({ database }),
    sqliteFullTextSearch({ database })
  ]
})

/**
 * Nuxt docs frontmatter uses dotted keys (`navigation.icon`, `head.title`) and
 * `.navigation.yml` puts `icon` / `titleTemplate` at the top level. Comark's
 * navigation builder only reads `data.navigation`, so normalize both shapes.
 */
function unflattenDottedKeys(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (!key.includes('.')) {
      result[key] = value
    }
  }
  for (const [key, value] of Object.entries(data)) {
    if (!key.includes('.')) continue
    const parts = key.split('.')
    let current: Record<string, unknown> = result
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!
      const existing = current[part]
      if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
        current[part] = {}
      }
      current = current[part] as Record<string, unknown>
    }
    current[parts[parts.length - 1]!] = value
  }
  return result
}

content.hooks.hook('file:parsed', (ctx) => {
  const file = ctx.file
  if (!file?.data || typeof file.data !== 'object') return

  file.data = unflattenDottedKeys(file.data as Record<string, unknown>)

  const isNavigationFile = file.meta.stem?.split('/').pop() === '.navigation'
    || file.meta.key?.includes('.navigation.')
  if (!isNavigationFile) return
  if (file.data.navigation === false) return

  const navigation = (
    file.data.navigation && typeof file.data.navigation === 'object' && !Array.isArray(file.data.navigation)
      ? { ...(file.data.navigation as Record<string, unknown>) }
      : {}
  )
  for (const key of ['title', 'icon', 'titleTemplate'] as const) {
    if (file.data[key] != null && navigation[key] == null) {
      navigation[key] = file.data[key]
    }
  }
  if (Object.keys(navigation).length) {
    file.data.navigation = navigation
  }
})

// Disable the docs README (previously content:file:beforeParse in docs-config module).
content.hooks.hook('file:parsed', (ctx) => {
  const file = ctx.file
  if (!file) return
  const key = file.meta.key
  if (
    key === 'docsv3/docs/README.md'
    || key === 'docsv4/docs/README.md'
    || key === 'docsv5/docs/README.md'
    || key.endsWith('/docs/README.md')
  ) {
    file.data = { ...(file.data || {}), navigation: false }
    file.nodes = []
  }
})

// Config docs generation for 3.x (previously content:file:beforeParse in docs-config module).
content.hooks.hook('file:parsed', async (ctx) => {
  const file = ctx.file
  if (!file || file.meta.source !== 'docsv3') return
  if (!file.meta.key.includes('nuxt-config')) return

  const source = content.getSource('docsv3')
  if (!source) return

  try {
    const stem = file.meta.stem
    const ext = file.meta.extension
    const rawResult = source.getItem(stem + ext)
    const rawContent = typeof rawResult === 'string' ? rawResult : await rawResult
    if (!rawContent || typeof rawContent !== 'string') return

    const GENERATE_KEY = '<!-- GENERATED_CONFIG_DOCS -->'
    if (!rawContent.includes(GENERATE_KEY)) return

    const { createMarkdownParser } = await import('comark/parse')
    const { default: schemaToMarkdown } = await import('../../modules/docs-config-generate.ts')
    const generated = await schemaToMarkdown()
    if (!generated) return

    const fullMarkdown = rawContent.replace(GENERATE_KEY, generated)
    const parser = createMarkdownParser({
      plugins: [
        toc({ depth: 3, searchDepth: 6 }),
        shiki()
      ]
    })
    const doc = await parser(fullMarkdown)
    file.nodes = doc.nodes
    file.data = { ...(file.data || {}), ...(doc.frontmatter || {}) }
    if (doc.meta?.toc) {
      ;(file.meta as { toc?: unknown }).toc = doc.meta.toc
    }
  } catch (err) {
    console.error('Could not generate config docs:', err)
  }
})

// Path rewriting that previously lived in nuxt.config `content:file:beforeParse`.
content.hooks.hook('file:parsed', (ctx) => {
  const file = ctx.file
  if (!file || file.meta.kind !== 'document' || file.meta.extension !== '.md') {
    return
  }

  const source = file.meta.source
  if (source !== 'docsv5' && source !== 'docsv4' && source !== 'examplesv5' && source !== 'examplesv4') {
    return
  }

  const versionPrefix = source.startsWith('docsv5') || source.startsWith('examplesv5') ? '/docs/5.x/' : '/docs/4.x/'
  const rewriteHref = (href: string) => {
    let next = href.replace(/\/docs\/(?!\d\.x)/g, versionPrefix)
    if (versionPrefix === '/docs/5.x/') {
      for (const path of [
        'guide/modules/module-dependencies',
        'guide/best-practices/accessibility',
        'guide/concepts/server-components',
        'guide/recipes/mostly-static-sites'
      ]) {
        next = next.replaceAll(`/docs/4.x/${path}`, `/docs/5.x/${path}`)
      }
    }
    return next
  }

  const walk = (nodes: Node[]): void => {
    for (const node of nodes) {
      // Element/comment nodes are `[tag, attrs, ...children]`; text nodes are plain strings.
      if (!Array.isArray(node) || node.length < 2) continue
      const props = node[1]
      if (props && typeof props.href === 'string') {
        props.href = rewriteHref(props.href)
      }
      walk(node.slice(2) as Node[])
    }
  }

  walk(file.nodes)
})
