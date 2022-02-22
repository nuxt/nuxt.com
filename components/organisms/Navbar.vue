<template>
  <nav class="bg-white dark:bg-black">
    <UContainer padded>
      <div class="grid grid-cols-3 items-center h-16">
        <TeamsDropdown class="justify-start" />

        <UTabs :links="links" v-bind="tabsProps" />

        <ProfileDropdown class="justify-end" />
      </div>
    </UContainer>
  </nav>
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
      to: `/@${team}`,
      exact: true
    }, {
      label: 'Teams',
      to: '/account/teams'
    }]
  } else {
    links.value = [{
      label: 'Projects',
      to: `/@${team}`,
      exact: true
    }, {
      label: 'Members',
      to: `/@${team}/members`
    }, {
      label: 'Settings',
      to: `/@${team}/settings`
    }]
  }
}, { immediate: true })

const tabsProps = {
  wrapperClass: 'flex items-center justify-center gap-3',
  baseClass: 'rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-900 px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:u-ring-gray-900 focus:ring-offset-white dark:focus:ring-offset-black',
  activeClass: 'u-text-white u-bg-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black',
  inactiveClass: 'u-text-gray-500'
}
</script>
