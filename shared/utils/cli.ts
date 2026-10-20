import type { ArchivedDocVersion, DocVersion, RepoRefs } from './docs'

// The `nuxt/cli` repo backing the command reference.
export const CLI_DOCS_REPO = 'nuxt/cli'

// Archived versions predate `nuxi`, so they have no command reference.
export const CLI_DOCS_REFS = {
  '3.x': { branch: '3.x', envOverride: 'NUXT_CLI_PATH' },
  '4.x': { branch: 'main', envOverride: 'NUXT_CLI_PATH' },
  '5.x': { branch: 'main', envOverride: 'NUXT_CLI_PATH' }
} as const satisfies Record<Exclude<DocVersion, ArchivedDocVersion>, RepoRefs>

/** Versions with a command reference. */
export type CliDocVersion = keyof typeof CLI_DOCS_REFS

export const CLI_DOC_VERSIONS = Object.keys(CLI_DOCS_REFS) as CliDocVersion[]

/** Whether a version has a command reference. */
export function hasCliDocs(version: string): version is CliDocVersion {
  return (CLI_DOC_VERSIONS as string[]).includes(version)
}

// Excluded from the docs source; served by the separate `cli:<version>` instance instead.
export const CLI_DOCS_PREFIX = '4.api/4.commands'

/** Where a version's command reference is mounted — shared by the server's source prefix and the client's page check. */
export function cliDocsPathPrefix(version: DocVersion): string {
  return `/docs/${version}/api/commands`
}
