// Shared refs keep command docs and their asset URLs on the same CLI version.
export const CLI_DOCS_REPO = 'nuxt/cli'

export const CLI_DOCS_REFS = {
  docsv3: '3.x',
  docsv4: 'main',
  docsv5: 'main'
} as const

// Command docs live at `docs/` in `nuxt/cli` but mount under the API section of
// each version tree, so this is both the source `prefix` and the marker that
// identifies a CLI-sourced file inside the parse hook.
export const CLI_DOCS_PREFIX = '4.api/4.commands'
