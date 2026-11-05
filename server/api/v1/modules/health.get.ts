import type { ModuleHealth } from '#shared/types'

// Split out from the modules list so a slow/failing nuxt.care call can't block
// or poison the list's SWR cache. Keyed by module name; merged in client-side.
export default defineCachedEventHandler(async (event): Promise<Record<string, ModuleHealth>> => {
  const modules = await fetchModules(event) || []
  return await fetchBulkModuleHealth(event, modules)
}, {
  name: 'modules:health',
  swr: true,
  maxAge: 60 * 60 // 1 hour
})
