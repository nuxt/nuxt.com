export type TemplateCategory = 'saas' | 'dashboard' | 'ai' | 'docs' | 'content' | 'portfolio' | 'landing' | 'ecommerce' | 'app'

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

/** An entry of a Vercel Deploy Button `stores` parameter. */
export type DeployStore
  = | { type: 'blob', access?: 'public' | 'private' }
    | { type: 'integration', integrationSlug: string, productSlug: string, protocol: string }

/**
 * A template (`content/templates/*.yml`) or an official starter (`content/templates/starters/*.yml`).
 *
 * Starters are the `create-nuxt` registry templates (`npm create nuxt -- -t <template>`) that replace nuxt.new.
 */
export interface Template {
  path: string
  name: string
  slug: string
  description: string
  /** `owner/repo` on GitHub. Absent on paid templates, which only have a `purchase` link. */
  repo?: string
  branch?: string
  demo?: string
  purchase?: string
  badge?: 'Premium' | 'Freemium' | 'Free'
  featured?: boolean
  category?: TemplateCategory
  /** Maintained by the Nuxt team. */
  official?: boolean
  /** giget source when the template lives in a subdirectory (`gh:owner/repo/dir`). */
  source?: string
  /** Only for templates without a public repo: read from `package.json` otherwise. */
  packageManager?: PackageManager
  /** Only for templates without a public repo: read from `package.json` otherwise. */
  modules?: string[]
  deploy?: {
    env?: string[]
    stores?: DeployStore[]
    /** Overrides the cloned URL when the template lives in a subdirectory. */
    repositoryUrl?: string
  }
  kind?: 'starter'
  /** The `create-nuxt` registry name of a starter. */
  template?: string
  icon?: string
  docs?: string
  order?: number
}

/** A Nuxt module a template ships. `name` and `icon` come from the modules registry, when the package is listed there. */
export interface TemplateModule {
  npm: string
  name?: string
  icon?: string
  description?: string
}

/** What nuxt.com reads from a template's repository and its nightly preview build, so listings stay current without manual edits. */
export interface TemplateHealth {
  /** The `nuxt` range in `package.json`, e.g. `^4.2.0`. */
  nuxt?: string
  nuxtMajor?: number
  archived?: boolean
  /** Date of the last commit on the template's branch. */
  updatedAt?: string
  license?: string
  stars?: number
  packageManager?: PackageManager
  /** Nuxt modules found in `package.json`, without dev tooling. */
  modules?: TemplateModule[]
  check?: TemplateCheck
}

export type TemplateCheckStep = 'install' | 'build' | 'start'

/** The last daily check (`checkTemplatesWorkflow`): install, build and, for templates that need no secrets, start and load every asset. */
export interface TemplateCheck {
  status: 'passed' | 'failed'
  step?: TemplateCheckStep
  /** The Nuxt version installed from the template's lockfile. */
  nuxt?: string
  /** Whether that version is on the latest Nuxt minor. */
  latest?: boolean
  checkedAt: string
  /** The last check that passed. Set on a failing check when the template passed before, so it now fails. */
  passedAt?: string
  /** The check started the app and snapshotted it, so it can run live. Off while the template fails, even if an older snapshot exists. */
  live: boolean
}

/** What `checkTemplatesWorkflow` needs to check a template. */
export interface TemplateToCheck {
  slug: string
  repo: string
  branch?: string
  /** `gh:owner/repo/subdir` when the template lives in a subdirectory. */
  source?: string
  /** It runs without secrets, so the check starts it and snapshots it for live previews. */
  live: boolean
}

/** What a running check is doing, in order. */
export const TEMPLATE_CHECK_PHASES = ['setup', 'install', 'build', 'start', 'snapshot'] as const
export type TemplateCheckPhase = typeof TEMPLATE_CHECK_PHASES[number]

export interface TemplateCheckPhaseTiming {
  phase: TemplateCheckPhase
  /** Epoch milliseconds. */
  startedAt: number
  /** Set once the phase ended. */
  seconds?: number
}
