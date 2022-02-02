<template>
  <UDropdown
    v-if="hasUser"
    :items="links"
    :placement="placement"
    strategy="fixed"
  >
    <UButton
      variant="secondary"
      icon="heroicons-outline:user"
      rounded
    />
    <template #trigger="{ toggle }">
      <slot :toggle="toggle">
        <UButton
          :variant="variant"
          :size="size"
          :icon="icon"
          @click.stop="toggle"
        >
          <div class="flex items-center gap-3">
            <span v-if="showUsername" class="text-base font-medium">{{ user.username }}</span>
          </div>
        </UButton>
      </slot>
    </template>
  </UDropdown>
</template>

<script setup>
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

const userLogout = () => {
  logout()
  router.push('/')
}

const hasUser = computed(() => {
  return useStrapiUser()
})

const links = computed(() => {
  return [
    [{
      label: 'Dashboard',
      to: '/dashboard'
    }],
    [{
      label: 'New team',
      to: '/teams/new'
    },
    {
      label: 'Settings',
      to: '/account'
    }],
    [{
      label: 'Logout',
      to: '',
      click: () => userLogout()
    }]
  ]
})
</script>
