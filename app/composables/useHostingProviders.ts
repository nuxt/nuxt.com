import { clientContent } from '~/composables/client-content'

export const useHostingProviders = () => {
  const { data: providers, execute } = useAsyncData(async () => {
    const items = await clientContent.list('local')
    return items
      .filter(i => i.path.startsWith('/deploy/') && i.path !== '/deploy')
      .sort((a, b) => (b.data.sponsor ? 1 : 0) - (a.data.sponsor ? 1 : 0))
  }, {
    immediate: false,
    default: () => []
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
