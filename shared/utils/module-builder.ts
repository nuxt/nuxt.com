import { cliDocsPathPrefix } from './cli'
import { docsPathPrefix, type ArchivedDocVersion, type DocVersion, type RepoRefs } from './docs'

export const MODULE_BUILDER_DOCS_REPO = 'nuxt/module-builder'

// TODO: read `main` once nuxt/module-builder#818 (the docs) is merged.
const MODULE_BUILDER_DOCS_BRANCH = 'docs-source-of-truth'

// Archived versions have no Module Author Guide to mount it in.
export const MODULE_BUILDER_DOCS_REFS = {
  '3.x': { branch: MODULE_BUILDER_DOCS_BRANCH, envOverride: 'NUXT_MODULE_BUILDER_PATH' },
  '4.x': { branch: MODULE_BUILDER_DOCS_BRANCH, envOverride: 'NUXT_MODULE_BUILDER_PATH' },
  '5.x': { branch: MODULE_BUILDER_DOCS_BRANCH, envOverride: 'NUXT_MODULE_BUILDER_PATH' }
} as const satisfies Record<Exclude<DocVersion, ArchivedDocVersion>, RepoRefs>

/** Versions with the Module Builder docs. */
export type ModuleBuilderDocVersion = keyof typeof MODULE_BUILDER_DOCS_REFS

export const MODULE_BUILDER_DOC_VERSIONS = Object.keys(MODULE_BUILDER_DOCS_REFS) as ModuleBuilderDocVersion[]

/** Whether a version has the Module Builder docs. */
export function hasModuleBuilderDocs(version: string): version is ModuleBuilderDocVersion {
  return (MODULE_BUILDER_DOC_VERSIONS as string[]).includes(version)
}

/** Where a version's Module Author Guide is, which the Module Builder docs are grafted into. */
export function moduleAuthorGuidePath(version: DocVersion): string {
  return `${docsPathPrefix(version)}/guide/modules`
}

/** Where a version's Module Builder docs are mounted: shared by the server's source prefix and the client's page check. */
export function moduleBuilderDocsPathPrefix(version: DocVersion): string {
  return `${moduleAuthorGuidePath(version)}/module-builder`
}

/** The directory of `docs/` holding the `nuxt build-module` page, served apart from the Module Builder docs. */
export const BUILD_MODULE_DOCS_DIR = 'cli/build-module'

/** The `nuxt/cli` page the `nuxt build-module` page replaces. */
export const CLI_BUILD_MODULE_FILE = 'build-module.md'

/** Where a version's `nuxt build-module` page is mounted, in its command reference. */
export function buildModuleDocsPathPrefix(version: DocVersion): string {
  return `${cliDocsPathPrefix(version)}/build-module`
}
