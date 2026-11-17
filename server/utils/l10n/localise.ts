import type { ApplySegmentEvent, SegmentStatus, TranslationRecord } from '@diglot/core'
import { recordStatus, wordsByStatus } from '@diglot/core'
import { apply, extract, translateLabel } from '@diglot/comark'
import type { Node } from 'comark'
import { textContent } from 'comark/utils'
import type { ContentFile, NavigationItem } from 'comark-content'
import { L10N_LOCALES, isLocalisedPage, type L10nCoverage, type L10nPageMeta, type L10nSegmentSource } from '../../../shared/utils/l10n'
import type { L10nBundle } from './bundle'

/** Statuses a reader sees in place of a translation: the block keeps its English source. */
const ENGLISH_STATUSES = new Set<SegmentStatus>(['untranslated', 'rejected'])

/** Statuses only shown when the locale shows machine translations. */
const MACHINE_STATUSES = new Set<SegmentStatus>(['machine', 'pending-review'])

interface TocLink {
  id: string
  text: string
  children?: TocLink[]
}

/** The records `bundle` lets a reader see, under the locale's machine translation switch. */
export function visibleRecord(bundle: L10nBundle, hash: string): TranslationRecord | undefined {
  const record = bundle.record(hash)
  if (!record || L10N_LOCALES[bundle.locale].machine) return record

  return MACHINE_STATUSES.has(recordStatus(record)) ? undefined : record
}

/**
 * A copy of `file` with every valid translation from `bundle` substituted, and its provenance.
 *
 * Each translated block carries `data-l10n` (its status) and `data-l10n-hash`; a block showing its
 * English source also carries `lang="en"`. Frontmatter and the table of contents are translated too.
 */
export async function localise<T extends Pick<ContentFile, 'path' | 'data' | 'nodes' | 'meta'>>(file: T, bundle: L10nBundle): Promise<T & { meta: T['meta'] & { l10n: L10nPageMeta } }> {
  const events: ApplySegmentEvent[] = []

  const { doc } = await apply(
    { frontmatter: (file.data ?? {}) as Record<string, unknown>, nodes: (file.nodes ?? []) as Node[] },
    segment => visibleRecord(bundle, segment.hash),
    {
      policy: bundle.policy,
      spanSources: false,
      onSegment(event) {
        events.push(event)
        const { status, target } = event
        if (!target || !status || event.outcome === 'skipped') return

        target.setAttribute('data-l10n', status)
        target.setAttribute('data-l10n-hash', event.segment.hash)
        if (ENGLISH_STATUSES.has(status)) target.setAttribute('lang', 'en')
      }
    }
  )

  markComponents(doc.nodes, events)

  const byStatus = wordsByStatus(events)
  const coverage: L10nCoverage = { words: Object.values(byStatus).reduce((sum, words) => sum + (words ?? 0), 0), byStatus }

  const meta = { ...(file.meta as Record<string, unknown>) } as Record<string, unknown> & { toc?: { links?: TocLink[] } }
  if (meta.toc?.links?.length) {
    meta.toc = { ...meta.toc, links: relabelToc(meta.toc.links, headingTexts(doc.nodes, meta.toc.links)) }
  }

  const l10n: L10nPageMeta = { locale: bundle.locale, sha: bundle.sha, coverage }

  return { ...file, data: doc.frontmatter, nodes: doc.nodes, meta: { ...meta, l10n } } as T & { meta: T['meta'] & { l10n: L10nPageMeta } }
}

/** The English source and provenance of the segment `hash` of `file`, `undefined` when the page has no such segment. */
export async function segmentSource(file: Pick<ContentFile, 'data' | 'nodes'>, bundle: L10nBundle, hash: string): Promise<L10nSegmentSource | undefined> {
  const { segments } = await extract({ frontmatter: (file.data ?? {}) as Record<string, unknown>, nodes: (file.nodes ?? []) as Node[] }, { policy: bundle.policy })
  const segment = segments.find(item => item.hash === hash)
  if (!segment) return

  const record = visibleRecord(bundle, hash)
  return {
    hash,
    source: segment.text,
    status: recordStatus(record, segment),
    ...(record?.verifiedBy ? { by: record.verifiedBy.by } : record?.by ? { by: record.by } : {}),
    ...(record?.mt ? { model: record.mt.model } : {}),
    ...(record ? { updatedAt: record.updatedAt } : {})
  }
}

/**
 * A plain label (a navigation or page title, or a `titleTemplate`) in `bundle`'s locale, or `label`
 * itself without a valid translation. `%s` is kept as a placeholder.
 */
export function localiseLabel(label: string, bundle: L10nBundle, detail?: 'title' | 'titleTemplate'): string {
  return translateLabel(label, segment => visibleRecord(bundle, segment.hash), { detail, policy: bundle.policy })
}

/** A navigation tree with the titles and title templates of localised pages and their directories translated. */
export function localiseNavigation(items: NavigationItem[], bundle: L10nBundle): NavigationItem[] {
  return items.map((item) => {
    const children = item.children ? localiseNavigation(item.children, bundle) : undefined
    const localised = isLocalisedPage(`${item.path}/index`)
    return {
      ...item,
      ...(localised && item.title ? { title: localiseLabel(item.title, bundle, 'title') } : {}),
      ...(localised && typeof item.titleTemplate === 'string' ? { titleTemplate: localiseLabel(item.titleTemplate, bundle, 'titleTemplate') } : {}),
      ...(children ? { children } : {})
    }
  })
}

/**
 * Mark each component whose props were translated (`read-more`, `card`…) like a block, with the
 * status and hash of its first translated prop, so the editor can be opened from it.
 */
function markComponents(nodes: Node[], events: ApplySegmentEvent[]): void {
  const pending = new Map<string, ApplySegmentEvent[]>()
  for (const event of events) {
    if (event.segment.kind !== 'prop' || !event.status || event.outcome === 'skipped') continue
    const key = `${event.segment.context.containers.at(-1)}:${event.segment.context.detail}`
    pending.set(key, [...pending.get(key) ?? [], event])
  }
  if (!pending.size) return

  const visit = (node: Node) => {
    if (!Array.isArray(node) || typeof node[0] !== 'string') return
    const attrs = node[1] as Record<string, unknown> | undefined
    for (const [name, value] of Object.entries(attrs ?? {})) {
      const queue = pending.get(`${node[0]}:${name}`)
      const event = queue?.[0]
      if (!event || (value !== event.segment.text && value !== event.record?.text)) continue
      queue!.shift()
      if (attrs!['data-l10n-hash']) continue
      attrs!['data-l10n'] = event.status
      attrs!['data-l10n-hash'] = event.segment.hash
      if (ENGLISH_STATUSES.has(event.status!)) attrs!.lang = 'en'
    }
    for (let i = 2; i < node.length; i++) visit(node[i] as Node)
  }
  nodes.forEach(visit)
}

/** Text of the headings the table of contents links to, by id. */
function headingTexts(nodes: Node[], links: TocLink[]): Map<string, string> {
  const ids = new Set<string>()
  const collect = (list: TocLink[]) => list.forEach((link) => {
    ids.add(link.id)
    if (link.children) collect(link.children)
  })
  collect(links)

  const texts = new Map<string, string>()
  const visit = (node: Node) => {
    if (!Array.isArray(node) || typeof node[0] !== 'string') return
    const id = (node[1] as Record<string, unknown> | undefined)?.id
    if (typeof id === 'string' && ids.has(id) && /^h[1-6]$/.test(node[0])) {
      texts.set(id, textContent(node).trim())
      return
    }
    for (let i = 2; i < node.length; i++) visit(node[i] as Node)
  }
  nodes.forEach(visit)

  return texts
}

function relabelToc(links: TocLink[], texts: Map<string, string>): TocLink[] {
  return links.map(link => ({
    ...link,
    text: texts.get(link.id) || link.text,
    ...(link.children ? { children: relabelToc(link.children, texts) } : {})
  }))
}
