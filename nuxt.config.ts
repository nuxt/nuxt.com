import { defineNuxtConfig } from 'nuxt3'

// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  meta: {
    title: 'Nuxt: Intuitive Web Development',
    meta: [
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
      { name: 'description', content: 'Nuxt makes web development intuitive and fun. The open source framework NuxtJS makes the development of modern web applications simple.' }
    ],
    link: [
      { rel: 'icon', href: '/icon.png' }
      // { rel: 'stylesheet', href: 'https://rsms.me/inter/inter.css' }
    ],
    htmlAttrs: {
      class: '/* @unocss-include */ bg-white dark:bg-black'
    },
    bodyAttrs: {
      class: '/* @unocss-include */ antialiased font-sans text-gray-700 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
    }
  },
  components: {
    loader: true,
    dirs: ['~/components/atoms', '~/components/molecules', '~/components/organisms', '~/components/templates']
  },
  css: [
    '~/assets/css/fonts.css'
  ],
  buildModules: [
    '@nuxthq/ui',
    '@nuxtjs/strapi'
  ],
  publicRuntimeConfig: {
    baseUrl: process.env.BASE_URL || 'https://nuxt.com'
  },
  strapi: {
    version: 'v4',
    prefix: '/api',
    cookie: {
      path: '/'
    }
  },
  ui: {
    colors: {
      primary: 'blue',
      gray: 'zinc'
    },
    preset: 'nuxt',
    unocss: {
      theme: {
        fontFamily: {
          sans: '"RoobertPRO", sans-serif'
        }
      }
    }
  }
})
