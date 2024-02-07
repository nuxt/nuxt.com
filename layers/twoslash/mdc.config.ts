import { defineConfig } from '@nuxtjs/mdc/config'

// TODO: read them from the local file system
const shim = `
import type { RuntimeConfig } from 'nuxt/schema'
import type { H3Event } from 'h3'
import type { NuxtIslandContext, NuxtIslandResponse, NuxtRenderHTMLContext } from 'nuxt/dist/core/runtime/nitro/renderer'

declare module 'nitropack' {
  interface NitroRuntimeConfigApp {
    buildAssetsDir: string
    cdnURL: string
  }
  interface NitroRuntimeConfig extends RuntimeConfig {}
  interface NitroRouteConfig {
    ssr?: boolean
    experimentalNoScripts?: boolean
  }
  interface NitroRouteRules {
    ssr?: boolean
    experimentalNoScripts?: boolean
  }
  interface NitroRuntimeHooks {
    'render:html': (htmlContext: NuxtRenderHTMLContext, context: { event: H3Event }) => void | Promise<void>
    'render:island': (islandResponse: NuxtIslandResponse, context: { event: H3Event, islandContext: NuxtIslandContext }) => void | Promise<void>
  }
}

declare module 'vue' {
  interface GlobalComponents {
    'NuxtLink': typeof import("nuxt/dist/app/components/nuxt-link")['default']
    'NuxtPage': typeof import("nuxt/dist/pages/runtime/page")['default']
    'NoScript': typeof import("nuxt/dist/head/runtime/components")['NoScript']
    'Link': typeof import("nuxt/dist/head/runtime/components")['Link']
    'Base': typeof import("nuxt/dist/head/runtime/components")['Base']
    'Title': typeof import("nuxt/dist/head/runtime/components")['Title']
    'Meta': typeof import("nuxt/dist/head/runtime/components")['Meta']
    'Style': typeof import("nuxt/dist/head/runtime/components")['Style']
    'Head': typeof import("nuxt/dist/head/runtime/components")['Head']
    'Html': typeof import("nuxt/dist/head/runtime/components")['Html']
    'Body': typeof import("nuxt/dist/head/runtime/components")['Body']
  }
}

export {}
`

export default defineConfig({
  shiki: {
    transformers: async (_code, _lang, _theme, options) => {
      // We only runs TwoSlash at build time
      // As Nuxt Content cache the result automatically, we don't need to ship twoslash in any production bundle
      if (import.meta.server && (import.meta.prerender || import.meta.dev)) {
        // TODO: read them from the local file system
        const prepend = [
          '/// <reference path="./shim.d.ts" />',
          'import { defineNuxtConfig } from \'nuxt/config\'',
          'import { useRuntimeConfig, defineAppConfig } from \'nuxt/dist/app/nuxt\'',
          'import { defineNuxtRouteMiddleware, navigateTo } from \'nuxt/dist/app/composables/router\'',
          'import { useRouter, useRoute } from \'vue-router\'',
          'import { useAsyncData } from \'nuxt/dist/app/composables/asyncData\'',
          'import { $fetch } from \'ofetch\'',
          'import { ref, computed, watch, onMounted, watchEffect } from \'vue\'',
          'import { defineNitroPlugin } from \'nitropack/dist/runtime/plugin\'',
          'import { useHead, useHeadSafe, useSeoMeta } from \'@unhead/vue\'',
          'import { definePageMeta } from \'nuxt/dist/pages/runtime/composables\'',
          ''
        ].join('\n')

        if (typeof options.meta === 'string' && options.meta?.includes('twoslash')) {
          // console.log('RENDERING TWOSLASH', _code)
          const { transformerTwoslash, rendererFloatingVue } = await import('@shikijs/vitepress-twoslash')
          return [
            transformerTwoslash({
              renderer: rendererFloatingVue({
                floatingVue: {
                  classMarkdown: 'prose prose-primary dark:prose-invert'
                }
              }),
              twoslashOptions: {
                extraFiles: {
                  'index.ts': { prepend },
                  'index.tsx': { prepend },
                  'shim.d.ts': shim
                },
                compilerOptions: {
                  lib: ['esnext', 'dom']
                }
              }
            })
          ]
        }
        // TODO: we should fallback to a transformer that remove twoslash notations for plain text
      }
      return []
    }
  }
})
