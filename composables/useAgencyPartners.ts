import type { Ref } from 'vue'
import type { Agency } from '../types'
import { slugify, pickOne } from '../utils'

export const useAgencyPartners = () => {
  const route = useRoute()
  const partners: Ref<Agency[]> = useState('agency-partners', () => [])

  // Data fetching

  async function fetchList () {
    try {
      const data = await queryContent('/support/agencies').where({
        $not: {
          _path: {
            $in: ['/support/agencies']
          }
        },
        _extension: 'md'
      }).find()

      partners.value = data.map(partner => ({
        ...partner,
        services: (partner.services || []).map((service: string) => ({
          key: slugify(service),
          title: service
        })),
        regions: (partner.regions || []).map((region: string) => ({
          key: slugify(region),
          title: region
        })),
        location: partner.location
          ? {
              key: slugify(partner.location),
              title: partner.location
            }
          : null
      }))
    } catch (e) {
      partners.value = []
      return e
    }
  }

  // Computed

  const filteredPartners = computed(() => {
    return [...partners.value]
      .filter((partner) => {
        if (selectedService.value && !partner.services.find(service => service.key === selectedService.value?.key)) {
          return false
        }
        if (selectedRegion.value && !partner.regions.find(region => region.key === selectedRegion.value?.key)) {
          return false
        }

        return true
      })
  })

  const services = computed(() => {
    const ids = new Set<string>()
    const services = partners.value.flatMap((partner) => {
      return partner.services.filter((r) => {
        if (ids.has(r.key)) {
          return false
        }
        ids.add(r.key)
        return true
      })
    })
    return services
      .map(service => ({
        ...service,
        to: {
          name: 'support-agencies',
          query: {
            ...route.query,
            service: route.query?.service !== service.key ? service.key : undefined
          },
          state: { smooth: '#smooth' }
        }
      }))
      .sort((a, b) => a.title.localeCompare(b.title))
  })

  const locations = computed(() => {
    return [...new Set(partners.value.map(partner => partner.location))]
      .map((location) => {
        return {
          key: location.key,
          title: location.title,
          to: {
            name: 'support-agencies',
            query: {
              ...route.query,
              location: route.query?.location !== location.key ? location.key : undefined
            },
            state: { smooth: '#smooth' }
          }
        }
      })
      .sort((a, b) => a.title.localeCompare(b.title))
  })

  const regions = computed(() => {
    const ids = new Set<string>()
    const regions = partners.value.flatMap((partner) => {
      return partner.regions.filter((r) => {
        if (ids.has(r.key)) {
          return false
        }
        ids.add(r.key)
        return true
      })
    })
    return regions
      .map((region) => {
        return {
          key: region.key,
          title: region.title,
          to: {
            name: 'support-agencies',
            query: {
              ...route.query,
              region: route.query?.region !== region.key ? region.key : undefined
            },
            state: { smooth: '#smooth' }
          }
        }
      })
      .sort((a, b) => a.title.localeCompare(b.title))
  })

  const selectedService = computed(() => {
    return services.value.find(service => service.key === route.query.service)
  })

  const selectedRegion = computed(() => {
    return regions.value.find(region => region.key === route.query.region)
  })

  const adPartner = computed(() => pickOne(partners.value))

  return {
    fetchList,
    filteredPartners,
    services,
    locations,
    regions,
    selectedService,
    selectedRegion,
    adPartner
  }
}
