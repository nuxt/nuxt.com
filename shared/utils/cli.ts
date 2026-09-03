import type { DocVersion } from './docs'

// The `nuxt/cli` repo backing the command reference.
export const CLI_DOCS_REPO = 'nuxt/cli'

export const CLI_DOCS_REFS = {
  '3.x': { branch: '3.x', envOverride: 'NUXT_CLI_PATH' },
  '4.x': { branch: '3.x', envOverride: 'NUXT_CLI_PATH' },
  '5.x': { branch: 'main', envOverride: 'NUXT_CLI_PATH' }
} as const satisfies Record<DocVersion, { branch: string, envOverride: string }>

// Excluded from the docs source; served by the separate `cli:<version>` instance instead.
export const CLI_DOCS_PREFIX = '4.api/4.commands'

/** Where a version's command reference is mounted — shared by the server's source prefix and the client's page check. */
export function cliDocsPathPrefix(version: DocVersion): string {
  return `/docs/${version}/api/commands`
}
