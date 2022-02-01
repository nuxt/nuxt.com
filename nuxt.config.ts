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
      { rel: 'icon', href: '/icon.png' },
      { rel: 'stylesheet', href: 'https://rsms.me/inter/inter.css' }
    ]
  },
  components: {
    loader: true,
    dirs: ['~/components/atoms', '~/components/molecules', '~/components/organisms', '~/components/templates']
  },
  modules: [
    '@nuxthq/ui',
    '@nuxtjs/strapi'
  ],
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
          sans: '"Inter var", sans-serif'
        }
      }
    }
  }
})
