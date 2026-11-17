<script setup lang="ts">
const { toggle, isOpen } = useNuxtAgent()
const { track } = useAnalytics()

function handleToggle() {
  track('Nuxi Toggled', { source: 'header', open: !isOpen.value })
  toggle()
}
</script>

<template>
  <Transition
    enter-active-class="transition-[opacity,scale,filter] duration-250 ease-out motion-reduce:transition-none"
    enter-from-class="opacity-0 scale-80 blur-xs"
  >
    <div
      v-if="!isOpen"
      class="inline-flex items-center"
    >
      <UButton
        color="neutral"
        variant="ghost"
        label="Ask Nuxi"
        aria-label="Ask Nuxi"
        class="group max-sm:p-1.5"
        :ui="{
          base: 'py-1 px-3 gap-2',
          label: 'hidden sm:inline-flex'
        }"
        @click="handleToggle"
      >
        <template #leading>
          <span class="inline-flex size-6 shrink-0 items-center justify-center max-sm:size-5">
            <AgentNuxiIcon class="size-6 max-sm:size-5" />
          </span>
        </template>
      </UButton>
    </div>
  </Transition>
</template>
