<template>
  <UDropdown v-if="user" :items="items">
    <button class="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
      <UAvatar
        :src="user.avatar"
        :alt="user.username"
        size="sm"
      />
    </button>

    <template #reverse-icon="{ item }">
      <div class="flex items-center justify-between gap-3 w-full">
        {{ item.label }}

        <UIcon :name="item.icon" class="h-4 w-4 u-text-gray-400 group-hover:u-text-gray-500" />
      </div>
    </template>
  </UDropdown>
</template>

<script setup>
const user = useStrapiUser()
const router = useRouter()
const { logout } = useStrapiAuth()

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
      icon: 'heroicons-outline:plus',
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
        router.push('/login')
      }
    }
  ]
]
</script>
