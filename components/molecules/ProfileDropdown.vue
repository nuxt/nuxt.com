<template>
  <UDropdown v-if="user" :items="items">
    <button class="flex text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:u-ring-gray-900 focus:ring-offset-white dark:focus:ring-offset-black">
      <UAvatar
        :src="user.avatar"
        :alt="user.username"
        size="sm"
      />
    </button>

    <template #reverse-icon="{ item }">
      <div class="flex items-center justify-between w-full gap-3">
        {{ item.label }}

        <UIcon :name="item.icon" class="w-4 h-4 u-text-gray-400 group-hover:u-text-gray-500" />
      </div>
    </template>

    <template #theme="{ item }">
      <div class="flex items-center justify-between w-full gap-3" @click.stop>
        {{ item.label }}

        <ThemeSelect class="-my-2" size="xs" />
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
      label: 'Theme',
      slot: 'theme'
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
