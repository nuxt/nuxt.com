import type { Filter, Job } from '../types'
import { toRelativeDate } from '../utils'

export const useEnterpriseJobs = () => {
  const route = useRoute()
  const jobs = useState<Job[]>('jobs', () => [])

  const mapRemote = (remoteType: string) => {
    switch (remoteType) {
      case 'ONLY':
        return 'Remote Only'
      case 'ALLOWED':
        return 'Remote Allowed'
      default:
        return 'Onsite'
    }
  }

  // Data fetching

  async function fetchList() {
    if (jobs.value.length) {
      return
    }

    const res = await $fetch<Job[]>('https://api.nuxt.com/jobs')

    jobs.value = res.map((job) => {
      return { ...job, remote: mapRemote(job.remote), published_at: toRelativeDate(job.published_at) }
    })
  }

  // Computed

  const filteredJobs = computed<Job[]>(() => {
    return [...jobs.value]
      .filter((job) => {
        if (selectedLocation.value && !job.locations.includes(selectedLocation.value.key as string)) {
          return false
        }
        if (selectedType.value && job.remote !== selectedType.value.key) {
          return false
        }
        return true
      })
  })

  const locations = computed<Filter[]>(() => {
    const locations = jobs.value?.map(job => job.locations).flat() || []
    return [...new Set(locations)]
      .map(l => ({ key: l, label: l }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  const types = computed<Filter[]>(() => {
    const types = jobs.value?.map(job => job.remote)
    return [...new Set(types)]
      .map((t) => {
        return { key: t, label: t }
      })
  })

  const selectedLocation = computed(() => {
    return locations.value.find(location => location.key === route.query.location)
  })

  const selectedType = computed(() => {
    return types.value.find(type => type.key === route.query.type)
  })

  return {
    fetchList,
    filteredJobs,
    locations,
    types,
    selectedLocation,
    selectedType
  }
}
