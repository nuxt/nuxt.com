import type { Module } from '~/types'

export default defineCachedEventHandler(() => {
  return $fetch<{ data: { modules: Module[] }, errors: any }>('https://modules.nuxtjs.org/api/modules')
}, {
  name: 'modules',
  maxAge: 60 * 1000
})
