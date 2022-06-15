import { fetchNavigation } from '../utils/content'

export default defineNuxtRouteMiddleware(async () => {
  await fetchNavigation()
})
