import type { DeployProvider } from '#shared/types'

export const useHostingProviders = () => {
  const { data: providers, execute } = useAsyncData(() => listByDir<DeployProvider>('/deploy'), {
    immediate: false,
    default: () => [],
    transform: data => [...data].sort((a, b) => Number(b.sponsor ?? 0) - Number(a.sponsor ?? 0))
  })

  async function fetchList() {
    if (providers.value.length) {
      return
    }

    return execute()
  }

  return {
    providers,
    fetchList
  }
}
