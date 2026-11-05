import type { H3Event } from 'h3'

const cachedHealth = defineCachedFunction((event: H3Event) => fetchTemplateHealth(event), {
  group: 'nitro/handlers',
  name: 'template-health',
  getKey: () => 'all-v2',
  maxAge: 60 * 10,
  swr: true
})

export default defineEventHandler((event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  return cachedHealth(event)
})
