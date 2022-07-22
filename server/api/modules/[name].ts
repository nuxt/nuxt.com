import type { Module } from '~/types'

export default defineEventHandler(async (event) => {
  return await $fetch<Module>(`https://modules.nuxtjs.org/api/modules/${event.context.params.name}`)
})
