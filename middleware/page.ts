import { fetchPage } from '../utils/content'

export default defineNuxtRouteMiddleware(async (to) => {
  await fetchPage(to)
})
