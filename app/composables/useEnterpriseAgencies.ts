import type { Agency, Filter } from '../types'
import { slugify, random } from '../utils'

export const useEnterpriseAgencies = () => {
  const route = useRoute()
  const agencies = useState<Agency[]>('enterprise-agencies', () => [])

  // Data fetching
  async function fetchList() {
    if (agencies.value.length) {
      return
    }

    try {
      const { data: agenciesData } = await useAsyncData('agencies', () => queryCollection('agencies').all())

      if (agenciesData.value && Array.isArray(agenciesData.value)) {
        agencies.value = agenciesData.value.map((agency: any) => ({
          ...agency,
          services: (agency.services || []).map((service: string) => ({
            key: slugify(service),
            title: service
          })),
          regions: (agency.regions || []).map((region: string) => ({
            key: slugify(region),
            title: region
          })),
          location: agency.location
            ? {
                key: slugify(agency.location),
                title: agency.location
              }
            : null
        })) as Agency[]
      }
    } catch (e) {
      agencies.value = []
      return e
    }
  }

  // Computed

  const filteredAgencies = computed<Agency[]>(() => {
    return [...agencies.value]
      .filter((agency) => {
        if (selectedService.value && !agency.services.find(service => service.key === selectedService.value?.key)) {
          return false
        }
        if (selectedRegion.value && !agency.regions.find(region => region.key === selectedRegion.value?.key)) {
          return false
        }

        return true
      })
  })

  const services = computed<Filter[]>(() => {
    const ids = new Set<string>()
    const services = agencies.value.flatMap((agency) => {
      return agency.services.filter((r) => {
        if (ids.has(r.key as string)) {
          return false
        }
        ids.add(r.key as string)
        return true
      })
    })
    return services
      .map((service) => {
        const currentService = route.query.service?.toString() || ''
        const isSelected = currentService === service.key

        return {
          ...service,
          exactQuery: true,
          active: isSelected,
          to: {
            name: 'enterprise-agencies',
            query: {
              ...route.query,
              service: isSelected ? undefined : service.key
            },
            state: { smooth: '#smooth' }
          }
        }
      })
      .sort((a, b) => {
        if (a.title && b.title) {
          return a.title.localeCompare(b.title)
        }
        return 0
      })
  })

  const locations = computed<Filter[]>(() => {
    return [...new Set(agencies.value
      .map(agency => agency.location)
      .filter((location): location is NonNullable<typeof location> => location !== null)
    )]
      .map((location) => {
        const currentLocation = route.query.location?.toString() || ''
        const isSelected = currentLocation === location.key

        return {
          key: location.key,
          title: location.title,
          exactQuery: true,
          active: isSelected,
          to: {
            name: 'enterprise-agencies',
            query: {
              ...route.query,
              location: isSelected ? undefined : location.key
            },
            state: { smooth: '#smooth' }
          }
        }
      })
      .sort((a, b) => {
        if (a.title && b.title) {
          return a.title.localeCompare(b.title)
        }
        return 0
      })
  })

  const regions = computed<Filter[]>(() => {
    const ids = new Set<string>()
    const regions = agencies.value.flatMap((agency) => {
      return agency.regions.filter((r) => {
        if (ids.has(r.key as string)) {
          return false
        }
        ids.add(r.key as string)
        return true
      })
    })
    return regions
      .map((region) => {
        const currentRegion = route.query.region?.toString() || ''
        const isSelected = currentRegion === region.key

        return {
          key: region.key,
          title: region.title,
          exactQuery: true,
          active: isSelected,
          to: {
            name: 'enterprise-agencies',
            query: {
              ...route.query,
              region: isSelected ? undefined : region.key
            },
            state: { smooth: '#smooth' }
          }
        }
      })
      .sort((a, b) => {
        if (a.title && b.title) {
          return a.title.localeCompare(b.title)
        }
        return 0
      })
  })

  const selectedService = computed(() => {
    return services.value.find(service => service.key === route.query.service)
  })

  const selectedRegion = computed(() => {
    return regions.value.find(region => region.key === route.query.region)
  })

  const adPartner = computed(() => random(agencies.value))

  return {
    fetchList,
    filteredAgencies,
    services,
    locations,
    regions,
    selectedService,
    selectedRegion,
    adPartner
  }
}
