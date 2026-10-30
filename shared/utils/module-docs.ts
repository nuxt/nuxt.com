/**
 * Modules whose documentation nuxt.com hosts under their module page, e.g. `/modules/icon/configuration`.
 *
 * Keyed by the module's `name` in the `nuxt/modules` registry. A module without an entry keeps
 * the README-only page: the docs navigation only exists when a source is configured here.
 * The source's `index.md` replaces the README on the module page, so it must have one.
 */
export const MODULE_DOCS = {
  icon: { title: 'Nuxt Icon', repo: 'nuxt/icon', branch: 'main', contentDir: 'docs', envOverride: 'NUXT_ICON_PATH' },
  devtools: { title: 'Nuxt DevTools', repo: 'nuxt/devtools', branch: 'main', contentDir: 'docs', envOverride: 'NUXT_DEVTOOLS_PATH' },
  fonts: { title: 'Nuxt Fonts', repo: 'nuxt/fonts', branch: 'main', contentDir: 'docs', envOverride: 'NUXT_FONTS_PATH' },
  hints: { title: 'Nuxt Hints', repo: 'nuxt/hints', branch: 'main', contentDir: 'docs', envOverride: 'NUXT_HINTS_PATH' }
} as const satisfies Record<string, {
  /** Names the docs where the registry data is not at hand: `/llms.txt` sections. */
  title: string
  repo: string
  branch: string
  contentDir: string
  envOverride?: string
}>

/** Modules with hosted docs. */
export type ModuleDocsName = keyof typeof MODULE_DOCS

export const MODULE_DOCS_NAMES = Object.keys(MODULE_DOCS) as ModuleDocsName[]

/** Whether a module has hosted docs. */
export function hasModuleDocs(name: string): name is ModuleDocsName {
  return Object.hasOwn(MODULE_DOCS, name)
}

/** Where a module's docs are mounted — its module page. */
export function moduleDocsPathPrefix(name: ModuleDocsName): string {
  return `/modules/${name}`
}
