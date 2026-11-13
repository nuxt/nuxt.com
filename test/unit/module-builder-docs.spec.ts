import { fileURLToPath } from 'node:url'
import type { Node } from 'comark'
import type { ComarkContent, NavigationItem } from 'comark-content'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildModuleInstanceKey, cliInstanceKey, docsInstanceKey, moduleBuilderInstanceKey, type ContentInstanceKey } from '../../shared/utils/content'
import { MODULE_BUILDER_DOC_VERSIONS, type ModuleBuilderDocVersion } from '../../shared/utils/module-builder'
import { instanceSource } from '../../server/utils/content/instances'
import { docTree, findByPath } from '../../server/utils/content/navigation'
import { createBuildInstance, createInstanceSource } from '../../utils/factory'

const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/${name}/`, import.meta.url))

const instances = new Map<ContentInstanceKey, ComarkContent>()

const moduleBuilder = (version: ModuleBuilderDocVersion) => instances.get(moduleBuilderInstanceKey(version))!
const buildModule = (version: ModuleBuilderDocVersion) => instances.get(buildModuleInstanceKey(version))!
const cli = (version: ModuleBuilderDocVersion) => instances.get(cliInstanceKey(version))!

function hrefs(nodes: Node[]): string[] {
  return nodes.flatMap((node) => {
    if (!Array.isArray(node) || typeof node[0] !== 'string') return []
    const href = (node[1] as Record<string, unknown> | undefined)?.href
    return [...(typeof href === 'string' ? [href] : []), ...hrefs(node.slice(2) as Node[])]
  })
}

const pagePaths = async (content: ComarkContent) =>
  (await content.list()).filter(item => item.meta.extension === '.md').map(item => item.path).sort()

/** The 4.x docs around the grafts: the API section and the Module Author Guide. */
const docsNav = [{
  title: 'Docs',
  path: '/docs/4.x',
  children: [
    { title: 'Guide', path: '/docs/4.x/guide', children: [{ title: 'Module Author Guide', path: '/docs/4.x/guide/modules', children: [{ title: 'Testing', path: '/docs/4.x/guide/modules/testing' }] }] },
    { title: 'API', path: '/docs/4.x/api', children: [{ title: 'Utils', path: '/docs/4.x/api/utils' }] }
  ]
}] as unknown as NavigationItem[]

beforeAll(async () => {
  vi.stubEnv('NUXT_MODULE_BUILDER_PATH', fixture('module-builder'))
  vi.stubEnv('NUXT_CLI_PATH', fixture('cli'))
  for (const version of MODULE_BUILDER_DOC_VERSIONS) {
    for (const key of [moduleBuilderInstanceKey(version), buildModuleInstanceKey(version), cliInstanceKey(version)]) {
      const content = createBuildInstance(key, { source: createInstanceSource(instanceSource(key).source, {}) })
      await content.init({ partial: false })
      instances.set(key, content)
    }
  }
  vi.stubGlobal('getInstanceAtHead', async (key: ContentInstanceKey) => key === docsInstanceKey('4.x')
    ? { navigation: async () => structuredClone(docsNav) }
    : instances.get(key) ?? Promise.reject(new Error(`no ${key} fixture`)))
})

afterAll(async () => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  await Promise.all([...instances.values()].map(content => content.dispose()))
})

describe('module builder docs', () => {
  it('mounts every page inside the version\'s Module Author Guide, leaving out `cli/`', async () => {
    expect(await pagePaths(moduleBuilder('4.x'))).toEqual([
      '/docs/4.x/guide/modules/module-builder',
      '/docs/4.x/guide/modules/module-builder/commands',
      '/docs/4.x/guide/modules/module-builder/output',
      '/docs/4.x/guide/modules/module-builder/project-structure',
      '/docs/4.x/guide/modules/module-builder/upgrade-v2'
    ])
  })

  it('roots its navigation at the Module Builder, with the unnumbered upgrade guide last', async () => {
    const root = findByPath(await moduleBuilder('4.x').navigation(), '/docs/4.x/guide/modules/module-builder')

    expect(root).toMatchObject({ title: 'Module Builder', icon: 'i-lucide-package' })
    expect(root?.children?.map(item => [item.title, item.path])).toEqual([
      ['Getting Started', '/docs/4.x/guide/modules/module-builder'],
      ['Project Structure', '/docs/4.x/guide/modules/module-builder/project-structure'],
      ['Commands', '/docs/4.x/guide/modules/module-builder/commands'],
      ['Build Output', '/docs/4.x/guide/modules/module-builder/output'],
      ['Upgrading to v2', '/docs/4.x/guide/modules/module-builder/upgrade-v2']
    ])
  })

  it.each(MODULE_BUILDER_DOC_VERSIONS)('versions links to its own pages and the Nuxt docs for %s', async (version) => {
    const prefix = `/docs/${version}`
    const [index, structure, commands, output] = await Promise.all([
      moduleBuilder(version).get(`${prefix}/guide/modules/module-builder`),
      moduleBuilder(version).get(`${prefix}/guide/modules/module-builder/project-structure`),
      moduleBuilder(version).get(`${prefix}/guide/modules/module-builder/commands`),
      moduleBuilder(version).get(`${prefix}/guide/modules/module-builder/output`)
    ])

    expect(hrefs(index!.nodes)).toEqual([
      `${prefix}/guide/modules`,
      `${prefix}/api/commands/build-module`,
      `${prefix}/guide/modules/module-builder/project-structure`
    ])
    expect(hrefs(structure!.nodes)).toEqual([`${prefix}/guide/concepts/typescript`])
    expect(hrefs(commands!.nodes)).toEqual([`${prefix}/guide/modules/module-builder/output#types`])
    expect(hrefs(output!.nodes)).toEqual([`${prefix}/guide/modules/module-builder/upgrade-v2#types`])
  })

  it('versions frontmatter links, leaving external ones alone', async () => {
    const commands = await moduleBuilder('4.x').get('/docs/4.x/guide/modules/module-builder/commands')

    expect((commands!.data as { links: Array<{ to: string }> }).links.map(link => link.to)).toEqual([
      '/docs/4.x/api/commands/build-module',
      'https://github.com/nuxt/module-builder/blob/main/src/cli.ts'
    ])
  })
})

describe('build-module command page', () => {
  it.each(MODULE_BUILDER_DOC_VERSIONS)('serves `docs/cli/build-module` at the %s command reference', async (version) => {
    const prefix = `/docs/${version}`
    expect(await pagePaths(buildModule(version))).toEqual([`${prefix}/api/commands/build-module`])

    const page = await buildModule(version).get(`${prefix}/api/commands/build-module`)
    expect(page?.data).toMatchObject({ title: 'nuxt build-module', links: [{ label: 'Source', to: 'https://github.com/nuxt/module-builder/blob/main/src/cli.ts' }] })
    expect(hrefs(page!.nodes)).toEqual([
      `${prefix}/guide/modules/module-builder/commands#build`,
      `${prefix}/guide/modules/module-builder/commands#build-stub`,
      `${prefix}/guide/modules/module-builder/commands#prepare`,
      `${prefix}/guide/modules/module-builder`
    ])
  })

  it('leaves `nuxt/cli`\'s own `build-module.md` out of the cli instance while it still has one', async () => {
    expect(await pagePaths(cli('4.x'))).toEqual([
      '/docs/4.x/api/commands/build',
      '/docs/4.x/api/commands/cleanup',
      '/docs/4.x/api/commands/overview'
    ])
  })

  it('lists it once in the command reference, where `nuxt/cli`\'s entry sorts, like its siblings', async () => {
    const [root] = await docTree('4.x', { withExamples: false })
    const commands = findByPath([root!], '/docs/4.x/api/commands')

    expect(commands?.children?.map(item => [item.title, item.path])).toEqual([
      ['Overview', '/docs/4.x/api/commands/overview'],
      ['nuxt build', '/docs/4.x/api/commands/build'],
      ['nuxt build-module', '/docs/4.x/api/commands/build-module'],
      ['nuxt cleanup', '/docs/4.x/api/commands/cleanup']
    ])
    const [build, buildModuleEntry] = commands!.children!.slice(1, 3)
    expect(Object.keys(buildModuleEntry!).sort()).toEqual(Object.keys(build!).sort())
    expect(buildModuleEntry).toMatchObject({ stem: 'build-module', description: 'Nuxt command to build your Nuxt module before publishing.' })
  })

  it('keeps it out of the Module Builder navigation', async () => {
    const [root] = await docTree('4.x', { withExamples: false })
    const guide = findByPath([root!], '/docs/4.x/guide/modules/module-builder')

    expect(JSON.stringify(guide)).not.toContain('build-module')
  })
})
