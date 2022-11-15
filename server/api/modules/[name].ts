import type { Module } from '../../../types'
import { defineEventHandler } from '#imports'

export default defineEventHandler(async (event) => {
  return await $fetch<Module>(`https://modules.nuxtjs.org/api/modules/${event.context.params.name}`)
})
