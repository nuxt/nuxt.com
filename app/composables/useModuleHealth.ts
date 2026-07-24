import type { ModuleHealth } from '#shared/types'

// Health map (module name -> health), fetched client-only so nuxt.care stays off
// the SSR path. Shared `key` dedupes across every consumer.
export const useModuleHealth = () => {
  const { data: health } = useFetch<Record<string, ModuleHealth>>('/api/v1/modules/health', {
    key: 'modules-health',
    server: false,
    lazy: true,
    default: () => ({})
  })

  return { health }
}
