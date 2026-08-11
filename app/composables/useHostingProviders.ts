import { clientContent } from '~/composables/client-content'
import { toSitePage } from '~/utils/content'

export const useHostingProviders = () => {
  const { data: providers, execute } = useAsyncData(async () => {
    const items = await clientContent.list('local')
    return items
      .filter(i => i.path.startsWith('/deploy/') && i.path !== '/deploy')
      .map(i => toSitePage(i))
      .filter(Boolean)
      .sort((a, b) => {
        const aSponsor = (a as any).sponsor ? 1 : 0
        const bSponsor = (b as any).sponsor ? 1 : 0
        return bSponsor - aSponsor
      })
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
