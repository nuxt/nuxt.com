<template>
  <UDropdown v-if="user" :items="items" placement="bottom-start" container-class="w-48 z-20 py-2 lg:!-mx-2" item-disabled-class="">
    <template #default="{ open }">
      <UButton
        :icon="compact ? '' : 'heroicons-outline:selector'"
        trailing
        square
        variant="transparent"
        icon-base-class="flex-shrink-0 hidden u-text-gray-400 lg:block"
        class="flex items-center justify-between !border-0"
        :class="{ 'u-text-gray-700': open, 'lg:w-44 -mr-2 ': !compact, '!p-0': compact }"
      >
        <div class="flex items-center flex-1 min-w-0">
          <div class="relative w-6 h-6 lg:-m-0.5 flex-shrink-0">
            <UAvatar v-if="currentTeam" :src="currentTeam.avatar" :alt="currentTeam.label" size="xs" />
            <img
              :src="user.avatar"
              class="absolute bottom-0 right-0 block transition-all transform rounded-full ring-1 u-ring-white"
              :class="{ '-mb-0.5 -mr-0.5 w-3 h-3': activeItem.slug !== user.username, 'w-6 h-6': activeItem.slug === user.username }"
            >
          </div>
          <span v-if="!compact" class="hidden ml-3 text-sm font-medium truncate lg:block">{{ activeItem.label }}</span>
        </div>
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

defineProps({
  compact: {
    type: Boolean,
    default: false
  }
})

const to = (slug) => {
  if (route.params.team && !route.params.project) {
    const to = { name: route.name, params: { ...route.params, team: slug }, query: route.query }

    try {
      const resolvedRoute = router.resolve(to)
      if (resolvedRoute) {
        return to
      }
    } catch (e) {}
  }

  return { name: '@team-projects', params: { team: slug } }
}

const items = computed(() => {
  const profile = {
    label: user.value?.username || user.value?.email,
    avatar: user.value?.avatar,
    to: to(user.value?.username),
    slug: user.value?.username,
    click () {
      activeTeam.value = user.value?.username
    }
  }

  const teams = (user.value?.memberships || []).map((membership) => {
    const { team } = membership

    return {
      slug: team.slug,
      label: team.name,
      avatar: team.avatar?.url || true,
      active: activeTeam.value === team.slug,
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
    user.value?.beta && [
      {
        label: 'New team',
        to: { name: 'teams-new' },
        icon: 'heroicons-outline:plus',
        slot: 'reverse-icon'
      },
      {
        label: activeTeam.value === user.value?.username ? 'User settings' : 'Team settings',
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

const currentTeam = ref(null)

watch(activeItem, (value) => {
  if (value && value.slug !== user.value?.username) {
    currentTeam.value = value
  }
}, { immediate: true })
</script>
