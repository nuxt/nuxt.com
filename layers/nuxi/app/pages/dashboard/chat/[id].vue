<script setup lang="ts">
import { refreshChatIfIncomplete, useAgentChatSession } from '../../../composables/useAgentChatSession'

definePageMeta({
  layout: 'dashboard',
  key: route => route.params.id as string
})

const route = useRoute()
const nuxtApp = useNuxtApp()
const { loggedIn } = useUserSession()
const { usage, rateLimitReached, consumePendingPrompt, consumePendingMessageParts } = useNuxtAgent()
const { refresh: refreshChats } = useChats()

const chatId = route.params.id as string

const { data, error } = await useFetch<ChatDetail>(
  () => loggedIn.value ? `/api/chats/${chatId}` : null,
  {
    key: `chat-${chatId}`,
    getCachedData: key => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
  }
)

onMounted(() => {
  if (loggedIn.value) void refreshChatIfIncomplete(chatId, data)
})

if (loggedIn.value && (error.value || !data.value)) {
  throw createError({ statusCode: 404, statusMessage: 'Chat not found', fatal: true })
}

const isOwner = computed(() => data.value?.isOwner ?? false)
const visibility = ref<'public' | 'private' | 'admin'>(data.value?.visibility ?? 'private')
const title = ref<string | null>(loggedIn.value ? (data.value?.title ?? null) : null)
watch(() => data.value?.title, (next) => {
  if (loggedIn.value) title.value = next ?? null
})

const {
  chat,
  input,
  prompt,
  getVote,
  vote,
  onSubmit,
  handlePaste,
  removeAttachment,
  restoreToInput
} = useAgentChatSession({
  chatId,
  initialMessages: loggedIn.value ? dbRowsToUIMessages(data.value?.messages ?? []) : [],
  initialState: data.value?.state ?? null,
  data,
  source: 'chat-page',
  withPageContext: 'always',
  fetchVotes: isOwner.value,
  isOwner,
  consumePendingPrompt,
  consumePendingMessageParts,
  onTitle: (generatedTitle) => {
    title.value = generatedTitle
  },
  onFinish: () => {
    if (loggedIn.value) refreshChats()
  },
  onAnonymousTitle: (parts) => {
    if (!title.value) title.value = titleFromParts(parts)
  },
  redirectIfAnonymousEmpty: () => navigateTo('/dashboard/chat')
})

useNuxiChatSeo({
  title,
  description: 'A conversation with Nuxi.'
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
        <AgentChatBody
          v-if="isOwner || !loggedIn"
          v-model:input="input"
          :chat="chat"
          :chat-id="chatId"
          :prompt="prompt"
          :usage="usage"
          :rate-limit-reached="rateLimitReached"
          :show-actions="isOwner"
          show-user-timestamps
          :spacing-offset="(isOwner || !loggedIn) && !rateLimitReached ? 160 : 0"
          :get-vote="getVote"
          variant="subtle"
          prompt-class="rounded-b-none border-b-0 bg-default [view-transition-name:chat-prompt]"
          :prompt-ui="{
            root: 'rounded-t-lg rounded-b-none border-b-0 bg-default',
            base: 'px-1.5',
            footer: 'items-baseline',
            header: 'px-1.5 pt-1.5 pb-0 gap-1.5 flex flex-wrap items-start'
          }"
          @submit="onSubmit"
          @paste="handlePaste"
          @remove-attachment="removeAttachment"
          @restore-attachment="restoreToInput"
          @vote="vote"
        />

        <AgentChatMessages
          v-else
          :chat="chat"
          :chat-id="chatId"
          :show-actions="false"
          :get-vote="getVote"
          class="flex-1 pt-4 pb-4 sm:pb-6"
        />
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
