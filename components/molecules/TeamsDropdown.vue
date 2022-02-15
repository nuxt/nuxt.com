<template>
  <div class="relative flex items-center gap-3">
    <NuxtLink :to="`/${activeItem.slug}`" class="flex items-center gap-3 block max-w-[10rem]">
      <UAvatar
        :src="activeItem.avatar"
        :alt="activeItem.label"
        size="xs"
        class="-my-0.5 flex-shrink-0"
      />
      <span class="text-sm font-medium truncate">{{ activeItem.label }}</span>
    </NuxtLink>

    <UDropdown v-if="user" :items="items" placement="auto" strategy="fixed" wrapper-class="inline-flex">
      <UButton
        icon="heroicons-outline:selector"
        trailing
        variant="secondary"
        class="group"
        icon-base-class="u-text-gray-400 group-hover:u-text-gray-500"
        size="xxs"
      />

      <template #avatar="{ item }">
        <div class="flex items-center gap-3 w-full">
          <UAvatar
            :src="item.avatar"
            :alt="item.label"
            size="xs"
            class="-my-0.5 !group-hover:u-bg-gray-200 flex-shrink-0"
          />
          <span class="truncate">{{ item.label }}</span>
        </div>
      </template>

      <template #icon="{ item }">
        <div class="flex items-center w-full gap-3 w-full">
          <UIcon :name="item.icon" class="w-4 h-4 mx-1 u-text-gray-400 group-hover:u-text-gray-500 flex-shrink-0" />

          <span class="truncate">{{ item.label }}</span>
        </div>
      </template>
    </UDropdown>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'

const user = useStrapiUser() as Ref<User>
const route = useRoute()
const router = useRouter()

const to = (slug) => {
  if (route.params.team) {
    const to = { name: route.name, params: { ...route.params, team: slug }, query: route.query }

    const resolvedRoute = router.resolve(to)
    if (resolvedRoute && !resolvedRoute.fullPath.startsWith('/dashboard/settings')) {
      return to
    }
  }

  return `/${slug}`
}

const items = computed(() => {
  const { team: slug = 'dashboard' } = route.params

  const profile = {
    label: user.value.username || user.value.email,
    avatar: user.value.avatar,
    to: to('dashboard'),
    slug: 'dashboard',
    slot: 'avatar'
  }

  const teams = (user.value.memberships || []).map((membership) => {
    const { team } = membership

    return {
      slug: team.slug,
      label: team.name,
      avatar: team.avatar?.url || true,
      active: team.slug === slug,
      to: to(team.slug),
      slot: 'avatar'
    }
  })

  return [
    [profile],
    teams.length && teams,
    [{ label: 'Create new team', icon: 'heroicons-outline:plus', to: '/teams/new', slot: 'icon' }]
  ].filter(Boolean)
})

const activeItem = computed(() => {
  const flatItems = items.value.flat()
  return flatItems.find(item => item.active) || flatItems[0]
})
</script>
