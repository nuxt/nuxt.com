<script setup lang="ts">
const props = defineProps<{ slug: string }>()
const emit = defineEmits<{ checked: [] }>()
const busy = ref(false)
const phase = ref('Waiting for the check')
const result = ref<string>()
const error = ref('')
const phases: Record<string, string> = {
  setup: 'Preparing the check', install: 'Installing dependencies', build: 'Building the template',
  start: 'Starting the app', snapshot: 'Saving the preview'
}
const endpoint = computed(() => `/api/admin/templates/${props.slug}/check` as const)
const { pause, resume } = useIntervalFn(check, 3000, { immediate: false })

async function check() {
  try {
    const current = await $fetch(endpoint.value)
    const wasBusy = busy.value
    busy.value = current.state !== 'idle'
    phase.value = current.phase ? phases[current.phase] : 'Waiting for the check'
    if (busy.value) resume()
    else {
      pause()
      result.value = current.status === 'passed' ? 'Check passed' : current.status === 'failed' ? `Check failed${current.step ? ` during ${current.step}` : ''}` : undefined
      if (wasBusy) emit('checked')
    }
  } catch {
    pause()
    busy.value = false
    error.value = 'Could not read the check status. Try again.'
  }
}

async function start() {
  error.value = ''
  result.value = undefined
  busy.value = true
  try {
    await $fetch(endpoint.value, { method: 'POST' })
    await check()
  } catch {
    busy.value = false
    error.value = 'Could not start the template check. Try again.'
  }
}

onMounted(check)
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 text-xs text-muted" aria-live="polite">
    <UButton
      label="Recheck template"
      icon="i-lucide-rotate-ccw"
      color="neutral"
      variant="subtle"
      size="xs"
      :loading="busy"
      @click="start"
    />
    <span v-if="busy">{{ phase }}</span>
    <span v-else-if="error" role="alert">{{ error }}</span>
    <span v-else-if="result">{{ result }}</span>
  </div>
</template>
