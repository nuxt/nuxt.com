import type { H3Event } from 'h3'

export const getNuxtVersion = defineCachedFunction(async (event: H3Event) => {
  const data = await $fetch<any>('https://registry.npmjs.org/nuxt/latest').catch(() => null)

  if (!data || !data.version) { 
    return null
  }

  return data.version
}, {
  maxAge: 60 * 60,
  name: 'getNuxtVersion'
})