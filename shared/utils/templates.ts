import type { PackageManager, Template, TemplateCategory, TemplateHealth, TemplateModule } from '../types/templates'

export const TEMPLATE_CATEGORIES: Array<{ value: TemplateCategory, label: string, icon: string }> = [
  { value: 'saas', label: 'SaaS', icon: 'i-lucide-rocket' },
  { value: 'dashboard', label: 'Dashboard', icon: 'i-lucide-layout-dashboard' },
  { value: 'ai', label: 'AI', icon: 'i-lucide-message-circle' },
  { value: 'docs', label: 'Docs', icon: 'i-lucide-book-open' },
  { value: 'content', label: 'Blog & Content', icon: 'i-lucide-newspaper' },
  { value: 'landing', label: 'Landing', icon: 'i-lucide-app-window' },
  { value: 'portfolio', label: 'Portfolio', icon: 'i-lucide-user-round' },
  { value: 'ecommerce', label: 'E-commerce', icon: 'i-lucide-shopping-bag' },
  { value: 'app', label: 'Apps', icon: 'i-lucide-layers' }
]

export const PACKAGE_MANAGERS: PackageManager[] = ['npm', 'pnpm', 'yarn', 'bun']

/** Templates on an older major are flagged, so the gallery never silently recommends them. */
export const CURRENT_NUXT_MAJOR = 4

export const SITE_URL = 'https://nuxt.com'

/** Each passing daily check replaces its template's snapshot. The expiry removes the ones nothing replaces: removed or failing templates, lost reports, and runs from local dev or preview deployments. */
export const TEMPLATE_SNAPSHOT_TTL_MS = 3 * 24 * 60 * 60 * 1000

const MODULE_LABELS: Record<string, string> = {
  '@nuxt/ui': 'Nuxt UI',
  '@nuxt/content': 'Content',
  '@nuxt/image': 'Image',
  '@nuxt/fonts': 'Fonts',
  '@nuxt/scripts': 'Scripts',
  '@nuxt/eslint': 'ESLint',
  '@nuxthub/core': 'NuxtHub',
  '@nuxtjs/i18n': 'i18n',
  '@nuxtjs/supabase': 'Supabase',
  '@nuxtjs/tailwindcss': 'Tailwind CSS',
  '@nuxtjs/color-mode': 'Color Mode',
  '@pinia/nuxt': 'Pinia',
  '@vueuse/nuxt': 'VueUse',
  '@comark/nuxt': 'Comark',
  '@unocss/nuxt': 'UnoCSS',
  '@nuxtjs/seo': 'SEO',
  '@vueuse/motion/nuxt': 'Motion',
  'motion-v': 'Motion',
  'nuxt-auth-utils': 'Auth Utils',
  'nuxt-og-image': 'OG Image',
  'nuxt-csurf': 'CSRF',
  'shadcn-nuxt': 'shadcn-vue'
}

/** A short, readable name for a module package (`@nuxt/content` → `Content`, `@scope/nuxt` → `Scope`). */
export function moduleLabel(name: string): string {
  if (MODULE_LABELS[name]) return MODULE_LABELS[name]
  const [, scope, rest = name] = name.match(/^@([^/]+)\/(.+)$/) || []
  const base = rest.replace(/\/nuxt$/, '').replace(/^nuxt-|-nuxt$|^nuxt$/g, '') || scope || name
  return base.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

export function isStarter(template: Pick<Template, 'kind'>): boolean {
  return template.kind === 'starter'
}

/** Templates without a public repository (paid ones) can only be bought. */
export function isScaffoldable(template: Pick<Template, 'repo' | 'template' | 'source'>): boolean {
  return !!(template.template || template.source || template.repo)
}

/** Templates that start without secrets, so the daily check can run them and snapshot them for live previews. */
export function canLivePreview(template: Pick<Template, 'repo' | 'purchase' | 'deploy' | 'template'>): boolean {
  return !!template.repo && !template.purchase && !template.deploy?.env?.length && template.template !== 'module'
}

/** Archived, or still on an older Nuxt major. */
export function isOutdated(health?: TemplateHealth): boolean {
  return !!health && (!!health.archived || (health.nuxtMajor !== undefined && health.nuxtMajor < CURRENT_NUXT_MAJOR))
}

/** The modules a template ships: read from its `package.json` when nuxt.com could, from its YAML otherwise. */
export function templateModules(template: Pick<Template, 'modules'>, health?: TemplateHealth): TemplateModule[] {
  return health?.modules?.length ? health.modules : (template.modules || []).map(npm => ({ npm }))
}

export function templatePackageManager(template: Pick<Template, 'packageManager'>, health?: TemplateHealth): PackageManager | undefined {
  return health?.packageManager || template.packageManager
}

export function templateImage(template: Pick<Template, 'slug' | 'kind'>): string | undefined {
  return isStarter(template) ? undefined : `/assets/templates/${template.slug}.webp`
}

/** The directory of a `gh:owner/repo/dir` source. */
function sourceSubdir(template: Pick<Template, 'source'>): string | undefined {
  return template.source?.replace(/^gh:/, '').split('/').slice(2).join('/') || undefined
}

export function templateRepoUrl(template: Pick<Template, 'repo' | 'branch' | 'source'>): string | undefined {
  if (!template.repo) return undefined
  const subdir = sourceSubdir(template)
  if (subdir) return `https://github.com/${template.repo}/tree/${template.branch || 'main'}/${subdir}`
  return `https://github.com/${template.repo}${template.branch ? `/tree/${template.branch}` : ''}`
}

/** What `create-nuxt -t` accepts: a registry name for starters, a giget source otherwise. */
export function templateSource(template: Pick<Template, 'template' | 'source' | 'repo'>): string | undefined {
  if (template.template) return template.template
  if (template.source) return template.source
  if (template.repo) return `gh:${template.repo}`
  return undefined
}

export function defaultProjectName(template: Pick<Template, 'slug' | 'kind'>): string {
  return isStarter(template) ? 'my-nuxt-app' : `my-${template.slug.replace(/^nuxt-ui-/, '')}`
}

const RUNNERS: Record<PackageManager, (name: string) => string> = {
  npm: name => `npm create nuxt@latest ${name} --`,
  pnpm: name => `pnpm create nuxt@latest ${name}`,
  yarn: name => `yarn create nuxt ${name}`,
  bun: name => `bun create nuxt@latest ${name}`
}

export function buildCreateCommand(template: Template, packageManager: PackageManager): string | undefined {
  const source = templateSource(template)
  if (!source) return undefined
  return `${RUNNERS[packageManager](defaultProjectName(template))} -t ${source}`
}

/** A Vercel Deploy Button URL: clones the template into the visitor's GitHub and deploys it, asking for its environment variables. */
export function buildDeployUrl(template: Template): string | undefined {
  const url = template.deploy?.repositoryUrl || templateRepoUrl(template)
  if (!url) return undefined

  const name = defaultProjectName(template)
  const params = new URLSearchParams({ 'repository-url': url, 'project-name': name, 'repository-name': name })
  if (template.deploy?.env?.length) params.set('env', template.deploy.env.join(','))
  if (template.deploy?.stores?.length) params.set('stores', JSON.stringify(template.deploy.stores))
  if (template.demo) {
    params.set('demo-title', template.name)
    params.set('demo-description', template.description)
    params.set('demo-url', template.demo)
    const image = templateImage(template)
    if (image) params.set('demo-image', `${SITE_URL}${image}`)
  }
  return `https://vercel.com/new/clone?${params.toString()}`
}

/** `github/<owner>/<repo>[/tree/<branch>[/<dir>]]`, the path StackBlitz and CodeSandbox both open. */
function editorPath(template: Template): string | undefined {
  if (!template.repo) return undefined
  const subdir = sourceSubdir(template)
  const branch = template.branch || (subdir ? 'main' : undefined)
  return `github/${template.repo}${branch ? `/tree/${branch}` : ''}${subdir ? `/${subdir}` : ''}`
}

export function buildStackBlitzUrl(template: Template): string | undefined {
  const path = editorPath(template)
  return path && `https://stackblitz.com/${path}`
}

export function buildCodeSandboxUrl(template: Template): string | undefined {
  const path = editorPath(template)
  return path && `https://codesandbox.io/s/${path}`
}
