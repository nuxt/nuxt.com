import { defineConfig } from '@playwright/test'
import type { ConfigOptions } from '@nuxt/test-utils/playwright'

export default defineConfig<ConfigOptions>({
  // A fresh preview deployment renders its first payloads cold: `/docs/4.x/getting-started/installation/_payload.json`
  // took 4.7 s, past the default 5 s once the click and route chunk are added.
  expect: { timeout: 15_000 },
  use: {
    nuxt: {
      // TODO: fix issues with local testing with `@nuxt/content`
      // tests against deployment nuxt.com by default
      host: process.env.BASE_URL || 'https://nuxt.com'
    }
  }
})
