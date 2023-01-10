import type { H3Event } from 'h3'
import type { Module } from '../../../types'
import { defineEventHandler } from '#imports'

export default defineEventHandler(async (event: H3Event) => {
  return await $fetch<Module>(`https://modules.nuxtjs.org/api/modules/${event.context.params.name}`)
})
