import type { ComputedRef, Ref } from 'vue'
import type { Agency, FilterItem } from '../types'
import { slugify, pickOne } from '../utils'

export const useEnterprisePartners = () => {
  const route = useRoute()
  const partners: Ref<Agency[]> = useState('agency-partners', () => [])

  // Data fetching

  async function fetchList () {
    try {
      const data = await queryContent('/enterprise/agencies').where({ _extension: 'md' }).find()

      partners.value = data.map(partner => ({
        ...partner,
        services: (partner.services || []).map((service: string) => ({
          key: slugify(service),
          label: service
        })),
        regions: (partner.regions || []).map((region: string) => ({
          key: slugify(region),
          label: region
        })),
        location: partner.location
          ? {
            key: slugify(partner.location),
            label: partner.location
          }
          : null
      })) as Agency[]
    } catch (e) {
      partners.value = []
      return e
    }
  }

  // Computed

  const filteredPartners: ComputedRef<Agency[]> = computed(() => {
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

  const services: ComputedRef<FilterItem[]> = computed(() => {
    const ids = new Set<string>()
    const services = partners.value.flatMap((partner) => {
      return partner.services.filter((r) => {
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
        }
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  const locations: ComputedRef<FilterItem[]> = computed(() => {
    return [...new Set(partners.value.map(partner => partner.location))]
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
          }
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  const regions: ComputedRef<FilterItem[]> = computed(() => {
    const ids = new Set<string>()
    const regions = partners.value.flatMap((partner) => {
      return partner.regions.filter((r) => {
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
          }
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  const selectedService: ComputedRef<FilterItem | null> = computed(() => {
    return services.value.find(service => service.key === route.query.service) || null
  })

  const selectedRegion: ComputedRef<FilterItem | null> = computed(() => {
    return regions.value.find(region => region.key === route.query.region) || null
  })

  const adPartner: ComputedRef<any> = computed(() => pickOne(partners.value))

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