import type { Deployment } from '../types'

export const useDeployments = () => {
  const deployments = useState<Deployment[]>('deployments', () => [])

  async function fetchList () {
    if (deployments.value.length) {
      return
    }

    try {
      const data = await queryContent<Deployment>('/deployments')
        .where({ _extension: 'md' })
        .without(['body', 'excerpt'])
        .sort({ date: -1 })
        .find()

        deployments.value = (data as Deployment[]).filter(article => article._path !== '/deployments')
    } catch (e) {
      deployments.value = []
      return e
    }
  }

  return {
    deployments,
    fetchList
  }
}
