import { afterEach, describe, expect, it, vi } from 'vitest'
import { CONTENT_INSTANCE_KEYS, buildModuleInstanceKey, cliInstanceKey, moduleBuilderInstanceKey } from '../../shared/utils/content'
import { MODULE_BUILDER_DOC_VERSIONS } from '../../shared/utils/module-builder'
import { instanceSource } from '../../server/utils/content/instances'
import { instancePlugins } from '../../server/utils/content/plugins'

/**
 * comark-content validates the instance name it is given positionally, and throws at construction
 * on anything else. Mirrored from `INSTANCE_NAME` in comark-content's `content.js` (not exported).
 */
// eslint-disable-next-line regexp/prefer-w, regexp/use-ignore-case -- kept byte-identical to upstream so it can be diffed
const INSTANCE_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/

describe('instanceSource', () => {
  it('describes every instance the site serves', () => {
    expect(CONTENT_INSTANCE_KEYS.length).toBeGreaterThan(0)
    for (const key of CONTENT_INSTANCE_KEYS) {
      expect(() => instanceSource(key), key).not.toThrow()
    }
  })

  it('names every instance with a valid comark-content identifier', () => {
    for (const key of CONTENT_INSTANCE_KEYS) {
      expect(instanceSource(key).name, key).toMatch(INSTANCE_NAME)
    }
  })

  it('gives every instance a repo, a branch and a content directory', () => {
    for (const key of CONTENT_INSTANCE_KEYS) {
      const { source } = instanceSource(key)
      expect(source.repo, key).toMatch(/^[\w.-]+\/[\w.-]+$/)
      expect(source.branch, key).toBeTruthy()
      expect(source.contentDir, key).toBeTruthy()
    }
  })

  it('mounts every instance under an absolute prefix', () => {
    for (const key of CONTENT_INSTANCE_KEYS) {
      expect(instanceSource(key).source.prefix, key).toMatch(/^\//)
    }
  })

  it('rejects an unknown instance key', () => {
    expect(() => instanceSource('docs:9.x' as never)).toThrow()
  })

  describe('module builder', () => {
    afterEach(() => vi.unstubAllEnvs())

    it('reads the `nuxt/module-builder` docs into each version\'s Module Author Guide', () => {
      expect(MODULE_BUILDER_DOC_VERSIONS).toEqual(['3.x', '4.x', '5.x'])
      for (const version of MODULE_BUILDER_DOC_VERSIONS) {
        expect(instanceSource(moduleBuilderInstanceKey(version))).toEqual({
          name: 'module_builder',
          source: {
            repo: 'nuxt/module-builder',
            branch: 'docs-source-of-truth',
            contentDir: 'docs',
            prefix: `/docs/${version}/guide/modules/module-builder`,
            listingFields: ['title', 'description', 'navigation', 'titleTemplate', 'icon'],
            exclude: ['README.md', '**/*.json', 'cli/**'],
            envOverride: 'NUXT_MODULE_BUILDER_PATH'
          }
        })
      }
    })

    it('reads its `nuxt build-module` page into each version\'s command reference', () => {
      for (const version of MODULE_BUILDER_DOC_VERSIONS) {
        expect(instanceSource(buildModuleInstanceKey(version))).toEqual({
          name: 'build_module',
          source: {
            repo: 'nuxt/module-builder',
            branch: 'docs-source-of-truth',
            contentDir: 'docs/cli/build-module',
            prefix: `/docs/${version}/api/commands/build-module`,
            listingFields: ['title', 'description', 'navigation', 'titleTemplate', 'icon'],
            exclude: ['README.md', '**/*.json'],
            envOverride: 'NUXT_MODULE_BUILDER_PATH'
          }
        })
        expect(instanceSource(cliInstanceKey(version)).source.exclude).toContain('build-module.md')
      }
    })

    it('parses both with the command reference\'s plugins, versioning their `/docs/*` links', () => {
      const names = (key: Parameters<typeof instancePlugins>[0]) => instancePlugins(key).map(plugin => plugin.name)
      for (const version of MODULE_BUILDER_DOC_VERSIONS) {
        expect(names(moduleBuilderInstanceKey(version))).toEqual(names(cliInstanceKey(version)))
        expect(names(buildModuleInstanceKey(version))).toEqual(names(cliInstanceKey(version)))
        expect(names(buildModuleInstanceKey(version))).toContain('nuxt-docs-links')
      }
    })

    it('lets NUXT_MODULE_BUILDER_BRANCH override the branch', () => {
      vi.stubEnv('NUXT_MODULE_BUILDER_BRANCH', 'feat/docs')
      expect(instanceSource(moduleBuilderInstanceKey('4.x')).source.branch).toBe('feat/docs')
      expect(instanceSource(buildModuleInstanceKey('4.x')).source.branch).toBe('feat/docs')
    })

    it('rejects a version without a Module Author Guide', () => {
      expect(() => instanceSource('module-builder:2.x' as never)).toThrow()
      expect(() => instanceSource('build-module:2.x' as never)).toThrow()
    })
  })

  describe('site ref', () => {
    const SHA = 'a'.repeat(40)

    afterEach(() => vi.unstubAllEnvs())

    it('reads main in production', () => {
      vi.stubEnv('VERCEL_ENV', 'production')
      vi.stubEnv('VERCEL_GIT_COMMIT_SHA', SHA)
      expect(instanceSource('site').source.branch).toBe('main')
    })

    it('reads the built commit on a preview, so its code and content match', () => {
      vi.stubEnv('VERCEL_ENV', 'preview')
      vi.stubEnv('VERCEL_GIT_COMMIT_SHA', SHA)
      expect(instanceSource('site').source.branch).toBe(SHA)
    })

    it('lets NUXT_COM_BRANCH override the preview commit', () => {
      vi.stubEnv('VERCEL_ENV', 'preview')
      vi.stubEnv('VERCEL_GIT_COMMIT_SHA', SHA)
      vi.stubEnv('NUXT_COM_BRANCH', 'feat/x')
      expect(instanceSource('site').source.branch).toBe('feat/x')
    })

    it('leaves other instances on their branch', () => {
      vi.stubEnv('VERCEL_ENV', 'preview')
      vi.stubEnv('VERCEL_GIT_COMMIT_SHA', SHA)
      expect(instanceSource('examples').source.branch).toBe('main')
    })
  })
})
