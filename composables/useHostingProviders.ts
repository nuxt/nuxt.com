import type { Hosting } from '../types'

export const useHostingProviders = () => {
  const providers = useState<Hosting[]>('hostingProviders', () => [])

  async function fetchList () {
    if (providers.value.length) {
      return
    }

    try {
      const data = await queryContent<Hosting>('/deploy')
        .where({ _extension: 'md' })
        .without(['body', 'excerpt'])
        .sort({ date: -1 })
        .find()

        providers.value = (data as Hosting[]).filter(article => article._path !== '/deploy')
    } catch (e) {
      providers.value = []
      return e
    }
  }

  return {
    providers,
    fetchList
  }
}
