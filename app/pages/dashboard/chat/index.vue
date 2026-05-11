<script setup lang="ts">
import { joinURL } from 'ufo'

definePageMeta({
  layout: 'dashboard'
})

const site = useSiteConfig()

useHead({ title: 'Nuxt Agent' })
useSeoMeta({
  ogTitle: 'Nuxt Agent · Nuxt',
  ogDescription: 'The Nuxt Agent helps you explore the documentation — ask about Nuxt, modules, deployment, and more.',
  ogImage: joinURL(site.url, '/nuxt-agent.jpg'),
  twitterTitle: 'Nuxt Agent · Nuxt',
  twitterDescription: 'The Nuxt Agent helps you explore the documentation — ask about Nuxt, modules, deployment, and more.',
  twitterImage: joinURL(site.url, '/nuxt-agent.jpg')
})
useCanonical()

const { user } = useUserSession()
const { usage, rateLimitReached } = useNuxtAgent()
const { refresh: refreshChats } = useChatsData()

const input = ref('')
const loading = ref(false)

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

async function createChat(prompt: string) {
  if (loading.value || rateLimitReached.value) return
  input.value = prompt
  loading.value = true

  try {
    const chat = await $fetch<ChatListItem>('/api/chats', {
      method: 'POST',
      body: {
        id: crypto.randomUUID(),
        message: {
          id: crypto.randomUUID(),
          role: 'user',
          parts: [{ type: 'text', text: prompt }]
        }
      }
    })
    refreshChats()
    await navigateTo(`/dashboard/chat/${chat?.id}`)
  } finally {
    loading.value = false
  }
}

async function onSubmit() {
  if (!input.value.trim()) return
  await createChat(input.value.trim())
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
          </div>
          <h1 class="text-2xl sm:text-3xl text-highlighted font-semibold tracking-tight text-center">
            {{ greeting }}
          </h1>
        </div>

        <div class="w-full max-w-2xl mx-auto flex flex-col gap-6">
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
            :ui="{ base: 'px-1.5', footer: 'items-baseline' }"
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
                color="neutral"
                size="sm"
                :status="loading ? 'streaming' : 'ready'"
                :disabled="!input.trim()"
              />
            </template>
          </UChatPrompt>

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
              @click="createChat(s.label)"
            />
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
