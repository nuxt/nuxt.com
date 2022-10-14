import type { Ref } from 'vue'
import { uniqBy, uniq } from 'lodash-es'
import slugify from '@sindresorhus/slugify'
import type { Agency } from '~/types'

export const useAgencyPartners = () => {
  const route = useRoute()
  const _partners: Ref<Agency[]> = useState('agency-partners', () => [])
  const pending = ref(false)

  // Methods

  async function fetch () {
    if (_partners.value.length) {
      return
    }

    pending.value = true

    try {
      const data = await queryContent<Agency>('/partners/agencies').where({
        $not: {
          _path: {
            $in: ['/partners/agencies']
          }
        }
      }).find()

      _partners.value = data
    } catch (e) {
      _partners.value = []
    }

    pending.value = false
  }

  // Computed

  const partners = computed(() => {
    return [..._partners.value]
      .map(partner => ({
        ...partner,
        services: partner.services.map(service => ({
          key: slugify(service),
          title: service
        })),
        location: partner.location
          ? {
              key: slugify(partner.location),
              title: partner.location
            }
          : null
      }))
  })

  const filteredPartners = computed(() => {
    return [...partners.value]
      .filter((partner) => {
        if (selectedService.value && !partner.services.find(service => service.key === selectedService.value.key)) {
          return false
        }
        if (selectedLocation.value && partner.location.key !== selectedLocation.value.key) {
          return false
        }

        return true
      })
  })

  const services = computed(() => {
    return uniqBy([...new Set(partners.value)].flatMap(partner => partner.services), s => s.key)
      .map(service => ({
        ...service,
        to: {
          name: 'agency-partners',
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
    return uniq([...new Set(partners.value)].map(partner => partner.location))
      .map((location) => {
        return {
          key: location.key,
          title: location.title,
          to: {
            name: 'agency-partners',
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

  const selectedService = computed(() => {
    return services.value.find(service => service.key === route.query.service)
  })

  const selectedLocation = computed(() => {
    return locations.value.find(location => location.key === route.query.location)
  })

  return {
    // Http
    fetch,
    // Computed
    partners,
    filteredPartners,
    services,
    locations,
    selectedService,
    selectedLocation
  }
}
