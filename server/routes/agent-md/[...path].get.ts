import { generateNotFoundMarkdown, isAIAgent } from '@vercel/agent-readability'
import type { H3Event } from 'h3'
import type { Collections, CollectionQueryBuilder } from '@nuxt/content'
import { queryCollection } from '@nuxt/content/server'
import { trackMdRequest, extractTrackingContext, resolveSource } from '~~/server/utils/md-tracking'

type QC = <T extends keyof Collections>(event: H3Event, collection: T) => CollectionQueryBuilder<Collections[T]>

const NOT_FOUND_OPTIONS = {
  baseUrl: 'https://nuxt.com',
  sitemapUrl: '/sitemap.md',
  indexUrl: '/llms.txt',
  fullContentUrl: '/llms-full.txt',
  exampleUrl: '/docs/4.x/getting-started/introduction.md'
}

function resolveCollection(path: string): keyof Collections | null {
  if (path.startsWith('/docs/5.x/')) return 'docsv5'
  if (path.startsWith('/docs/3.x/')) return 'docsv3'
  if (path.startsWith('/docs/')) return 'docsv4'
  if (path.startsWith('/blog/')) return 'blog'
  if (path.startsWith('/deploy/')) return 'deploy'
  return null
}

function buildFrontmatter(meta: { title: string, description: string, path: string }): string {
  const title = meta.title.replace(/"/g, '\\"')
  const description = (meta.description || '').replace(/"/g, '\\"')
  return [
    '---',
    `title: "${title}"`,
    `description: "${description}"`,
    `canonical_url: https://nuxt.com${meta.path}`,
    `last_updated: ${new Date().toISOString().split('T')[0]}`,
    '---',
    ''
  ].join('\n')
}

function sendMarkdown(event: H3Event, body: string) {
  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setResponseHeader(event, 'Vary', 'Accept, User-Agent')
  return body
}

export default defineEventHandler(async (event) => {
  const pathParam = getRouterParam(event, 'path') || ''
  const path = `/${pathParam}`

  const request = toWebRequest(event)
  const detection = isAIAgent(request)
  const ctx = extractTrackingContext(event)
  const requestType = detection.detected ? 'agent-rewrite' as const : 'md-url' as const

  const collection = resolveCollection(path)
  if (!collection) {
    trackMdRequest(event, { ...ctx, path, source: 'agent-404', requestType, detectionMethod: detection.method })
    return sendMarkdown(event, generateNotFoundMarkdown(path, NOT_FOUND_OPTIONS))
  }

  let rawMd: string
  try {
    rawMd = await $fetch<string>(`/raw${path}.md`)
  } catch {
    trackMdRequest(event, { ...ctx, path, source: 'agent-404', requestType, detectionMethod: detection.method })
    return sendMarkdown(event, generateNotFoundMarkdown(path, NOT_FOUND_OPTIONS))
  }

  trackMdRequest(event, { ...ctx, path, source: resolveSource(path), requestType, detectionMethod: detection.method })

  try {
    const doc = await (queryCollection as QC)(event, collection)
      .where('path', '=', path)
      .first() as { title?: string, description?: string, path?: string } | null

    if (doc?.title && !rawMd.startsWith('---')) {
      rawMd = buildFrontmatter({ title: doc.title, description: doc.description || '', path: doc.path || path }) + '\n' + rawMd
    }
  } catch { /* metadata enrichment is best-effort */ }

  return sendMarkdown(event, rawMd)
})
