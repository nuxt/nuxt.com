<script setup lang="ts">
import type { UIMessage } from 'ai'
import { joinURL } from 'ufo'

definePageMeta({
  layout: 'chat'
})

const route = useRoute()
const toast = useToast()
const { usage, rateLimitReached } = useNuxtAgent()

const { data, error } = await useFetch<ChatDetail>(`/api/chats/${route.params.id}`, {
  key: `chat-${route.params.id}`,
  cache: 'force-cache'
})

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Chat not found', fatal: true })
}

const isOwner = computed(() => data.value?.isOwner ?? false)
const visibility = ref<'public' | 'private'>(data.value?.visibility ?? 'private')
const title = ref<string | null>(data.value?.title ?? null)
watch(() => data.value?.title, (next) => {
  title.value = next ?? null
})

const { data: votes } = await useLazyFetch<ChatVoteRow[]>(`/api/chats/${route.params.id}/votes`, {
  immediate: isOwner.value,
  default: () => []
})

const initialMessages = computed<UIMessage[]>(() =>
  (data.value?.messages ?? []).map(m => ({
    id: m.id,
    role: m.role,
    parts: (m.parts ?? []) as UIMessage['parts']
  }))
)

const {
  chat,
  input,
  vote: castVote,
  onSubmit
} = useAgentChat({
  chatId: data.value!.id,
  initialMessages: initialMessages.value,
  source: 'chat-page',
  withPageContext: 'always',
  onFinish: () => refreshNuxtData('chats')
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
  // Keep `useAgentChat` in-memory map in sync for downstream consumers.
  castVote(message, next ?? false)
}

const site = useSiteConfig()
useHead({ title: () => title.value || 'Nuxt Agent' })
useSeoMeta({
  ogTitle: () => `${title.value || 'Nuxt Agent'} · Nuxt`,
  ogDescription: 'A conversation with the Nuxt Agent.',
  ogImage: joinURL(site.url, '/nuxt-agent.jpg')
})
useCanonical()

// Mirror the chat template: when landing on a fresh chat that only has the
// user's first message, kick off the assistant response.
onMounted(() => {
  if (isOwner.value && data.value?.messages.length === 1) {
    chat.regenerate()
  }
})
</script>

<template>
  <UDashboardPanel
    v-if="data?.id"
    id="chat"
    class="relative min-h-0"
    :ui="{ body: 'p-0 sm:p-0 overscroll-y-none' }"
  >
    <template #header>
      <UDashboardNavbar
        class="absolute top-0 inset-x-0 border-b-0 z-10 backdrop-blur lg:backdrop-blur-none pointer-events-none sm:px-4"
        :ui="{ left: 'pointer-events-auto min-w-0', right: 'pointer-events-auto' }"
      >
        <template #left>
          <ChatTitle
            :chat-id="data!.id"
            :title="title"
            :is-owner="isOwner"
            @update:title="title = $event"
          />
        </template>

        <template #right>
          <ChatVisibility
            v-if="isOwner"
            :chat-id="data!.id"
            :visibility="visibility"
            @update:visibility="visibility = $event"
          />
          <UColorModeButton />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-custom-new-chat"
            to="/chat"
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
          :spacing-offset="isOwner ? 160 : 0"
          class="pt-(--ui-header-height) pb-4 sm:pb-6"
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
              @vote="(_message, isUpvoted) => vote(_message, isUpvoted)"
            />
          </template>
        </UChatMessages>

        <div v-if="rateLimitReached" class="sticky bottom-0 flex items-center justify-center gap-2 py-4 text-sm text-muted">
          <UIcon name="i-lucide-clock" class="size-4 shrink-0" />
          <span>Daily limit reached. Try again tomorrow.</span>
        </div>
        <UChatPrompt
          v-else-if="isOwner"
          v-model="input"
          :error="chat.error"
          variant="subtle"
          class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10"
          :ui="{ base: 'px-1.5' }"
          @submit="onSubmit"
        >
          <template #footer>
            <UTooltip v-if="usage" text="Daily messages remaining">
              <span class="text-xs text-dimmed" :class="usage.remaining <= 5 ? 'text-warning' : ''">
                {{ usage.remaining }}/{{ usage.limit }}
              </span>
            </UTooltip>
            <UChatPromptSubmit
              :status="chat.status"
              color="neutral"
              size="sm"
              @stop="chat.stop()"
              @reload="chat.regenerate()"
            />
          </template>
        </UChatPrompt>
      </UContainer>
    </template>
  </UDashboardPanel>

  <UContainer v-else class="flex-1 flex flex-col gap-4 sm:gap-6">
    <UError :error="{ statusMessage: 'Chat not found', statusCode: 404 }" class="min-h-full" />
  </UContainer>
</template>
