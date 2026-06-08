<script setup lang="ts">
import type { UIMessage } from 'ai'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const { loggedIn } = useUserSession()
const { usage, rateLimitReached, consumePendingPrompt, consumePendingMessageParts } = useNuxtAgent()
const { refresh: refreshChats } = useChats()

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

const initialMessages = computed<UIMessage[]>(() => toUIMessages(data.value?.messages ?? []))

const {
  chat,
  input,
  prompt,
  send,
  getVote,
  vote
} = useAgentChat({
  chatId,
  initialMessages: initialMessages.value,
  source: 'chat-page',
  withPageContext: 'always',
  fetchVotes: isOwner.value,
  onFinish: () => {
    if (loggedIn.value) refreshChats()
  }
})

useNuxiChatSeo({
  title,
  description: 'A conversation with Nuxi.'
})

onMounted(() => {
  if (isOwner.value && data.value?.messages.length === 1 && data.value.messages[0]?.role === 'user') {
    chat.regenerate()
    return
  }
  const pendingParts = consumePendingMessageParts()
  if (pendingParts) {
    send({ parts: pendingParts })
    return
  }
  const pendingPrompt = consumePendingPrompt()
  if (pendingPrompt) send(pendingPrompt)
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
      <UContainer class="flex min-w-0 flex-1 flex-col gap-4 sm:gap-6">
        <AgentChatMessages
          :chat="chat"
          :chat-id="chatId"
          :show-actions="isOwner"
          show-user-timestamps
          :spacing-offset="(isOwner || !loggedIn) && !rateLimitReached ? 160 : 0"
          :get-vote="getVote"
          @vote="vote"
        />

        <AgentRateLimitBanner v-if="rateLimitReached" variant="sticky" />
        <div v-else-if="isOwner || !loggedIn" class="sticky bottom-0 z-10 flex flex-col bg-default">
          <div v-if="!loggedIn" class="flex w-full justify-center">
            <AgentLoginHint attached />
          </div>
          <AgentChatPrompt
            v-model="input"
            v-bind="prompt"
            :chat="chat"
            :usage="usage"
            variant="subtle"
            class="rounded-b-none border-b-0 bg-default [view-transition-name:chat-prompt]"
            :ui="{
              root: 'rounded-t-lg rounded-b-none border-b-0 bg-default',
              base: 'px-1.5',
              footer: 'items-baseline',
              header: 'px-1.5 pt-1.5 pb-0 gap-1.5 flex flex-wrap items-start'
            }"
          />
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
