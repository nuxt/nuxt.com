import type { Ref } from 'vue'
import type { User } from '~/types'

export default defineNuxtRouteMiddleware((to) => {
  const user = useStrapiUser() as Ref<User>
  if (!user.value) {
    useCookie('redirect').value = to.fullPath
    return navigateTo('/')
  }
})
