<template>
  <UDropdown
    v-if="user"
    :items="items"
  >
    <UButton
      variant="transparent"
      rounded
    >
      <UAvatar
        :src="user.avatar"
        :alt="user.username"
      />
    </UButton>
    <template #reverse-icon="{ item }">
      <div class="flex items-center justify-between w-full">
        {{ item.label }}
        <UIcon :name="item.icon" :class="itemIconClass" />
      </div>
    </template>
  </UDropdown>
</template>

<script setup>
import ui from '#build/ui'

const { logout } = useStrapiAuth()
const router = useRouter()
const iconItemClass = ui.dropdown.item.icon
const user = useStrapiUser()

const items = [
  [
    {
      label: 'Dashboard',
      to: '/dashboard'
    }
  ],
  [
    {
      label: 'New team',
      to: '/teams/new',
      icon: 'heroicons-outline:user-add',
      slot: 'reverse-icon'
    },
    {
      label: 'Settings',
      to: '/account'
    }
  ],
  [
    {
      label: 'Logout',
      click: () => {
        logout()
        router.push('/')
      }
    }
  ]
]
</script>
