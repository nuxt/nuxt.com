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
          setupFiles: ['./test/nuxt/setup.ts'],
          hookTimeout: 60_000,
          env: {
            // Skip spawning `eve dev` during @nuxt/test-utils setup (30s+ on CI).
            EVE_BASE_URL: 'http://127.0.0.1:1'
          },
          environmentOptions: {
            nuxt: {
              overrides: {
                ogImage: { enabled: false },
                experimental: { viteEnvironmentApi: false },
                eve: { configureVercelJson: false }
              }
            }
          }
        }
      })
    ]
  }
})
