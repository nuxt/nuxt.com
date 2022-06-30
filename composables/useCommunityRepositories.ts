import type { Ref } from 'vue'
import { sum, uniq } from 'lodash-es'
import { CommunityRepository, CommunityRepositoryStats } from '~/types'

export const useCommunityRepositories = () => {
  const repositories: Ref<CommunityRepository[]> = useState('community-repositories', () => [])
  const route = useRoute()

  const pending = ref(false)

  // Http
  async function fetch () {
    if (repositories.value.length) {
      return
    }

    pending.value = true

    try {
      const data = await $fetch<{ repositories: CommunityRepository[] }>('/api/community/repositories', { params: { owners: owners.map(owner => owner.key) } })

      repositories.value = data.repositories
    } catch (e) {
      repositories.value = []
    }

    pending.value = false
  }

  // Data
  const owners = [{
    key: 'nuxt',
    title: 'Nuxt'
  }, {
    key: 'nuxt-community',
    title: 'Nuxt Community'
  }, {
    key: 'unjs',
    title: 'Unified JS'
  }, {
    key: 'nuxtlabs',
    title: 'NuxtLabs'
  }]

  const sorts = [
    { key: 'stargazerCount', label: 'Stars' },
    { key: 'forkCount', label: 'Forks' },
    { key: 'updatedAt', label: 'Updated' },
    { key: 'createdAt', label: 'Created' }
  ]

  const orders = [
    { key: 'desc', label: 'Descending', icon: 'heroicons-outline:sort-descending' },
    { key: 'asc', label: 'Ascending', icon: 'heroicons-outline:sort-ascending' }
  ]

  // Computed
  const organizations = computed(() => {
    return owners.map(owner => ({
      key: owner.key,
      title: owner.title,
      to: {
        name: 'community-repositories',
        query: {
          ...route.query,
          organization: route.query?.organization !== owner.key ? owner.key : undefined
        },
        params: { smooth: '#smooth' }
      }
    }))
  })

  const stats: Ref<CommunityRepositoryStats> = computed(() => {
    return {
      count: repositories.value.length,
      stars: sum(repositories.value.map(repo => repo.stargazerCount)),
      collaborators: uniq(repositories.value.flatMap(repo => repo.collaborators?.nodes.map(collab => collab.id))).length
    }
  })

  const selectedOrganization = computed(() => {
    return organizations.value.find(org => org.key === route.query?.organization)
  })

  const selectedSort = computed(() => {
    return sorts.find(sort => sort.key === route.query.sortBy) || sorts[0]
  })

  const selectedOrder = computed(() => {
    return orders.find(order => order.key === route.query.orderBy) || orders[0]
  })

  const q = computed(() => {
    return route.query.q
  })

  return {
    // Http
    fetch,
    // Data
    repositories,
    owners,
    sorts,
    orders,
    // Computed
    organizations,
    stats,
    selectedOrganization,
    selectedSort,
    selectedOrder,
    q
  }
}
