<script setup lang="ts">
import type { DefineComponent } from 'vue'
import { Chat } from '@ai-sdk/vue'
import type { UIMessage } from 'ai'
import { DefaultChatTransport } from 'ai'
import ProseStreamPre from '../prose/PreStream.vue'

const components = {
  pre: ProseStreamPre as unknown as DefineComponent
}

const messages = defineModel<UIMessage[]>('messages')
const fullscreen = defineModel<boolean>('fullscreen')

const emits = defineEmits<{
  close: []
}>()

const input = ref('')

const lastMessage = computed(() => chat.messages.at(-1))
const showThinking = computed(() => chat.status === 'streaming' && lastMessage.value?.role === 'assistant' && lastMessage.value?.parts?.length === 0)

const toast = useToast()

function getAgentCalls(message: any) {
  if (showThinking.value && message.role === 'assistant') {
    return [{
      type: 'thinking',
      state: 'calling'
    }]
  }

  return message.parts
    .filter((p: any) => p.type === 'tool-nuxt-agent' || p.type === 'tool-nuxt-ui-agent')
    .map((p: any) => ({
      type: p.type === 'tool-nuxt-agent' ? 'nuxt' : 'nuxt-ui',
      state: p.state === 'output-available' ? 'done' : 'calling'
    }))
}

const chat = new Chat({
  messages: messages.value,
  transport: new DefaultChatTransport({
    api: '/api/search'
  }),
  onError: (error) => {
    const { message } = typeof error.message === 'string' && error.message[0] === '{' ? JSON.parse(error.message) : error

    toast.add({
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
      duration: 0
    })
  },
  onFinish: () => {
    messages.value = chat.messages
  }
})

function handleSubmit(event: Event) {
  event.preventDefault()

  if (!input.value.trim()) {
    return
  }

  chat.sendMessage({
    text: input.value
  })

  input.value = ''
}

function handleClose(e: Event) {
  e.preventDefault()

  emits('close')
}

onMounted(() => {
  if (chat.lastMessage?.role === 'user') {
    chat.regenerate()
  }
})
</script>

<template>
  <UChatPalette>
    <UChatMessages
      should-auto-scroll
      :messages="chat.messages"
      :status="chat.status"
      :user="{ side: 'left', variant: 'naked', avatar: { icon: 'i-lucide-user', size: 'xs' } }"
      :assistant="{ avatar: { icon: 'i-simple-icons-nuxtdotjs', size: 'xs' } }"
    >
      <template #content="{ message }">
        <div class="*:first:mt-0! *:last:mb-0!">
          <AgentStatus
            v-if="getAgentCalls(message).length > 0 || (showThinking && message.role === 'assistant')"
            :agents="getAgentCalls(message)"
          />

          <template v-for="(part, index) in message.parts" :key="`${message.id}-${part.type}-${index}${'state' in part ? `-${part.state}` : ''}`">
            <Reasoning
              v-if="part.type === 'reasoning'"
              :text="part.text"
              :is-streaming="part.state !== 'done'"
            />
            <MDCCached
              v-else-if="part.type === 'text'"
              :value="part.text"
              :cache-key="`${message.id}-${index}`"
              :components="components"
              :parser-options="{ highlight: false }"
              class="*:first:mt-0 *:last:mb-0"
            />
          </template>
        </div>
      </template>
    </UChatMessages>

    <template #prompt>
      <UChatPrompt
        v-model="input"
        icon="i-lucide-message-circle"
        variant="naked"
        :error="chat.error"
        :ui="{ trailing: 'items-center' }"
        @submit="handleSubmit"
        @close="handleClose"
      >
        <template #trailing>
          <UButton
            :icon="fullscreen ? 'i-lucide-maximize' : 'i-lucide-minimize'"
            color="neutral"
            variant="ghost"
            class="group"
            :ui="{ leadingIcon: 'text-dimmed group-hover:text-muted transition' }"
            @click="fullscreen = !fullscreen"
          />
        </template>
      </UChatPrompt>
    </template>
  </UChatPalette>
</template>
