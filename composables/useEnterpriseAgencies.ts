import type { Agency, Filter } from '../types'
import { slugify, random } from '../utils'

export const useEnterpriseAgencies = () => {
  const route = useRoute()
  const router = useRouter()
  const agencies = useState<Agency[]>('enterprise-agencies', () => [])

  // Data fetching

  async function fetchList () {
    if (agencies.value.length) {
      return
    }

    try {
      const data = await queryContent('/enterprise/agencies').where({ _extension: 'md' }).find()

      agencies.value = data.map(agency => ({
        ...agency,
        services: (agency.services || []).map((service: string) => ({
          key: slugify(service),
          label: service
        })),
        regions: (agency.regions || []).map((region: string) => ({
          key: slugify(region),
          label: region
        })),
        location: agency.location
          ? {
            key: slugify(agency.location),
            label: agency.location
          }
          : null
      })) as Agency[]
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
      .map(service => ({
        ...service,
        exactQuery: true,
        to: {
          name: 'enterprise-agencies',
          query: {
            ...route.query,
            service: service.key
          },
          state: { smooth: '#smooth' }
        },
        click: (e) => {
          if (route.query.service !== service.key) {
            return
          }

          e.preventDefault()

          router.replace({ query: { ...route.query, service: undefined } })
        }
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  const locations = computed<Filter[]>(() => {
    return [...new Set(agencies.value.map(agency => agency.location))]
      .map((location: any) => {
        return {
          key: location.key,
          label: location.label,
          exactQuery: true,
          to: {
            name: 'enterprise-agencies',
            query: {
              ...route.query,
              location: location.key
            },
            state: { smooth: '#smooth' }
          },
          click: (e) => {
            if (route.query.location !== location.key) {
              return
            }

            e.preventDefault()

            router.replace({ query: { ...route.query, location: undefined } })
          }
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
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
        return {
          key: region.key,
          label: region.label,
          exactQuery: true,
          to: {
            name: 'enterprise-agencies',
            query: {
              ...route.query,
              region: region.key
            },
            state: { smooth: '#smooth' }
          },
          click: (e) => {
            if (route.query.region !== region.key) {
              return
            }

            e.preventDefault()

            router.replace({ query: { ...route.query, region: undefined } })
          }
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
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
