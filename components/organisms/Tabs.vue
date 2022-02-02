<template>
  <nav class="bg-white dark:bg-black">
    <UContainer padded>
      <UTabs :links="links" class="-mb-px" />
    </UContainer>
  </nav>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'

const route = useRoute()
const user = useStrapiUser() as Ref<User>

const links = ref([])

watch(() => route.params.team, (team = 'dashboard') => {
  links.value = [{
    label: 'Overview',
    to: `/${team}`,
    exact: true
  },
  {
    label: 'Settings',
    to: team === 'dashboard' || team === user.value.username ? '/account' : `/${team}/settings`
  }]
}, { immediate: true })
</script>
