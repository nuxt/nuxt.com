import { manifestCoverage, type Manifest } from '@diglot/store'
import type { ContentInstanceKey } from '../../../shared/utils/content'
import type { L10nCoverage } from '../../../shared/utils/l10n'
import type { L10nBundle } from './bundle'
import { visibleRecord } from './localise'

/**
 * The sources of the translations repository (`sources.yml`) whose pages the site serves localised,
 * and the instances reading the same repository and branch.
 */
export const TRANSLATION_SOURCES = [
  { name: 'nuxt-main', repo: 'nuxt/nuxt', ref: 'main', dir: 'docs', instances: ['docs:5.x'] },
  { name: 'nuxt-4.x', repo: 'nuxt/nuxt', ref: '4.x', dir: 'docs', instances: ['docs:4.x'] },
  { name: 'nuxt-3.x', repo: 'nuxt/nuxt', ref: '3.x', dir: 'docs', instances: ['docs:3.x'] },
  { name: 'nuxt-cli', repo: 'nuxt/cli', ref: 'main', dir: 'docs', instances: ['cli:4.x', 'cli:5.x'] }
] as const satisfies ReadonlyArray<{ name: string, repo: string, ref: string, dir: string, instances: ContentInstanceKey[] }>

/** A source manifest: the segments of each file, keyed by repository path (`docs/1.getting-started/01.introduction.md`). */
export type SourceManifest = Pick<Manifest, 'files'>

/** Words of every file a manifest lists, keyed by repository path, by what a reader of `bundle` sees. */
export function sourceCoverage(manifest: SourceManifest, bundle: L10nBundle): Record<string, L10nCoverage> {
  return manifestCoverage(manifest, hash => visibleRecord(bundle, hash))
}

/**
 * Coverage of every page of a source, keyed by page path, from the coverage of its files.
 * `pathsOf` maps a repository path to the pages serving it; files without a page are left out.
 */
export function coverageTable(files: Record<string, L10nCoverage>, pathsOf: (file: string) => readonly string[] | undefined): Record<string, L10nCoverage> {
  const table: Record<string, L10nCoverage> = {}
  for (const [file, coverage] of Object.entries(files)) {
    for (const path of pathsOf(file) ?? []) table[path] = coverage
  }
  return table
}

/** The localised pages a change to `hashes` re-renders. */
export interface L10nPagesUsing {
  /** Pages rendering any of `hashes`, unprefixed: every page of the tree when `navigation` is set. */
  pages: string[]
  /** Pages whose own content uses any of `hashes`. */
  content: string[]
  /** Whether a navigation label or page title changed, which every page of the tree renders. */
  navigation: boolean
}

/**
 * The localised pages of `sources` that use any of `hashes`, or every localised page with `'all'`.
 * `paths` maps each file of a source's manifest to the pages serving it.
 */
export function pagesUsing(sources: ReadonlyArray<{ manifest: SourceManifest, paths: ReadonlyMap<string, readonly string[]> }>, hashes: Set<string> | 'all'): L10nPagesUsing {
  let navigation = hashes === 'all'
  const content = new Set<string>()
  for (const { manifest, paths } of sources) {
    for (const [file, segments] of Object.entries(manifest.files ?? {})) {
      const used = hashes === 'all' ? segments : segments.filter(segment => hashes.has(segment.hash))
      if (!used.length) continue
      if (used.some(segment => segment.kind === 'navigation' || segment.kind === 'frontmatter')) navigation = true
      for (const path of paths.get(file) ?? []) content.add(path)
    }
  }
  const pages = new Set(content)
  if (navigation) for (const { paths } of sources) for (const path of [...paths.values()].flat()) pages.add(path)
  return { pages: [...pages].sort(), content: [...content].sort(), navigation }
}
