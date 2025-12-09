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
          include: ['test/nuxt/**.spec.ts'],
          setupFiles: ['../test/nuxt/setup.ts'],
          environmentOptions: {
            nuxt: {
              overrides: {
                ogImage: { enabled: false }
              }
            }
          }
        }
      })
    ]
  }
})
