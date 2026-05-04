<script setup lang="ts">
const props = defineProps<{
  title: string
  summary: string
}>()

const { chatId } = useNuxtAgent()

const feedback = ref('')
const state = ref<'idle' | 'submitting' | 'success' | 'error'>('idle')
const issueUrl = ref<string | null>(null)
const dismissed = ref(false)

async function submit() {
  state.value = 'submitting'

  try {
    const result = await $fetch<{ url: string }>('/api/agent/feedback', {
      method: 'POST',
      body: {
        chatId: chatId.value,
        title: props.title,
        summary: props.summary,
        userFeedback: feedback.value.trim() || undefined
      }
    })
    issueUrl.value = result.url
    state.value = 'success'
  } catch {
    state.value = 'error'
  }
}
</script>

<template>
  <div v-if="!dismissed" class="rounded-lg border border-default bg-elevated/50 overflow-hidden">
    <template v-if="state === 'success'">
      <div class="flex items-center gap-2.5 px-3 py-2.5">
        <UIcon name="i-lucide-circle-check" class="size-4 text-success shrink-0" />
        <span class="text-sm text-highlighted">Feedback sent, thank you!</span>
      </div>
    </template>

    <template v-else>
      <div class="px-3 pt-2.5 pb-2">
        <UTextarea
          v-model="feedback"
          :rows="2"
          :disabled="state === 'submitting'"
          placeholder="Anything to add? (optional)"
          size="sm"
          autoresize
          class="w-full"
        />
      </div>

      <p class="px-3 pt-1 pb-2 text-xs text-dimmed">
        The conversation context is automatically attached.
      </p>
      <div class="flex items-center gap-2 px-3 py-2 border-t border-default">
        <UButton
          size="xs"
          color="neutral"
          variant="subtle"
          label="Report issue"
          leading-icon="i-lucide-send"
          :loading="state === 'submitting'"
          @click="submit"
        />
        <span v-if="state === 'error'" class="text-xs text-error">Something went wrong, try again.</span>
        <UButton
          v-else
          size="xs"
          color="neutral"
          variant="ghost"
          label="Dismiss"
          :disabled="state === 'submitting'"
          class="text-muted"
          @click="dismissed = true"
        />
      </div>
    </template>
  </div>
</template>
