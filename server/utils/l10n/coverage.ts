import { recordStatus } from '@diglot/core'
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

/** One segment of a source manifest (`.diglot/manifest/<source>.json`). */
export interface ManifestSegment {
  hash: string
  words: number
  kind?: string
}

/** A source manifest: the segments of each file, keyed by repository path (`docs/1.getting-started/01.introduction.md`). */
export interface SourceManifest {
  files: Record<string, ManifestSegment[]>
}

/** Words of one file's segments, by what a reader of `bundle` sees. */
export function fileCoverage(segments: ManifestSegment[], bundle: L10nBundle): L10nCoverage {
  const coverage: L10nCoverage = { words: 0, byStatus: {} }
  for (const { hash, words } of segments) {
    if (!words) continue
    const status = recordStatus(visibleRecord(bundle, hash))
    coverage.words += words
    coverage.byStatus[status] = (coverage.byStatus[status] ?? 0) + words
  }
  return coverage
}

/** Coverage of every file a manifest lists, keyed by repository path. */
export function sourceCoverage(manifest: SourceManifest, bundle: L10nBundle): Record<string, L10nCoverage> {
  return Object.fromEntries(Object.entries(manifest.files ?? {}).map(([file, segments]) => [file, fileCoverage(segments, bundle)]))
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
