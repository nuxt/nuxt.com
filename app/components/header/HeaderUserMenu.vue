<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { user, clear } = useUserSession()
const colorMode = useColorMode()
const route = useRoute()

// Middleware that require a session, see app/middleware/
const AUTH_MIDDLEWARE = ['auth', 'admin']

async function logout() {
  await clear()

  // Stay on the current page unless it requires a session
  const middleware = [route.meta.middleware].flat()
  if (middleware.some(m => typeof m === 'string' && AUTH_MIDDLEWARE.includes(m))) {
    await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
  }
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

  const accountItems: DropdownMenuItem[] = [{
    label: 'Chats with Nuxi',
    icon: 'i-lucide-message-circle',
    to: '/dashboard/chat'
  }, {
    label: 'My Nuxter profile',
    icon: 'i-lucide-award',
    to: '/nuxters'
  }]
  if (user.value?.role === 'admin') {
    accountItems.push({
      label: 'Analytics',
      icon: 'i-lucide-chart-bar',
      to: '/admin/analytics'
    })
  }
  groups.push(accountItems)

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
</script>

<template>
  <UDropdownMenu
    v-if="user"
    :items="items"
    :content="{ align: 'end' }"
  >
    <UButton
      :avatar="{ src: user.avatar, alt: user.username }"
      color="neutral"
      variant="ghost"
      square
      :aria-label="user.username"
    />
  </UDropdownMenu>
</template>
