import { addComponentsDir, addImportsDir, addRouteMiddleware, addServerHandler, addServerImportsDir, createResolver, defineNuxtModule, extendPages } from 'nuxt/kit'
import type { FeedbackModuleOptions } from './types'

export default defineNuxtModule<FeedbackModuleOptions>({
  meta: {
    name: 'feedback',
    configKey: 'feedback'
  },
  defaults: {
    adminPath: '/_feedback/admin'
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const adminPath = options.adminPath!.replace(/\/$/, '')

    nuxt.options.runtimeConfig.public.feedback = {
      adminPath
    }

    nuxt.hook('hub:db:schema:extend', async ({ dialect, paths }: { dialect: string, paths: string[] }) => {
      if (dialect === 'sqlite') {
        paths.push(resolve('./runtime/server/db/schema.sqlite.ts'))
      }
    })

    addComponentsDir({
      path: resolve('./runtime/components'),
      prefix: 'Feedback'
    })

    addImportsDir(resolve('./runtime/composables'))

    addServerImportsDir(resolve('./runtime/server/utils'))

    addServerHandler({
      route: '/api/_feedback',
      method: 'get',
      handler: resolve('./runtime/server/api/feedback/index.get')
    })

    addServerHandler({
      route: '/api/_feedback',
      method: 'post',
      handler: resolve('./runtime/server/api/feedback/index.post')
    })

    addServerHandler({
      route: '/api/_feedback/:id',
      method: 'delete',
      handler: resolve('./runtime/server/api/feedback/[id].delete')
    })

    addServerHandler({
      route: '/api/auth/github',
      method: 'get',
      handler: resolve('./runtime/server/api/auth/github.get')
    })

    addRouteMiddleware({
      name: 'feedback-auth',
      path: resolve('./runtime/middleware/auth')
    })

    addRouteMiddleware({
      name: 'feedback-guest',
      path: resolve('./runtime/middleware/guest')
    })

    extendPages((pages) => {
      pages.push({
        name: 'feedback-admin',
        path: adminPath,
        file: resolve('./runtime/pages/admin/index.vue')
      })

      pages.push({
        name: 'feedback-admin-login',
        path: `${adminPath}/login`,
        file: resolve('./runtime/pages/admin/login.vue')
      })
    })

    nuxt.options.routeRules[adminPath] = { ssr: false }
    nuxt.options.routeRules[`${adminPath}/**`] = { ssr: false }

    nuxt.hook('prepare:types', ({ references }) => {
      references.push({
        path: resolve('./types.ts')
      })
    })
  }
})

export type { FeedbackModuleOptions } from './types'
export { FEEDBACK_OPTIONS, FEEDBACK_RATINGS, feedbackSchema, feedbackFormSchema } from './types'
export type { FeedbackRating, FeedbackItem, FeedbackSubmission, PageAnalytic, FeedbackInput } from './types'
