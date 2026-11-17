import { test as base } from '@nuxt/test-utils/playwright'

export { expect } from '@nuxt/test-utils/playwright'

// Set by the e2e workflow to get through Vercel Deployment Protection. Only requests to the deployment under test get
// it, so third-party resources never see it. A redirect keeps the header, which the deployment's own redirects need
// (`/docs` redirects to `/docs/getting-started/introduction`).
const token = process.env.VERCEL_TRUSTED_OIDC_TOKEN
const origin = process.env.BASE_URL && new URL(process.env.BASE_URL).origin

export const test = base.extend({
  context: async ({ context }, use) => {
    if (token && origin) {
      await context.route(url => url.origin === origin, route => route.continue({
        headers: { ...route.request().headers(), 'x-vercel-trusted-oidc-idp-token': token }
      }))
    }
    await use(context)
  }
})
