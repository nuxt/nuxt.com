<script setup lang="ts">
import { setupStaleChatRefresh, useNuxiChat } from '../../../composables/useNuxiChat'
import { resolveChatRouteId, useChatDetail, useChatRouteId } from '../../../composables/useChatDetail'

definePageMeta({
  layout: 'dashboard',
  viewTransition: true,
  key: route => resolveChatRouteId(route.path, route.params.id) || route.path
})

const chatId = useChatRouteId()
const { loggedIn } = useUserSession()
const { usage, rateLimitReached, consumePendingPrompt, consumePendingMessageParts } = useNuxtAgent()
const { refresh: refreshChats } = useChats()

const { data, error, status, refresh } = useChatDetail(chatId)

setupStaleChatRefresh({ chatId, data, status, refresh })

watch([error, status, loggedIn], () => {
  if (!loggedIn.value || status.value === 'pending' || status.value === 'idle') return
  if (error.value || !data.value) {
    throw createError({ statusCode: 404, statusMessage: 'Chat not found', fatal: true })
  }
}, { immediate: true })

const isOwner = computed(() => data.value?.isOwner ?? false)
const visibility = ref<'public' | 'private' | 'admin'>(data.value?.visibility ?? 'private')
const title = ref<string | null>(loggedIn.value ? (data.value?.title ?? null) : null)

watch(() => data.value?.title, (next) => {
  if (loggedIn.value) title.value = next ?? null
})

watch(data, (detail) => {
  if (detail?.visibility) visibility.value = detail.visibility
}, { immediate: true })

const initialMessages = computed(() =>
  loggedIn.value ? dbRowsToUIMessages(data.value?.messages ?? []) : []
)
const initialState = computed(() => data.value?.state ?? null)

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
} = useNuxiChat({
  chatId,
  initialMessages,
  initialState,
  data,
  dataStatus: status,
  source: 'chat-page',
  withPageContext: 'always',
  fetchVotes: isOwner,
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
