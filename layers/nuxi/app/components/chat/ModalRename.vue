<script setup lang="ts">
const props = defineProps<{
  title?: string
}>()

const emit = defineEmits<{ close: [string | false] }>()

const value = ref(props.title ?? '')

const trimmed = computed(() => value.value.trim())

function submit() {
  if (!trimmed.value) return
  emit('close', trimmed.value)
}
</script>

<template>
  <UModal
    title="Rename chat"
    description="Choose a new title for this chat."
    :ui="{ footer: 'flex-row-reverse justify-start' }"
    :close="false"
  >
    <template #body>
      <UInput
        v-model="value"
        autofocus
        size="lg"
        placeholder="Chat title"
        class="w-full"
        :ui="{ root: 'w-full' }"
        @keydown.enter.prevent="submit"
      />
    </template>

    <template #footer>
      <UButton label="Save" :disabled="!trimmed" @click="submit" />
      <UButton color="neutral" variant="ghost" label="Cancel" @click="emit('close', false)" />
    </template>
  </UModal>
</template>
