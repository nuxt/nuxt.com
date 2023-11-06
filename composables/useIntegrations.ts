import type { Integration } from '../types'

export const useIntegrations = () => {
  const integrations = useState<Integration[]>('integrations', () => [])

  async function fetchList () {
    if (integrations.value.length) {
      return
    }

    try {
      const data = await queryContent<Integration>('/integrations')
        .where({ _extension: 'md' })
        .without(['body', 'excerpt'])
        .sort({ date: -1 })
        .find()

        integrations.value = (data as Integration[]).filter(article => article._path !== '/integrations')
    } catch (e) {
      integrations.value = []
      return e
    }
  }

  return {
    integrations,
    fetchList
  }
}
