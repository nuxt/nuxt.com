import type { Module } from '~/types'

export default defineEventHandler(async (event) => {
  return await $fetch<Module>(`http://localhost:3001/api/modules/${event.context.params.name}`)
})
