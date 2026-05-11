<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { loggedIn, user, clear } = useUserSession()
const { renameChat, deleteChat } = useChatActions()

const sidebarOpen = ref(false)

const { data: chats, refresh: refreshChats } = await useFetch<ChatListItem[]>('/api/chats', {
  key: 'chats',
  default: () => []
})

watch(loggedIn, () => {
  refreshChats()
  sidebarOpen.value = false
})

const uiChats = computed(() => chats.value?.map(chat => ({
  id: chat.id,
  label: chat.title || 'Untitled',
  to: `/chat/${chat.id}`,
  icon: 'i-lucide-message-circle',
  createdAt: chat.createdAt
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

const userMenuItems = computed<DropdownMenuItem[][]>(() => {
  const groups: DropdownMenuItem[][] = [
    [{
      type: 'label' as const,
      label: user.value?.name || user.value?.username || 'Account',
      avatar: { src: user.value?.avatar, alt: user.value?.username }
    }]
  ]

  if (user.value?.role === 'admin') {
    groups.push([{ label: 'Admin dashboard', icon: 'i-lucide-shield', to: '/admin' }])
  }

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
  meta_o: () => navigateTo('/chat')
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      v-if="loggedIn"
      id="chat-sidebar"
      v-model:open="sidebarOpen"
      :min-size="12"
      collapsible
      resizable
      :menu="{ inset: true }"
      class="border-e-0 py-4 dark:[--ui-bg-elevated:var(--ui-color-neutral-900)]"
    >
      <template #header="{ collapsed }">
        <NuxtLink v-if="!collapsed" to="/" class="flex items-center gap-1.5">
          <NuxtLogo class="h-5 w-auto shrink-0" />
        </NuxtLink>
        <UDashboardSidebarCollapse class="ms-auto" />
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :items="[{
            label: 'New chat',
            to: '/chat',
            kbds: ['meta', 'o'],
            icon: 'i-custom-new-chat'
          }]"
          :collapsed="collapsed"
          orientation="vertical"
        >
          <template #item-trailing="{ item }">
            <div v-if="item.kbds?.length" class="flex items-center gap-px opacity-0 group-hover:opacity-100 transition-opacity">
              <UKbd
                v-for="kbd in item.kbds"
                :key="kbd"
                :value="kbd"
                size="sm"
                variant="soft"
                class="bg-accented/50"
              />
            </div>
          </template>
        </UNavigationMenu>

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
        <UDropdownMenu :items="userMenuItems" :content="{ align: 'start', side: 'top' }">
          <UButton
            color="neutral"
            variant="ghost"
            block
            :class="collapsed ? 'justify-center' : 'justify-start'"
            :ui="{ leadingAvatarSize: 'xs' }"
            :avatar="{ src: user?.avatar, alt: user?.username }"
            :label="collapsed ? '' : (user?.name || user?.username || '')"
            :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
          />
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <div
      class="flex-1 flex m-2 sm:m-3 rounded-lg ring ring-default bg-default/75 shadow min-w-0 overflow-hidden"
      :class="loggedIn ? 'lg:ms-0' : ''"
      :style="{ '--ui-container': 'var(--container-3xl)' }"
    >
      <slot />
    </div>
  </UDashboardGroup>
</template>
