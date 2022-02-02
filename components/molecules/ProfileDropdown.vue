<template>
  <UDropdown
    v-if="user"
    :items="links"
    :placement="placement"
    strategy="fixed"
  >
    <UButton
      variant="transparent"
      rounded
    >
      <UAvatar
        :src="user.avatar"
        :alt="user.username"
        :size="avatarSize"
      />
    </UButton>
    <template #reverse-icon="{ item }">
      <div class="flex items-center justify-between w-full">
        New team
        <UIcon :name="item.icon" :class="itemIconClass" />
      </div>
    </template>
  </UDropdown>
</template>

<script setup>
import ui from '#build/ui'

defineProps({
  showUsername: {
    type: Boolean,
    default: false
  },
  placement: {
    type: String,
    default: 'bottom-end'
  },
  variant: {
    type: String,
    default: 'custom'
  },
  size: {
    type: String,
    default: 'sm'
  },
  dropdownSize: {
    type: String,
    default: 'md'
  },
  avatarSize: {
    type: String,
    default: 'sm'
  },
  icon: {
    type: String,
    default: 'heroicons-outline:arrow-sm-down'
  }
})

const { logout } = useStrapiAuth()
const router = useRouter()
const iconItemClass = ui.dropdown.item.icon

const user = computed(() => {
  return useStrapiUser()
})

const links = computed(() => {
  return [
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
        to: '',
        click: () => {
          logout()
          router.push('/')
        }
      }
    ]
  ]
})
</script>
