<script setup lang="ts">
import type { Template } from '#shared/types'

const props = defineProps<{
  starters: Template[]
}>()

const { track } = useAnalytics()
const id = useId()

const selected = ref(props.starters[0]?.slug)
const starter = computed(() => props.starters.find(item => item.slug === selected.value))

function move(offset: number) {
  const index = props.starters.findIndex(item => item.slug === selected.value)
  selected.value = props.starters[(index + offset + props.starters.length) % props.starters.length]?.slug
  document.getElementById(`${id}-${selected.value}`)?.focus()
}
</script>

<template>
  <div v-if="starter" class="max-w-2xl flex flex-col gap-3">
    <div
      role="tablist"
      aria-label="Starter"
      class="flex flex-wrap gap-1"
      @keydown.left.prevent="move(-1)"
      @keydown.right.prevent="move(1)"
    >
      <button
        v-for="item in starters"
        :id="`${id}-${item.slug}`"
        :key="item.slug"
        type="button"
        role="tab"
        :aria-selected="item.slug === selected"
        :aria-controls="`${id}-panel`"
        :tabindex="item.slug === selected ? 0 : -1"
        class="h-8 px-3 flex items-center gap-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary"
        :class="item.slug === selected ? 'bg-elevated text-highlighted ring ring-default' : 'text-muted hover:text-default hover:bg-elevated/50'"
        @click="selected = item.slug; track('Template Action', { template: item.name, action: 'Select Starter' })"
      >
        <UIcon v-if="item.icon" :name="item.icon" class="size-4 shrink-0" :class="item.slug === selected && 'text-primary'" />
        {{ item.name }}
      </button>
    </div>
    <div :id="`${id}-panel`" role="tabpanel" :aria-labelledby="`${id}-${starter.slug}`" class="flex flex-col gap-3">
      <div class="flex gap-2">
        <TemplatesCommand :template="starter" class="flex-1" />
        <UButton
          :to="`/templates/${starter.slug}`"
          label="Preview"
          trailing-icon="i-lucide-arrow-right"
          color="neutral"
          variant="subtle"
          class="h-10 ring-default hover:bg-elevated"
          @click="track('Template Action', { template: starter.name, action: 'Preview Starter' })"
        />
      </div>
      <p class="text-sm text-muted">
        {{ starter.description }}
      </p>
    </div>
  </div>
</template>
