<template>
  <div />
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User, Membership } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const router = useRouter()
const route = useRoute()
const user = useStrapiUser() as Ref<User>
const client = useStrapiClient()

const { code } = route.query

onMounted(async () => {
  try {
    const membership = await client<Membership>('/teams/join', {
      method: 'POST',
      body: {
        code
      }
    })

    user.value.memberships.push(membership)

    router.push({ name: '@team', params: { team: membership.team.slug } })
  } catch (e) {
    router.push({ name: '@team', params: { team: user.value.username } })
  }
})
</script>
