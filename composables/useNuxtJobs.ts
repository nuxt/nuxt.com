import type { Ref } from 'vue'
import type { NuxtJob } from '../types'
import { toRelativeDate } from '../utils'

export const useNuxtJobs = () => {
  const route = useRoute()
  const jobs: Ref<NuxtJob[] | []> = useState('jobs', () => [])

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

  async function fetchList () {
    const { data, error } = await useFetch<NuxtJob[]>('/api/jobs.json')

    /* Missing data is handled at component level */
    if (!data.value && error.value) {
      return error.value
    }

    jobs.value = data.value?.map((job) => {
      return { ...job, remote: mapRemote(job.remote), published_at: toRelativeDate(job.published_at) }
    }) || []
  }

  // Computed

  const filteredJobs = computed(() => {
    return [...jobs.value]
      .filter((job) => {
        if (selectedLocation.value && !job.locations.includes(selectedLocation.value.value)) {
          return false
        }
        if (selectedType.value && job.remote !== selectedType.value.value) {
          return false
        }
        return true
      })
  })

  const locations = computed(() => {
    const locations = jobs.value?.map(job => job.locations).flat() || []
    return [...new Set(locations)]
      .map(l => ({ value: l, text: l }))
      .sort((a, b) => a.text.localeCompare(b.text))
  })

  const types = computed(() => {
    const types = jobs.value?.map(job => job.remote)
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
    fetchList,
    filteredJobs,
    locations,
    types,
    selectedLocation,
    selectedType
  }
}
