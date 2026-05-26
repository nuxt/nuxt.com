<script setup lang="ts">
import type { UIMessage } from 'ai'
import { joinURL } from 'ufo'
import { format } from 'date-fns'

function messageTime(message: UIMessage): string | null {
  const raw = (message.metadata as { createdAt?: string } | undefined)?.createdAt
  return raw ? format(new Date(raw), 'h:mm a') : null
}
function messageFullTime(message: UIMessage): string | null {
  const raw = (message.metadata as { createdAt?: string } | undefined)?.createdAt
  return raw ? format(new Date(raw), 'MMM d, yyyy, h:mm a') : null
}

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const toast = useToast()
const { loggedIn } = useUserSession()
const { usage, rateLimitReached, consumePendingPrompt } = useNuxtAgent()
const { refresh: refreshChats } = useChatsData()

const chatId = route.params.id as string

const { data, error } = await useFetch<ChatDetail>(`/api/chats/${chatId}`, {
  key: `chat-${chatId}`
})

if (loggedIn.value && (error.value || !data.value)) {
  throw createError({ statusCode: 404, statusMessage: 'Chat not found', fatal: true })
}

const isOwner = computed(() => data.value?.isOwner ?? false)
const visibility = ref<'public' | 'private' | 'admin'>(data.value?.visibility ?? 'private')
const title = ref<string | null>(data.value?.title ?? null)
watch(() => data.value?.title, (next) => {
  title.value = next ?? null
})

const { data: votes } = await useLazyFetch<ChatVoteRow[]>(`/api/chats/${chatId}/votes`, {
  immediate: isOwner.value,
  default: () => []
})

const initialMessages = computed<UIMessage[]>(() =>
  (data.value?.messages ?? []).map(m => ({
    id: m.id,
    role: m.role,
    parts: (m.parts ?? []) as UIMessage['parts'],
    metadata: { createdAt: m.createdAt }
  }))
)

const {
  chat,
  input,
  onSubmit,
  send
} = useAgentChat({
  chatId,
  initialMessages: initialMessages.value,
  source: 'chat-page',
  withPageContext: 'always',
  onFinish: () => {
    if (loggedIn.value) refreshChats()
  }
})

function getVote(messageId: string) {
  const vote = votes.value?.find(v => v.messageId === messageId)
  if (!vote) return null
  return Boolean(vote.isUpvoted)
}

async function vote(message: UIMessage, isUpvoted: boolean) {
  const snapshot = (votes.value ?? []).map(v => ({ ...v }))
  const toggling = getVote(message.id) === isUpvoted
  const next = toggling ? null : isUpvoted

  votes.value = next === null
    ? (votes.value ?? []).filter(v => v.messageId !== message.id)
    : [
        ...(votes.value ?? []).filter(v => v.messageId !== message.id),
        { chatId: data.value!.id, messageId: message.id, isUpvoted: next }
      ]

  try {
    await $fetch(`/api/chats/${data.value!.id}/votes`, {
      method: 'POST',
      body: next === null ? { messageId: message.id } : { messageId: message.id, isUpvoted: next }
    })
  } catch {
    votes.value = snapshot
    toast.add({ description: 'Failed to save vote', icon: 'i-lucide-alert-circle', color: 'error' })
  }
}

const site = useSiteConfig()
useHead({ title: () => title.value || 'Nuxi' })
useSeoMeta({
  ogTitle: () => `${title.value || 'Nuxi'} · Nuxt`,
  ogDescription: 'A conversation with Nuxi.',
  ogImage: joinURL(site.url, '/nuxt-agent.jpg')
})
useCanonical()

onMounted(() => {
  if (isOwner.value && data.value?.messages.length === 1 && data.value.messages[0]?.role === 'user') {
    chat.regenerate()
    return
  }
  const prompt = consumePendingPrompt()
  if (prompt) send(prompt)
})
</script>

<template>
  <UDashboardPanel
    id="chat"
    class="relative min-h-0"
    :ui="{ body: 'p-0 sm:p-0 overscroll-y-none' }"
  >
    <template #header>
      <UDashboardNavbar
        class="bg-default sm:px-2"
        :ui="{ left: 'min-w-0' }"
      >
        <template #left>
          <ChatTitle
            :chat-id="chatId"
            :title="title"
            :is-owner="isOwner"
            @update:title="title = $event"
          />
        </template>

        <template #right>
          <ChatVisibility
            v-if="isOwner"
            :chat-id="chatId"
            :visibility="visibility"
            @update:visibility="visibility = $event"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-custom-new-chat"
            to="/dashboard/chat"
            class="lg:hidden"
            aria-label="New chat"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer class="flex-1 flex flex-col gap-4 sm:gap-6">
        <UChatMessages
          should-auto-scroll
          :messages="chat.messages"
          :status="chat.status"
          :user="{ ui: { content: 'px-3 py-1.5 min-h-fit', container: 'gap-3 pb-5', actions: 'right-0' } }"
          :assistant="{ ui: { actions: 'has-data-[state=open]:opacity-100' } }"
          :ui="{ root: '[&>article]:last-of-type:min-h-0' }"
          class="pt-4 pb-4 sm:pb-6"
        >
          <template #indicator>
            <AgentIndicator />
          </template>

          <template #content="{ message }">
            <ChatContent :message="message" />
          </template>

          <template v-if="isOwner" #actions="{ message }">
            <ChatMessageActions
              v-if="message.role === 'assistant'"
              :message="message"
              :vote="getVote(message.id)"
              :streaming="chat.status === 'streaming' && message.id === chat.messages.at(-1)?.id"
              :chat-id="chatId"
              :can-regenerate="message.id === chat.messages.at(-1)?.id && chat.status === 'ready'"
              @vote="(_message, isUpvoted) => vote(_message, isUpvoted)"
              @regenerate="chat.regenerate()"
            />
            <UTooltip
              v-else-if="message.role === 'user' && messageTime(message)"
              :text="messageFullTime(message)!"
              :content="{ side: 'bottom' }"
            >
              <span class="text-xs text-dimmed select-none">{{ messageTime(message) }}</span>
            </UTooltip>
          </template>
        </UChatMessages>

        <div v-if="rateLimitReached" class="sticky bottom-0 flex items-center justify-center gap-2 py-4 text-sm text-muted">
          <UIcon name="i-lucide-clock" class="size-4 shrink-0" />
          <span>Daily limit reached. Try again tomorrow.</span>
        </div>
        <div v-else-if="isOwner || !loggedIn" class="sticky bottom-0 z-10 flex flex-col [view-transition-name:chat-prompt]">
          <AgentLoginHint />
          <UChatPrompt
          v-model="input"
          :error="chat.error"
          variant="subtle"
          class="rounded-b-none"
          :ui="{ base: 'px-1.5' }"
          @submit="onSubmit"
        >
          <template #footer>
            <ClientOnly>
              <UTooltip v-if="usage" text="Daily messages remaining">
                <span class="text-xs text-dimmed" :class="usage.remaining <= 5 ? 'text-warning' : ''">
                  {{ usage.remaining }}/{{ usage.limit }}
                </span>
              </UTooltip>
            </ClientOnly>
            <UChatPromptSubmit
              :status="chat.status"
              color="neutral"
              size="sm"
              @stop="chat.stop()"
              @reload="chat.regenerate()"
            />
          </template>
        </UChatPrompt>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
