import type { NuxtJob } from '../types'

export const useNuxtJobs = () => {
  const jobs = useState<NuxtJob[]>('jobs', () => [])
  const route = useRoute()

  // Http

  async function fetch () {
    if (jobs.value.length) {
      return
    }

    jobs.value = await $fetch<NuxtJob[]>('/api/jobs')
  }

  // Computed

  const locations = computed(() => {
    const locations = jobs.value.map(job => job.location)
    return [...new Set(locations)]
      .map(l => ({ value: l, text: l }))
      .sort((a, b) => a.text.localeCompare(b.text))
  })

  const types = computed(() => {
    const types = jobs.value.map(job => job.type)
    return [...new Set(types)]
      .map((t) => {
        const type = t.replace('-', ' ')
        const text = `${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()}`
        return { value: t, text }
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
