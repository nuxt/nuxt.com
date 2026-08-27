// Single source of truth for which `nuxt/cli` ref backs each docs version's
// command reference. `3.x` is the released CLI; `main` is where v4 is developed and
// where `@nuxt/cli-nightly` is published from, which is what `nuxt-nightly@5.x`
// depends on, so a 5.x reader sees the CLI they actually install. Consumed by two
// surfaces that must agree, or pages resolve their assets against a different ref
// than they were parsed from:
//
//   - content.config.ts   → the `cliV*Source` collection sources
//   - nuxt.config.ts      → `content:file:beforeParse` asset URL rewriting
export const CLI_DOCS_REPO = 'nuxt/cli'

// TODO: repoint docsv4 to `main` when the CLI v4 releases.
export const CLI_DOCS_REFS = {
  docsv3: '3.x',
  docsv4: '3.x',
  docsv5: 'main'
} as const

// Command docs live at `docs/` in `nuxt/cli` but mount under the API section of
// each version tree, so this is both the source `prefix` and the marker that
// identifies a CLI-sourced file inside the parse hook.
export const CLI_DOCS_PREFIX = '4.api/4.commands'
