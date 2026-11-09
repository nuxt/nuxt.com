<script setup lang="ts">
const props = defineProps<{ slug: string }>()
const emit = defineEmits<{ checked: [] }>()
const toast = useToast()
const busy = ref(false)
const phase = ref('Check queued')
const phases: Record<string, string> = {
  setup: 'Preparing check', install: 'Installing', build: 'Building',
  start: 'Starting app', snapshot: 'Saving preview'
}
const endpoint = computed(() => `/api/admin/templates/${props.slug}/check` as const)
const { pause, resume } = useIntervalFn(check, 3000, { immediate: false })
let requestId = 0
let appliedId = 0

async function check() {
  const id = ++requestId
  try {
    const current = await $fetch(endpoint.value)
    if (id <= appliedId) return
    appliedId = id
    const wasBusy = busy.value
    busy.value = current.state !== 'idle'
    phase.value = current.phase ? phases[current.phase] : 'Check queued'
    if (busy.value) resume()
    else {
      pause()
      if (wasBusy) {
        if (current.status) toast.add({
          title: current.status === 'passed' ? 'Template check passed' : 'Template check failed',
          description: current.status === 'failed' && current.step ? `Failed during the ${current.step} step.` : undefined,
          color: current.status === 'passed' ? 'success' : 'error'
        })
        emit('checked')
      }
    }
  } catch {
    if (id <= appliedId) return
    appliedId = id
    if (busy.value) resume()
    else pause()
    toast.add({ id: 'template-check-status', title: 'Could not read the check status. Try again.', color: 'error' })
  }
}

async function start() {
  appliedId = ++requestId
  pause()
  busy.value = true
  try {
    await $fetch(endpoint.value, { method: 'POST' })
    await check()
  } catch {
    busy.value = false
    toast.add({ title: 'Could not start the template check. Try again.', color: 'error' })
  }
}

onMounted(check)
</script>

<template>
  <div class="inline-flex" aria-live="polite">
    <UTooltip text="Rebuild this template and refresh its live preview">
      <UButton
        :label="busy ? phase : 'Recheck'"
        icon="i-lucide-rotate-ccw"
        color="neutral"
        variant="ghost"
        :loading="busy"
        :aria-label="busy ? phase : 'Recheck template'"
        @click="start"
      />
    </UTooltip>
  </div>
</template>
