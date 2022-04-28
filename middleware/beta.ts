import type { Ref } from 'vue'
import type { User } from '~/types'

export default defineNuxtRouteMiddleware(() => {
  const user = useStrapiUser() as Ref<User>
  if (user.value && !user.value.beta) {
    return navigateTo('/beta')
  }
})
