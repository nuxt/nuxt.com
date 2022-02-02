<template>
  <div />
</template>

<script setup lang="ts">
import type { StrapiAuthProvider } from '@nuxtjs/strapi/dist/runtime/types'

const { authenticateProvider } = useStrapiAuth()
const route = useRoute()
const router = useRouter()

definePageMeta({
  layout: false
})

onMounted(async () => {
  try {
    await authenticateProvider(route.params.provider as StrapiAuthProvider, route.query.access_token as string)

    router.push('/dashboard')
  } catch (e) {}
})
</script>
