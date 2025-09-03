export const useHostingProviders = () => {
  const { data: providers, execute } = useAsyncData(() => queryCollection('deploy').all(), {
    immediate: false,
    default: () => [],
    transform: data => data.filter(article => article.path !== '/deploy')
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
