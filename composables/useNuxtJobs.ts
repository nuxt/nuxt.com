import type { NuxtJobs } from '../types'
import { toRelativeDate } from '../utils'

export const useNuxtJobs = () => {
  const jobs = useState<NuxtJobs>('jobs', () => [])
  const route = useRoute()

  const mapRemote = (remoteType) => {
    switch (remoteType) {
      case 'ONLY':
        return 'Remote Only'
      case 'ALLOWED':
        return 'Remote Allowed'
      default:
        return 'Onsite'
    }
  }

  // Http

  async function fetch () {
    if (jobs.value?.data?.length) {
      return
    }

    jobs.value = await $fetch<NuxtJobs>('/api/jobs')
    jobs.value.data = jobs.value.data.map((job) => {
      return { ...job, remote: mapRemote(job.remote), published_at: toRelativeDate(job.published_at) }
    })
  }

  // Computed

  const locations = computed(() => {
    const locations = jobs.value?.data?.map(job => job.locations).flat() || []
    return [...new Set(locations)]
      .map(l => ({ value: l, text: l }))
      .sort((a, b) => a.text.localeCompare(b.text))
  })

  const types = computed(() => {
    const types = jobs.value?.data?.map(job => job.remote)
    return [...new Set(types)]
      .map((t) => {
        return { value: t, text: t }
      })
  })

  const selectedLocation = computed(() => {
    return locations.value.find(location => location.value === route.query.location)
  })

  const selectedType = computed(() => {
    return types.value.find(type => type.value === route.query.type)
  })

  return {
    // Http
    fetch,
    // Data
    jobs,
    // Computed
    locations,
    types,
    selectedLocation,
    selectedType
  }
}
