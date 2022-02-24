<template>
  <header class="bg-white dark:bg-black">
    <UContainer padded>
      <div class="grid grid-cols-3 gap-3 items-center h-16">
        <TeamsDropdown class="justify-start" />

        <UPills :links="links" class="justify-center" />

        <ProfileDropdown class="justify-end" />
      </div>
    </UContainer>
  </header>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'

const route = useRoute()
const user = useStrapiUser() as Ref<User>

const links = ref([])

watch(() => route.params.team, (team) => {
  if (!user.value) {
    links.value = []
    return
  }

  team = team || user.value.username

  if (team === user.value.username) {
    links.value = [{
      label: 'Projects',
      to: { name: '@team', params: { team } },
      exact: true
    }, {
      label: 'Teams',
      to: { name: 'account-teams' }
    }]
  } else {
    links.value = [{
      label: 'Projects',
      to: { name: '@team', params: { team } },
      exact: true
    }, {
      label: 'Members',
      to: { name: '@team-members', params: { team } }
    }, {
      label: 'Settings',
      to: { name: '@team-settings', params: { team } }
    }]
  }
}, { immediate: true })
</script>
