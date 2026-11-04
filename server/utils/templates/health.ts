import type { H3Event } from 'h3'
import type { BaseModule, PackageManager, Template, TemplateCheck, TemplateHealth, TemplateModule } from '#shared/types'

interface RepoNode {
  isArchived: boolean
  stargazerCount: number
  licenseInfo: { spdxId: string } | null
  commit: { committedDate: string } | null
  pkg: { text: string } | null
}

function packageJsonPath(template: Template) {
  const subdir = template.source?.replace(/^gh:/, '').split('/').slice(2).join('/')
  return subdir ? `${subdir}/package.json` : 'package.json'
}

const TOOLING = new Set(['@nuxt/devtools', '@nuxt/eslint', '@nuxtjs/eslint-module', '@nuxt/test-utils'])

function parsePackageJson(text: string | undefined, registry: Map<string, BaseModule>) {
  if (!text) return {}
  try {
    const pkg = JSON.parse(text)
    const deps = { ...pkg.devDependencies, ...pkg.dependencies } as Record<string, string>
    const nuxt = deps.nuxt
    const major = nuxt === 'latest' ? undefined : Number(nuxt?.match(/(\d+)\./)?.[1]) || undefined
    const modules = Object.keys(deps)
      .filter(npm => registry.has(npm) && !TOOLING.has(npm))
      .map((npm): TemplateModule => {
        const { name, icon, description } = registry.get(npm)!
        return { npm, name, icon, description }
      })
    return {
      nuxt,
      nuxtMajor: major,
      packageManager: pkg.packageManager?.split('@')[0] as PackageManager | undefined,
      modules
    }
  } catch {
    return {}
  }
}

/** Repository facts for every template with a public repo, in one GraphQL request. */
const fetchRepoHealth = cachedFunction(async (event: H3Event): Promise<Record<string, TemplateHealth>> => {
  const templates = (await listByDir<Template>('/templates')).filter(template => template.repo)
  const registry = new Map((await fetchModules(event) || []).map(module => [module.npm, module]))

  const fields = templates.map((template, index) => {
    const [owner, name] = template.repo!.split('/')
    const ref = template.branch || 'HEAD'
    return `t${index}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) {
      isArchived stargazerCount licenseInfo { spdxId }
      commit: object(expression: ${JSON.stringify(ref)}) { ... on Commit { committedDate } }
      pkg: object(expression: ${JSON.stringify(`${ref}:${packageJsonPath(template)}`)}) { ... on Blob { text } }
    }`
  })
  const { data } = await $fetch<{ data: Record<string, RepoNode | null> }>('https://api.github.com/graphql', {
    method: 'POST',
    headers: githubHeaders(event),
    body: { query: `query { ${fields.join('\n')} }` }
  })

  return Object.fromEntries(templates.map((template, index) => {
    const repo = data[`t${index}`]
    if (!repo) return [template.slug, {}]
    return [template.slug, {
      archived: repo.isArchived,
      stars: repo.stargazerCount,
      license: repo.licenseInfo?.spdxId === 'NOASSERTION' ? undefined : repo.licenseInfo?.spdxId,
      updatedAt: repo.commit?.committedDate,
      ...parsePackageJson(repo.pkg?.text, registry)
    } satisfies TemplateHealth]
  }))
}, { name: 'template-repo-health', getKey: () => 'all', maxAge: 60 * 60 * 12 })

const minor = (version: string) => version.split('.').slice(0, 2).join('.')

const fetchLatestNuxt = cachedFunction(async () => {
  return (await $fetch<{ version: string }>('https://registry.npmjs.org/nuxt/latest')).version
}, { name: 'nuxt-latest-version', getKey: () => 'latest', maxAge: 60 * 60 })

/** The last result of `checkTemplatesWorkflow` for each template. */
async function fetchTemplateChecks(): Promise<Record<string, TemplateCheck>> {
  const [rows, latest] = await Promise.all([listTemplateChecks(), fetchLatestNuxt().catch(() => undefined)])
  return Object.fromEntries(rows.flatMap((row) => {
    if (!row.status || !row.checkedAt) return []
    const passed = row.status === 'passed'
    const nuxt = passed ? row.nuxt ?? undefined : undefined
    return [[row.slug, {
      status: row.status,
      step: row.step ?? undefined,
      nuxt,
      latest: !!nuxt && !!latest && minor(nuxt) === minor(latest),
      checkedAt: row.checkedAt.toISOString(),
      passedAt: row.passedAt?.toISOString(),
      live: passed && !!row.snapshotId
    } satisfies TemplateCheck]]
  }))
}

export async function fetchTemplateHealth(event: H3Event): Promise<Record<string, TemplateHealth>> {
  const [repos = {}, checks = {}] = await Promise.all([
    fetchRepoHealth(event).catch((error): Record<string, TemplateHealth> => {
      console.error('[templates] repository health failed', error)
      return {}
    }),
    fetchTemplateChecks().catch((error): Record<string, TemplateCheck> => {
      console.error('[templates] checks failed', error)
      return {}
    })
  ])
  const slugs = new Set([...Object.keys(repos), ...Object.keys(checks)])
  return Object.fromEntries([...slugs].map(slug => [slug, { ...repos[slug], check: checks[slug] }]))
}
