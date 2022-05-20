<template>
  <div />
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { StrapiAuthProvider } from '@nuxtjs/strapi/dist/runtime/types'
import type { User } from '~/types'

const { authenticateProvider } = useStrapiAuth()
const route = useRoute()
const router = useRouter()

definePageMeta({
  layout: false
})

onMounted(async () => {
  try {
    const data = await authenticateProvider(route.params.provider as StrapiAuthProvider, route.query.access_token as string)

    const user = data.user as Ref<User>

    // const redirect = useCookie('redirect').value
    // if (redirect) {
    //   router.push(redirect)
    //   redirect.value = null
    // } else {
    router.push({ name: '@team-projects', params: { team: user.value.username } })
    // }
  } catch (e) {
    router.push('/')
  }
})
</script>
