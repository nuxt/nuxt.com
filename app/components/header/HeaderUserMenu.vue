<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { user, clear } = useUserSession()
const route = useRoute()
const colorMode = useColorMode()

async function logout() {
  await clear()
  await navigateTo('/')
}

const items = computed<DropdownMenuItem[][]>(() => {
  const groups: DropdownMenuItem[][] = [
    [{
      type: 'label',
      label: user.value?.name || user.value?.username || 'Account',
      avatar: {
        src: user.value?.avatar,
        alt: user.value?.username
      }
    }]
  ]

  const accountItems: DropdownMenuItem[] = []
  if (user.value?.role === 'admin') {
    accountItems.push({
      label: 'Analytics',
      icon: 'i-lucide-chart-bar',
      to: '/admin/analytics'
    })
  }
  if (accountItems.length) groups.push(accountItems)

  groups.push([{
    label: 'Appearance',
    icon: 'i-lucide-sun-moon',
    children: [[
      {
        label: 'Light',
        icon: 'i-lucide-sun',
        onSelect: () => { colorMode.preference = 'light' },
        checked: colorMode.value === 'light'
      },
      {
        label: 'Dark',
        icon: 'i-lucide-moon',
        onSelect: () => { colorMode.preference = 'dark' },
        checked: colorMode.value === 'dark'
      }
    ]]
  }])

  groups.push([{
    label: 'Sign out',
    icon: 'i-lucide-log-out',
    onSelect: logout
  }])

  return groups
})

const loginHref = computed(() => `/api/auth/github?redirect=${encodeURIComponent(route.fullPath)}`)
</script>

<template>
  <UButton
    v-if="!user"
    :to="loginHref"
    label="Sign in"
    aria-label="Sign in with GitHub"
    external
  />

  <UDropdownMenu v-else :items="items" :ui="{ content: 'w-56' }" :content="{ align: 'end' }">
    <UButton
      :avatar="{ src: user.avatar, alt: user.username }"
      color="neutral"
      variant="ghost"
      square
      :aria-label="user.username"
    />
  </UDropdownMenu>
</template>
