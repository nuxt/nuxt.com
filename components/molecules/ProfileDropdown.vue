<template>
  <UDropdown v-if="user" :items="items" item-disabled-class>
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

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'

const user = useStrapiUser() as Ref<User>
const router = useRouter()
const { logout } = useStrapiAuth()

const items = [
  [
    {
      label: 'Dashboard',
      to: { name: '@team-projects', params: { team: user.value.username } }
    }
  ],
  [
    {
      label: 'New team',
      to: { name: 'teams-new' },
      icon: 'heroicons-outline:plus',
      slot: 'reverse-icon'
    }
  ],
  [
    {
      label: 'Theme',
      slot: 'theme',
      disabled: true
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
