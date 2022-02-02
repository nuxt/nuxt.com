<template>
  <UDropdown v-if="user" :items="items" placement="bottom-start">
    <UButton
      icon="heroicons-outline:selector"
      trailing
      variant="white"
      icon-base-class="u-text-gray-400"
      size="sm"
    >
      <div class="flex items-center gap-3">
        <UAvatar
          :src="item.avatar"
          :alt="item.label"
          size="xs"
          class="-my-0.5"
        />
        <span class="truncate">{{ item.label }}</span>
      </div>
    </UButton>

    <template #avatar="{ item }">
      <div class="flex items-center gap-3">
        <UAvatar
          :src="item.avatar"
          :alt="item.label"
          size="xs"
          class="-my-0.5"
        />
        <span class="truncate">{{ item.label }}</span>
      </div>
    </template>

    <template #icon="{ item }">
      <div class="flex items-center gap-3 w-full">
        <UIcon :name="item.icon" class="h-4 w-4 u-text-gray-400 group-hover:u-text-gray-500" />

        {{ item.label }}
      </div>
    </template>
  </UDropdown>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'

const user = useStrapiUser() as Ref<User>
const route = useRoute()

const items = computed(() => {
  const { team: slug = 'dashboard' } = route.params

  const profile = {
    label: user.value.username,
    avatar: user.value.avatar,
    to: '/dashboard',
    slot: 'avatar'
  }
  const teams = (user.value.teams || []).map((team) => {
    return {
      slug: team.slug,
      label: team.name,
      avatar: team.avatar?.url || true,
      active: team.slug === slug,
      to: `/${team.slug}`,
      slot: 'avatar'
    }
  })

  return [
    [profile],
    teams.length && teams,
    [{ label: 'Create new team', icon: 'heroicons-outline:plus', to: '/teams/new', slot: 'icon' }]
  ].filter(Boolean)
})

const item = computed(() => {
  const flatItems = items.value.flat()
  return flatItems.find(item => item.active) || flatItems[0]
})
</script>
