export default defineNuxtConfig({
  modules: [
    '@nuxt/fonts',
    'eve/nuxt',
  ],

  app: {
    head: {
      title: 'Nuxt + eve',
      meta: [
        { name: 'description', content: 'An issue triage agent built with eve and mounted in Nuxt using the eve/nuxt module.' },
      ],
    },
  },

  css: ['~/assets/main.css'],

  compatibilityDate: '2024-04-03',

  fonts: {
    families: [
      { name: 'Geist', provider: 'google', global: true },
      { name: 'Geist Mono', provider: 'google', global: true },
    ],
  },
})
