<template>
  <UDropdown v-if="user" :items="items" placement="bottom-start" item-disabled-class>
    <template #default="{ open }">
      <UButton
        icon="heroicons-outline:selector"
        trailing
        variant="transparent"
        icon-base-class="u-text-gray-400"
        class="flex items-center -mr-4"
        :class="{ 'u-text-gray-700': open }"
      >
        <UAvatar
          :src="activeItem.avatar"
          :alt="activeItem.label"
          size="xs"
          class="-m-0.5 flex-shrink-0"
        >
          <img v-show="activeItem.slug !== user.username" :src="user.avatar" class="absolute block rounded-full ring-1 u-ring-white bottom-0 right-0 -mb-0.5 -mr-0.5 w-3 h-3">
        </UAvatar>
        <span class="text-sm font-medium truncate ml-3">{{ activeItem.label }}</span>
      </UButton>
    </template>

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
const activeTeam = useTeam()

const to = (slug) => {
  if (route.params.team) {
    const to = { name: route.name, params: { ...route.params, team: slug }, query: route.query }

    const resolvedRoute = router.resolve(to)
    if (resolvedRoute) {
      return to
    }
  }

  return route
}

const items = computed(() => {
  const { team: slug } = route.params

  const profile = {
    label: user.value.username || user.value.email,
    avatar: user.value.avatar,
    to: to(user.value.username),
    slug: user.value.username,
    click () {
      activeTeam.value = user.value.username
    }
  }

  const teams = (user.value.memberships || []).map((membership) => {
    const { team } = membership

    return {
      slug: team.slug,
      label: team.name,
      avatar: team.avatar?.url || true,
      active: activeTeam.value === team.slug || team.slug === slug,
      to: to(team.slug),
      click () {
        activeTeam.value = team.slug
      }
    }
  })

  return [
    [
      profile,
      ...teams
    ],
    [
      {
        label: 'New team',
        to: { name: 'teams-new' },
        icon: 'heroicons-outline:plus',
        slot: 'reverse-icon'
      },
      {
        label: slug === user.value.username ? 'User settings' : 'Team settings',
        icon: 'heroicons-outline:cog',
        to: { name: '@team-settings', params: { team: activeTeam.value } },
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
  ].filter(Boolean)
})

const activeItem = computed(() => {
  const flatItems = items.value.flat()
  return flatItems.find(item => item.active) || flatItems[0]
})
</script>
