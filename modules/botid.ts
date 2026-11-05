import { defineNuxtModule } from 'nuxt/kit'

// Replaces `botid/nuxt` until https://github.com/vercel/botid-package/pull/170 is released:
// its `proxy` route rules run inside the function on Vercel, so every visitor is classified as a bot.
const PROTECTION_PATH = '/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3'
const CHALLENGE_URL = `${PROTECTION_PATH}/a-4-a/c.js`
const SERVICE_ORIGIN = 'https://api.vercel.com/bot-protection'

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export default defineNuxtModule({
  meta: {
    name: 'botid'
  },
  setup(_options, nuxt) {
    nuxt.options.routeRules[CHALLENGE_URL] = { proxy: `${SERVICE_ORIGIN}/v1/challenge` }
    nuxt.options.routeRules[`${PROTECTION_PATH}/**`] = {
      proxy: `${SERVICE_ORIGIN}/v1/proxy/**`,
      headers: { 'X-Frame-Options': 'SAMEORIGIN' }
    }

    nuxt.hook('nitro:config', (config) => {
      config.vercel ||= {}
      config.vercel.config ||= {}
      type VercelRoutes = NonNullable<typeof config.vercel.config.routes>
      config.vercel.config.routes = [
        { src: `^${escapeRegExp(CHALLENGE_URL)}$`, dest: `${SERVICE_ORIGIN}/v1/challenge` },
        {
          src: `^${escapeRegExp(PROTECTION_PATH)}/(.*)$`,
          dest: `${SERVICE_ORIGIN}/v1/proxy/$1`,
          headers: { 'X-Frame-Options': 'SAMEORIGIN' }
        },
        ...(config.vercel.config.routes || [])
      ] as VercelRoutes
    })
  }
})
