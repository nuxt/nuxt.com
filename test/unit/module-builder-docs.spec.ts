import { fileURLToPath } from 'node:url'
import type { Node } from 'comark'
import type { ComarkContent } from 'comark-content'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { moduleBuilderInstanceKey } from '../../shared/utils/content'
import type { ModuleBuilderDocVersion } from '../../shared/utils/module-builder'
import { instanceSource } from '../../server/utils/content/instances'
import { findByPath } from '../../server/utils/content/navigation'
import { createBuildInstance, createInstanceSource } from '../../utils/factory'

const CLONE = fileURLToPath(new URL('../fixtures/module-builder/', import.meta.url))

const instances = new Map<ModuleBuilderDocVersion, ComarkContent>()

const moduleBuilder = (version: ModuleBuilderDocVersion) => instances.get(version)!

function hrefs(nodes: Node[]): string[] {
  return nodes.flatMap((node) => {
    if (!Array.isArray(node) || typeof node[0] !== 'string') return []
    const href = (node[1] as Record<string, unknown> | undefined)?.href
    return [...(typeof href === 'string' ? [href] : []), ...hrefs(node.slice(2) as Node[])]
  })
}

beforeAll(async () => {
  vi.stubEnv('NUXT_MODULE_BUILDER_PATH', CLONE)
  for (const version of ['3.x', '4.x', '5.x'] as const) {
    const key = moduleBuilderInstanceKey(version)
    const content = createBuildInstance(key, { source: createInstanceSource(instanceSource(key).source, {}) })
    await content.init({ partial: false })
    instances.set(version, content)
  }
})

afterAll(async () => {
  vi.unstubAllEnvs()
  await Promise.all([...instances.values()].map(content => content.dispose()))
})

describe('module builder docs', () => {
  it('mounts every page inside the version\'s Module Author Guide', async () => {
    const paths = (await moduleBuilder('4.x').list()).filter(item => item.meta.extension === '.md').map(item => item.path).sort()

    expect(paths).toEqual([
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

  it.each(['3.x', '4.x', '5.x'] as const)('versions links to its own pages and the Nuxt docs for %s', async (version) => {
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
