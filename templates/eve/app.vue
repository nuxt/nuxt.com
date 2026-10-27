<script setup lang="ts">
import type { Finding } from './agent/lib/triage'

const { messages, status, error, send, cancel, newSession } = useEveAgent()

const message = ref('')
const isInputDisabled = computed(() => status.value !== 'idle')

async function handleSubmit(text = message.value.trim()) {
  if (!text || isInputDisabled.value) {
    return
  }
  message.value = ''
  await send(text)
}

async function newChat() {
  // newSession() only closes the local stream, so stop the running turn on the server first
  if (status.value === 'busy') {
    await cancel().catch(() => {})
  }
  newSession()
}

function findingsOf(output: unknown) {
  return (output as { findings?: Finding[] } | undefined)?.findings
}
</script>

<template>
  <NuxtExample dir="advanced/eve">
    <template #logo>
      <EveLogo />
    </template>
    <div class="flex flex-col gap-4 max-w-2xl mx-auto">
      <div
        v-for="item in messages"
        :key="item.id"
        :class="item.role === 'user' ? 'text-right' : 'text-left'"
      >
        <template
          v-for="(part, index) in item.parts"
          :key="index"
        >
          <p v-if="part.type === 'text'">
            {{ part.text }}
          </p>
          <template v-else-if="part.type === 'tool'">
            <p class="text-sm italic opacity-60">
              {{ part.label }}
            </p>
            <TriageFindings
              v-if="part.name === 'triage_issues' && findingsOf(part.output)"
              :findings="findingsOf(part.output)!"
            />
          </template>
        </template>
      </div>

      <UButton
        v-if="!messages.length"
        class="self-center"
        icon="i-lucide-list-checks"
        :disabled="isInputDisabled"
        @click="handleSubmit('Triage the open issues.')"
      >
        Triage the open issues
      </UButton>

      <UAlert
        v-if="error"
        color="error"
        :title="error.message"
      />

      <form
        class="flex gap-2"
        @submit.prevent="handleSubmit()"
      >
        <UInput
          v-model="message"
          class="flex-1"
          placeholder="Ask about the issues..."
          :disabled="isInputDisabled"
        />
        <UButton
          type="submit"
          icon="i-lucide-send"
          :disabled="isInputDisabled || !message"
        >
          Send
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          @click="newChat"
        >
          New chat
        </UButton>
      </form>
    </div>
  </NuxtExample>
</template>
