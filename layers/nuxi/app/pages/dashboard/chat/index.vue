<script setup lang="ts">
import { joinURL } from 'ufo'
import { buildMessageParts, getMessageTextLength } from '../../../../shared/utils/paste-attachment'

definePageMeta({
  layout: 'dashboard'
})

const site = useSiteConfig()

useHead({ title: 'Nuxi' })
useSeoMeta({
  ogTitle: 'Nuxi · Nuxt',
  ogDescription: 'Nuxi helps you explore the documentation — ask about Nuxt, modules, deployment, and more.',
  ogImage: joinURL(site.url, '/nuxt-agent.jpg'),
  twitterTitle: 'Nuxi · Nuxt',
  twitterDescription: 'Nuxi helps you explore the documentation — ask about Nuxt, modules, deployment, and more.',
  twitterImage: joinURL(site.url, '/nuxt-agent.jpg')
})
useCanonical()

const { user, loggedIn } = useUserSession()
const agent = useNuxtAgent()
const { usage, rateLimitReached } = agent
const { refresh: refreshChats } = useChatsData()

const input = ref('')
const loading = ref(false)
const {
  attachments: pasteAttachments,
  canSubmit,
  handlePaste,
  removeAttachment,
  restoreToInput,
  buildMessageParts: buildMessagePartsFromInput,
  clearAttachments
} = useTextPasteAttachment(input)

const baseGreeting = computed(() => {
  const name = user.value?.name?.split(' ')[0] || user.value?.username
  return name ? `Hello, ${name}` : 'Hello'
})
const greeting = ref<string>(baseGreeting.value)
onMounted(() => {
  const hour = new Date().getHours()
  let timeGreeting = 'Good evening'
  if (hour < 12) timeGreeting = 'Good morning'
  else if (hour < 18) timeGreeting = 'Good afternoon'
  const name = user.value?.name?.split(' ')[0] || user.value?.username
  greeting.value = name ? `${timeGreeting}, ${name}` : timeGreeting
})

async function createChat(parts: ReturnType<typeof buildMessagePartsFromInput>) {
  if (loading.value || rateLimitReached.value || getMessageTextLength(parts) === 0) return
  loading.value = true

  try {
    if (loggedIn.value) {
      const chat = await $fetch<ChatListItem>('/api/chats', {
        method: 'POST',
        body: {
          id: crypto.randomUUID(),
          message: {
            id: crypto.randomUUID(),
            role: 'user',
            parts
          }
        }
      })
      refreshChats()
      await navigateTo(`/dashboard/chat/${chat?.id}`)
    } else {
      agent.pendingMessageParts.value = parts
      await navigateTo(`/dashboard/chat/${crypto.randomUUID()}`)
    }
  } catch {
    useToast().add({ description: 'Failed to create chat', icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    loading.value = false
  }
}

async function onSubmit() {
  if (!canSubmit.value) return
  const parts = buildMessagePartsFromInput()
  clearAttachments()
  input.value = ''
  await createChat(parts)
}

const suggestions = [
  { icon: 'i-lucide-rocket', label: 'Show me available starter templates' },
  { icon: 'i-lucide-lock', label: 'How do I add authentication to my Nuxt app?' },
  { icon: 'i-lucide-layers', label: 'What are the available rendering modes in Nuxt?' },
  { icon: 'i-lucide-database', label: 'How do I connect a database to my Nuxt app?' },
  { icon: 'i-lucide-cloud', label: 'How do I deploy my Nuxt app?' },
  { icon: 'i-lucide-sparkles', label: 'What\'s new in Nuxt 4?' }
]
</script>

<template>
  <UDashboardPanel
    id="home"
    class="min-h-0"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #header>
      <UDashboardNavbar
        class="bg-default sm:px-4"
      >
        <template #right>
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
      <UContainer class="flex-1 flex flex-col justify-center gap-6 sm:gap-8 py-8">
        <div class="flex flex-col items-center gap-4 sm:gap-6">
          <div class="relative h-36 w-full max-w-2xl shrink-0 overflow-hidden sm:h-40">
            <AgentShader variant="hero" />
            <AgentNuxiIcon class="absolute bottom-0 left-1/2 -translate-x-1/2 size-10 sm:size-12 shrink-0" />
          </div>
          <h1 class="text-2xl sm:text-3xl text-highlighted font-semibold tracking-tight text-center">
            {{ greeting }}
          </h1>
        </div>

        <div class="w-full max-w-2xl mx-auto flex flex-col gap-6">
          <div class="flex flex-col gap-1.5">
            <AgentLoginHint v-if="!loggedIn" />

            <div v-if="rateLimitReached" class="flex items-center justify-center gap-2 py-4 text-sm text-muted">
              <UIcon name="i-lucide-clock" class="size-4 shrink-0" />
              <span>Daily limit reached. Try again tomorrow.</span>
            </div>
            <UChatPrompt
              v-else
              v-model="input"
              placeholder="Ask anything…"
              :status="loading ? 'streaming' : 'ready'"
              variant="subtle"
              :rows="2"
              :maxrows="5"
              autofocus
              class="[view-transition-name:chat-prompt]"
              :ui="{ base: 'px-1.5', footer: 'items-baseline', header: 'px-1.5 pt-1.5 pb-0 gap-1.5 flex flex-wrap items-start' }"
              @submit="onSubmit"
              @paste="handlePaste"
            >
              <template v-if="pasteAttachments.length" #header>
                <AgentPasteAttachment
                  v-for="(attachment, index) in pasteAttachments"
                  :key="attachment.name"
                  :attachment="attachment"
                  @remove="removeAttachment(index)"
                  @restore="restoreToInput(index)"
                />
              </template>

              <template #footer>
                <ClientOnly>
                  <UTooltip v-if="usage" text="Daily messages remaining">
                    <span class="text-xs text-dimmed" :class="usage.remaining <= 5 ? 'text-warning' : ''">
                      {{ usage.remaining }}/{{ usage.limit }}
                    </span>
                  </UTooltip>
                </ClientOnly>
                <UChatPromptSubmit
                  color="neutral"
                  size="sm"
                  :status="loading ? 'streaming' : 'ready'"
                  :disabled="!canSubmit"
                />
              </template>
            </UChatPrompt>
          </div>

          <div class="flex flex-wrap gap-2 justify-center">
            <UButton
              v-for="s in suggestions"
              :key="s.label"
              :icon="s.icon"
              :label="s.label"
              size="sm"
              color="neutral"
              variant="outline"
              class="rounded-full"
              :disabled="loading"
              @click="createChat(buildMessageParts(s.label, []))"
            />
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
