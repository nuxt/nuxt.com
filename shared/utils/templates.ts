import type { TemplateDeployProvider, PackageManager, Template, TemplateCategory, TemplateHealth, TemplateModule, TemplateSort, TemplateStatusFilter } from '../types/templates'

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

export const PACKAGE_MANAGERS: PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun']

export const PACKAGE_MANAGER_ICONS: Record<PackageManager, string> = {
  pnpm: 'i-logos-pnpm',
  npm: 'i-logos-npm-icon',
  yarn: 'i-logos-yarn',
  bun: 'i-logos-bun'
}

/** Templates on an older major are flagged, so the gallery never silently recommends them. */
export const CURRENT_NUXT_MAJOR = 4

export const SITE_URL = 'https://nuxt.com'

/** How long a live preview sandbox runs before Vercel stops it. */
export const PREVIEW_TIMEOUT_MS = 10 * 60 * 1000

/** Each passing daily check replaces its template's snapshot. The expiry removes the ones nothing replaces: removed or failing templates, lost reports, and runs from local dev or preview deployments. */
export const TEMPLATE_SNAPSHOT_TTL_MS = 3 * 24 * 60 * 60 * 1000

/** Results older than this are hidden rather than shown as current: the daily check has missed the template more than once. */
export const TEMPLATE_CHECK_MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000

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

/** Passed its last daily check on the current Nuxt major. */
export function isWorking(health?: TemplateHealth): boolean {
  return health?.check?.status === 'passed' && !isOutdated(health)
}

export const TEMPLATE_STATUS_FILTERS: Array<{ value: TemplateStatusFilter, label: string, icon: string }> = [
  { value: 'working', label: 'Builds today', icon: 'i-lucide-circle-check' },
  { value: 'live', label: 'Runs live', icon: 'i-lucide-play' }
]

export const TEMPLATE_SORTS: Array<{ value: TemplateSort, label: string }> = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'stars', label: 'Most stars' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'name', label: 'Name' }
]

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
export const DEPLOY_PROVIDERS: Array<{ value: TemplateDeployProvider, label: string, icon: string }> = [
  { value: 'vercel', label: 'Vercel', icon: 'i-simple-icons-vercel' },
  { value: 'netlify', label: 'Netlify', icon: 'i-simple-icons-netlify' }
]

export function deployProviders(template: Pick<Template, 'deploy'>): TemplateDeployProvider[] {
  if (template.deploy?.providers) return template.deploy.providers
  return template.deploy?.stores?.length ? ['vercel'] : DEPLOY_PROVIDERS.map(provider => provider.value)
}

function parseGitHubUrl(url: string): { repository: string, branch?: string, path?: string } | undefined {
  const match = url.replace(/\/$/, '').match(/^https:\/\/github\.com\/([^/]+\/[^/]+)(?:\/tree\/([^/]+)(?:\/(.+))?)?$/)
  return match ? { repository: `https://github.com/${match[1]}`, branch: match[2], path: match[3] } : undefined
}

export function buildDeployUrl(template: Template, provider: TemplateDeployProvider): string | undefined {
  if (!deployProviders(template).includes(provider)) return undefined
  const url = template.deploy?.repositoryUrl || templateRepoUrl(template)
  if (!url) return undefined
  return provider === 'netlify' ? buildNetlifyDeployUrl(template, url) : buildVercelDeployUrl(template, url)
}

function buildNetlifyDeployUrl(template: Template, url: string): string | undefined {
  const source = parseGitHubUrl(url)
  if (!source) return undefined
  const params = new URLSearchParams({ repository: source.repository })
  if (source.branch) params.set('branch', source.branch)
  if (source.path) params.set('create_from_path', source.path)
  const env = template.deploy?.env?.map(key => `${key}=`).join('&')
  return `https://app.netlify.com/start/deploy?${params.toString()}${env ? `#${env}` : ''}`
}

function buildVercelDeployUrl(template: Template, url: string): string {
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
