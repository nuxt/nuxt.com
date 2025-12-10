import { defineConfig } from '@playwright/test'
import type { ConfigOptions } from '@nuxt/test-utils/playwright'

export default defineConfig<ConfigOptions>({
  use: {
    nuxt: {
      // TODO: fix issues with local testing with `@nuxt/content`
      // tests against deployment nuxt.com by default
      host: process.env.BASE_URL || 'https://nuxt.com'
    }
  }
})
