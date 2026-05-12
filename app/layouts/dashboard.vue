<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const { loggedIn, user, clear } = useUserSession()
const route = useRoute()
const loginHref = computed(() => `/api/auth/github?redirect=${encodeURIComponent(route.fullPath)}`)
const colorMode = useColorMode()
const { renameChat, deleteChat } = useChatActions()

const sidebarOpen = ref(false)

await useFetch<ChatListItem[]>('/api/chats', {
  key: 'chats',
  default: () => []
})

const { chatList, refresh: refreshChats } = useChatsData()

watch(loggedIn, () => {
  refreshChats()
  sidebarOpen.value = false
})

const uiChats = computed(() => chatList.value?.map(chat => ({
  id: chat.id,
  label: chat.title || 'Untitled',
  to: `/dashboard/chat/${chat.id}`,
  icon: 'i-lucide-message-circle',
  createdAt: chat.createdAt,
  updatedAt: chat.updatedAt
})))

const { groups } = useChats(uiChats)

const items = computed(() => groups.value?.flatMap(group => [
  { label: group.label, type: 'label' as const },
  ...group.items.map(item => ({
    ...item,
    slot: 'chat' as const,
    icon: undefined,
    class: item.label === 'Untitled' ? 'text-muted' : ''
  }))
]))

function getChatActions(item: { id: string, label: string }): DropdownMenuItem[][] {
  return [[
    {
      label: 'Rename',
      icon: 'i-lucide-pencil',
      onSelect: () => renameChat(item.id, item.label === 'Untitled' ? '' : item.label)
    }
  ], [
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error' as const,
      onSelect: () => deleteChat(item.id)
    }
  ]]
}

const adminNavItems = computed<NavigationMenuItem[][]>(() => {
  if (user.value?.role !== 'admin') return []
  return [[{
    label: 'Admin',
    type: 'label' as const
  }, {
    label: 'Analytics',
    icon: 'i-lucide-chart-bar',
    to: '/admin/analytics'
  }]]
})

const userMenuItems = computed<DropdownMenuItem[][]>(() => {
  const groups: DropdownMenuItem[][] = [
    [{
      type: 'label' as const,
      label: user.value?.name || user.value?.username || 'Account',
      avatar: { src: user.value?.avatar, alt: user.value?.username }
    }]
  ]

  groups.push([
    {
      label: 'Home',
      icon: 'i-lucide-house',
      to: '/'
    },
    {
      label: 'Docs',
      icon: 'i-lucide-book-open',
      to: '/docs'
    }
  ])

  groups.push([{
    label: 'Appearance',
    icon: 'i-lucide-sun-moon',
    children: [[
      {
        label: 'Light',
        icon: 'i-lucide-sun',
        onSelect: () => { colorMode.preference = 'light' },
        checked: colorMode.value === 'light'
      },
      {
        label: 'Dark',
        icon: 'i-lucide-moon',
        onSelect: () => { colorMode.preference = 'dark' },
        checked: colorMode.value === 'dark'
      }
    ]]
  }])

  groups.push([{
    label: 'Sign out',
    icon: 'i-lucide-log-out',
    onSelect: async () => {
      await clear()
      await navigateTo('/')
    }
  }])

  return groups
})

defineShortcuts({
  meta_o: () => navigateTo('/dashboard/chat')
})
</script>

<template>
  <UDashboardGroup unit="rem" class="[--ui-header-height:--spacing(11)]">
    <UDashboardSidebar
      id="chat-sidebar"
      v-model:open="sidebarOpen"
      :min-size="12"
      collapsible
      resizable
      :menu="{ inset: true }"
      class="border-e-0 pt-2 sm:pt-3 pb-4 dark:[--ui-bg-elevated:var(--ui-color-neutral-900)]"
    >
      <template #header="{ collapsed }">
        <NuxtLink v-if="!collapsed" to="/" class="flex items-center gap-1.5">
          <NuxtLogo class="h-5 w-auto shrink-0" />
        </NuxtLink>
        <UDashboardSidebarCollapse class="ms-auto" />
      </template>

      <template #default="{ collapsed }">
        <UButton
          color="neutral"
          variant="subtle"
          size="sm"
          :label="collapsed ? undefined : 'New Chat'"
          :icon="collapsed ? 'i-lucide-plus' : undefined"
          :block="!collapsed"
          :square="collapsed"
          to="/dashboard/chat"
          aria-label="New chat"
          :class="['active:translate-y-px transition-transform mt-4', collapsed ? 'mx-auto' : '']"
        />

        <UNavigationMenu
          v-if="!collapsed && adminNavItems.length"
          :items="adminNavItems"
          orientation="vertical"
          class="mt-2"
        />

        <UNavigationMenu
          v-if="!collapsed"
          :items="items"
          :collapsed="collapsed"
          orientation="vertical"
          :ui="{
            link: 'overflow-hidden pr-7.5',
            linkTrailing: 'translate-x-full group-hover:translate-x-0 group-has-data-[state=open]:translate-x-0 transition-transform ms-0 absolute inset-e-px'
          }"
        >
          <template #chat-trailing="{ item }: { item: { id: string, label: string } }">
            <UDropdownMenu
              :items="getChatActions(item)"
              :content="{ align: 'end' }"
            >
              <UButton
                as="div"
                icon="i-lucide-ellipsis"
                color="neutral"
                variant="link"
                size="sm"
                class="rounded-[5px] hover:bg-accented/50 focus-visible:bg-accented/50 data-[state=open]:bg-accented/50"
                aria-label="Chat actions"
                tabindex="-1"
                @click.stop.prevent
              />
            </UDropdownMenu>
          </template>
        </UNavigationMenu>
      </template>

      <template #footer="{ collapsed }">
        <UButton
          v-if="!loggedIn"
          :to="loginHref"
          icon="i-simple-icons-github"
          :label="collapsed ? undefined : 'Sign in with GitHub'"
          color="neutral"
          variant="subtle"
          :block="!collapsed"
          :square="collapsed"
          :class="collapsed ? 'mx-auto' : 'justify-start w-full'"
          external
        />
        <UDropdownMenu v-else :items="userMenuItems" :content="{ align: 'start', side: 'top' }">
          <UButton
            color="neutral"
            variant="ghost"
            :block="!collapsed"
            :square="collapsed"
            :class="collapsed ? 'mx-auto' : 'justify-start'"
            :ui="{ leadingAvatarSize: 'xs' }"
            :avatar="{ src: user?.avatar, alt: user?.username }"
            :label="collapsed ? undefined : (user?.name || user?.username || '')"
            :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
          />
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <div
      class="flex-1 flex m-2 sm:m-3 lg:ms-0 rounded-lg ring ring-default bg-default/75 shadow min-w-0 overflow-hidden"
      :style="{ '--ui-container': 'var(--container-3xl)' }"
    >
      <slot />
    </div>
  </UDashboardGroup>
</template>
