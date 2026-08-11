import { defineConfig } from '@playwright/test'
import type { ConfigOptions } from '@nuxt/test-utils/playwright'

export default defineConfig<ConfigOptions>({
  use: {
    nuxt: {
      // TODO: fix issues with local testing with comark-content remote docs sources
      // tests against deployment nuxt.com by default
      host: process.env.BASE_URL || 'https://nuxt.com'
    }
  }
})
