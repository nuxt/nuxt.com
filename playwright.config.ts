import { defineConfig } from '@playwright/test'
import type { ConfigOptions } from '@nuxt/test-utils/playwright'

export default defineConfig<ConfigOptions>({
  use: {
    nuxt: {
      // TODO: fix issues with local testing with `@nuxt/content`
      // tests against deployment nuxt.com by default
      host: process.env.BASE_URL || 'https://nuxt.com'
    },
    // Set by the e2e workflow to get through Vercel Deployment Protection on preview deployments
    extraHTTPHeaders: process.env.VERCEL_TRUSTED_OIDC_TOKEN
      ? { 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_TRUSTED_OIDC_TOKEN }
      : undefined
  }
})
