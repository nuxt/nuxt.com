import type { Ref } from 'vue'
import { uniqBy } from 'lodash-es'
import slugify from '@sindresorhus/slugify'
import { capitalize } from '~/utils'

export const useCommunityPartners = () => {
  const route = useRoute()
  const _partners: Ref<any> = useState('partners', () => [])

  const pending = ref(false)

  // Methods

  async function fetch () {
    if (_partners.value.length) {
      return
    }

    pending.value = true

    try {
      const data = await queryContent('/community/partners').where({
        $not: {
          _path: {
            $in: ['/community/partners']
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
        }))
      }))
  })

  const categories = computed(() => {
    const categories = [...new Set(partners.value.map(partner => partner.category))]
      .map(category => ({
        key: category,
        title: capitalize(category),
        to: {
          name: 'community-partners',
          query: {
            ...route.query,
            category: route.query?.category !== category ? category : undefined
          },
          params: { smooth: '#smooth' }
        }
      }))
      .sort((a, b) => a.title.localeCompare(b.title))

    return categories
  })

  const services = computed(() => {
    const services = uniqBy([...new Set(partners.value.flatMap(partner => partner.services))], s => s.key)
      .map(service => ({
        ...service,
        to: {
          name: 'community-partners',
          query: {
            ...route.query,
            service: route.query?.service !== service.key ? service.key : undefined
          },
          params: { smooth: '#smooth' }
        }
      }))
      .sort((a, b) => a.title.localeCompare(b.title))

    return services
  })

  const selectedCategory = computed(() => {
    return categories.value.find(category => category.key === route.query.category)
  })

  const selectedService = computed(() => {
    return services.value.find(service => service.key === route.query.service)
  })

  return {
    // Http
    fetch,
    // Computed
    partners,
    categories,
    services,
    selectedCategory,
    selectedService
  }
}
