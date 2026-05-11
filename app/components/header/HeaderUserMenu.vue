<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { user, clear } = useUserSession()
const route = useRoute()

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
      label: 'Admin dashboard',
      icon: 'i-lucide-shield',
      to: '/admin'
    })
  }
  if (accountItems.length) groups.push(accountItems)

  groups.push([{
    label: 'GitHub profile',
    icon: 'i-simple-icons-github',
    to: user.value?.username ? `https://github.com/${user.value.username}` : 'https://github.com',
    target: '_blank'
  }])

  groups.push([{
    label: 'Sign out',
    icon: 'i-lucide-log-out',
    onSelect: logout
  }])

  return groups
})

const loginHref = computed(() => `/login?redirect=${encodeURIComponent(route.fullPath)}`)
</script>

<template>
  <UButton
    v-if="!user"
    :to="loginHref"
    label="Sign in"
    color="neutral"
    variant="ghost"
    size="sm"
  />
  <UDropdownMenu v-else :items="items" :ui="{ content: 'w-56' }">
    <UButton
      :avatar="{ src: user.avatar, alt: user.username }"
      color="neutral"
      variant="ghost"
      square
      :aria-label="user.username"
    />
  </UDropdownMenu>
</template>
