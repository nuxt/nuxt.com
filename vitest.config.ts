import { defineConfig, defaultExclude } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          exclude: [
            ...defaultExclude,
            '.data/**',
            'test/browser/**',
            'test/nuxt/**'
          ]
        }
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          environment: 'nuxt',
          // Nuxt environment setup (beforeAll) can exceed the 10s default on CI
          hookTimeout: 60000,
          include: ['test/nuxt/**.spec.ts'],
          setupFiles: ['./test/nuxt/setup.ts'],
          environmentOptions: {
            nuxt: {
              overrides: {
                ogImage: { enabled: false },
                experimental: { viteEnvironmentApi: false }
              }
            }
          }
        }
      })
    ]
  }
})
