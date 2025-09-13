import type { Agency, Filter } from '../types'
import { slugify, random } from '../utils'

export const useEnterpriseAgencies = () => {
  const route = useRoute()
  const { data: agencies, execute } = useAsyncData('agencies', () => queryCollection('agencies').all(), {
    immediate: false,
    default: () => [],
    transform: (data) => {
      if (data && Array.isArray(data)) {
        return data.map((agency: any) => ({
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
      return []
    }
  })

  // Data fetching
  async function fetchList() {
    if (agencies.value.length) {
      return
    }

    return execute()
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
