<template>
  <UDropdown v-if="user" :items="items" item-disabled-class>
    <UButton
      square
      variant="transparent"
      icon-base-class="u-text-gray-400 flex-shrink-0 hidden lg:block"
      class="flex items-center justify-between -mr-2 !border-0"
    >
      <UAvatar
        :src="user.avatar"
        :alt="user.username"
        :size="size"
      />
    </UButton>

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
const route = useRoute()
const router = useRouter()
const { logout } = useStrapiAuth()

defineProps({
  size: {
    type: String,
    default: 'sm'
  }
})

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
    },
    {
      label: route.params.team === user.value.username ? 'User settings' : 'Team settings',
      icon: 'heroicons-outline:cog',
      to: { name: '@team-settings', params: { team: route.params.team } },
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
