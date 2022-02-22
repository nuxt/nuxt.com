<template>
  <UDropdown v-if="user" :items="items" placement="bottom-start" class="-mx-4">
    <div class="relative flex items-center gap-3 px-4">
      <NuxtLink :to="`/@${activeItem.slug}`" class="flex items-center gap-3 block max-w-[10rem]" @click.stop>
        <UAvatar
          :src="activeItem.avatar"
          :alt="activeItem.label"
          size="xs"
          class="-m-0.5 flex-shrink-0"
        />
        <span class="text-sm font-medium truncate">{{ activeItem.label }}</span>
      </NuxtLink>

      <UButton
        icon="heroicons-outline:selector"
        trailing
        variant="secondary"
        class="group"
        icon-base-class="u-text-gray-400 group-hover:u-text-gray-500"
        size="xxs"
      />
    </div>
  </UDropdown>
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
    if (resolvedRoute) {
      return to
    }
  }

  return `/@${slug}`
}

const items = computed(() => {
  const { team: slug } = route.params

  const profile = {
    label: user.value.username || user.value.email,
    avatar: user.value.avatar,
    to: to(user.value.username),
    slug: user.value.username,
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
