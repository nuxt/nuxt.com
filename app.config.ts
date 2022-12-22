export default defineAppConfig({
  website: {
    title: 'Nuxt',
    head: {
      titleTemplate: '%s · Nuxt',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Build your next Vue.js application with confidence using Nuxt. An open source framework under MIT license that makes web development simple and powerful.' },
        { name: 'og:description', content: 'Build your next Vue.js application with confidence using Nuxt. An open source framework under MIT license that makes web development simple and powerful.' },
        { name: 'og:site_name', content: 'Nuxt' },
        { name: 'og:type', content: 'website' },
        { name: 'og:image', content: 'https://nuxt.com/social.jpg' },
        { name: 'og:image:alt', content: 'Nuxt' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@nuxt_js' }
      ],
      link: [
        { rel: 'icon', href: '/icon.png' }
      ],
      htmlAttrs: {
        lang: 'en'
      },
      bodyAttrs: {
        class: 'antialiased font-sans text-gray-700 dark:text-gray-200 bg-white dark:bg-black [--scroll-mt:10rem] lg:[--scroll-mt:7rem]'
      }
    }
  }
})
