import type { H3Event } from 'h3'
import type { Module } from '../../../types'
import { defineEventHandler } from '#imports'

export default defineEventHandler(async (event: H3Event) => {
  const { name } = event.context.params
  const { modules } = await $fetch<{ modules: Module[] }>('/api/modules')
  const module = modules.find(module => module.name === name)

  return module
})
