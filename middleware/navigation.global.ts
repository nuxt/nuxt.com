import { queryContent } from '#imports'

export default defineNuxtRouteMiddleware(async () => {
  const navigation = useState('navigation')

  /**
   * Avoid fetching twice via middleware.
   *
   * As we use a global navigation object and not a scoped one,
   * we can fetch this only once.
   */
  if (!navigation.value) {
    // @ts-ignore - Fix that TS issue upstream (nuxt/content-next)
    navigation.value = await queryContent().findNavigation()
  }
})
