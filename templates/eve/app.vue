<script setup lang="ts">
const { messages, status, error, send, cancel, newSession } = useEveAgent()

const message = ref('')
const isInputDisabled = computed(() => status.value !== 'idle')

async function handleSubmit() {
  const text = message.value.trim()
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
</script>

<template>
  <NuxtExample dir="advanced/eve">
    <template #logo>
      <EveLogo />
    </template>
    <div class="flex flex-col gap-4 max-w-xl mx-auto">
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
          <p
            v-else-if="part.type === 'tool'"
            class="text-sm italic opacity-60"
          >
            {{ part.label }}
          </p>
        </template>
      </div>

      <UAlert
        v-if="error"
        color="error"
        :title="error.message"
      />

      <form
        class="flex gap-2"
        @submit.prevent="handleSubmit"
      >
        <UInput
          v-model="message"
          class="flex-1"
          placeholder="Ask about the weather in Paris..."
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
