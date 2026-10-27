<script setup lang="ts">
const { data, status, error, send, reset } = useEveAgent()

const message = ref('')
const isInputDisabled = computed(() => ['submitted', 'streaming', 'resuming'].includes(status.value))

async function handleSubmit() {
  const text = message.value.trim()
  if (!text || isInputDisabled.value) {
    return
  }
  message.value = ''
  await send(text)
}
</script>

<template>
  <NuxtExample dir="advanced/eve">
    <template #logo>
      <EveLogo />
    </template>
    <div class="flex flex-col gap-4 max-w-xl mx-auto">
      <div
        v-for="item in data.messages"
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
            v-else-if="part.type === 'dynamic-tool'"
            class="text-sm italic opacity-60"
          >
            {{ part.toolMetadata?.eve?.label ?? part.toolName }}
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
          @click="reset"
        >
          New chat
        </UButton>
      </form>
    </div>
  </NuxtExample>
</template>
